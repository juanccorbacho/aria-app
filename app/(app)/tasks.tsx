import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, View, TouchableOpacity, TextInput, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useTasks } from "@/hooks/useTasks";
import type { Task } from "@/types/models";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

const formatDateBR = (isoDate: string): string => {
  const [year, month, day] = isoDate.split("-").map((chunk) => Number(chunk));
  if (!year || !month || !day) return isoDate;
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
};

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

const formatDueDateInput = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
};

const toIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isRealIsoDate = (value: string): boolean => {
  if (!isoDateRegex.test(value)) return false;
  const [year, month, day] = value.split("-").map((chunk) => Number(chunk));
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

export default function TasksScreen(): React.JSX.Element {
  const isDesktop = useIsDesktop();
  const insets = useSafeAreaInsets();
  const { tasks, isLoading, errorMessage, createTask, toggleTask, deleteTask } = useTasks();
  const [showForm, setShowForm] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const dueDateError = useMemo((): string | null => {
    const trimmed = dueDate.trim();
    if (trimmed.length === 0) return null;
    if (!isoDateRegex.test(trimmed) || !isRealIsoDate(trimmed)) return "Data inválida. Use o formato AAAA-MM-DD";
    if (trimmed < toIsoDate(new Date())) return "Data não pode ser anterior a hoje";
    return null;
  }, [dueDate]);

  const canAdd = useMemo(() => title.trim().length > 0 && !dueDateError, [title, dueDateError]);

  const orderedTasks = useMemo((): Task[] => {
    return [...tasks].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (!a.completed && !b.completed) {
        if (Boolean(a.dueDate) !== Boolean(b.dueDate)) return a.dueDate ? -1 : 1;
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      }
      return 0;
    });
  }, [tasks]);

  const handleAddTask = async (): Promise<void> => {
    if (!canAdd || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const trimmed = title.trim();
      const trimmedDueDate = dueDate.trim();
      await createTask({ title: trimmed, dueDate: trimmedDueDate.length > 0 ? trimmedDueDate : null });
      handleCancel();
    } catch (error: unknown) {
      Alert.alert("Erro ao adicionar tarefa", error instanceof Error ? error.message : "Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = (): void => {
    setTitle(""); setDueDate(""); setShowForm(false);
  };

  const handleToggle = async (task: Task): Promise<void> => {
    try { await toggleTask(task.id); } 
    catch (error: unknown) { Alert.alert("Erro", error instanceof Error ? error.message : "Tente novamente."); }
  };

  const handleDelete = (task: Task): void => {
    Alert.alert("Excluir tarefa", "Tem certeza que deseja excluir esta tarefa?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => {
          try { await deleteTask(task.id); } 
          catch (error: unknown) { Alert.alert("Erro", error instanceof Error ? error.message : "Tente novamente."); }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <ThemedView className="flex-1 items-center justify-center bg-[#0A0A0A]">
        <ActivityIndicator size="large" color="#ffffff" />
      </ThemedView>
    );
  }

  if (errorMessage) {
    return (
      <ThemedView className="flex-1 items-center justify-center bg-[#0A0A0A]">
        <ThemedText className="text-red-500">{errorMessage}</ThemedText>
      </ThemedView>
    );
  }

  const containerStyle = { maxWidth: isDesktop ? "100%" as const : 720 };

  return (
    <ThemedView className="flex-1 bg-[#0A0A0A]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 28 }}>
        <View className="w-full self-center flex flex-col gap-5" style={containerStyle}>
          
          <View className="flex flex-row items-center justify-between gap-4">
            <View className="flex flex-col gap-1">
              <ThemedText type="title" className="text-2xl">Tarefas</ThemedText>
              <ThemedText className="text-white/60">Organize o que precisa ser feito este mês.</ThemedText>
            </View>
            {isDesktop && !showForm ? (
              <TouchableOpacity onPress={() => setShowForm(true)} className="bg-white text-black px-5 py-3 rounded-full">
                <Text className="text-black font-semibold">Nova tarefa</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {showForm && (
            <View className="bg-[#111] border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
              <TextInput value={title} onChangeText={setTitle} placeholder="Nova tarefa" placeholderTextColor="#666" onSubmitEditing={handleAddTask} returnKeyType="done" className="border border-white/10 text-white rounded-xl p-4" />
              <TextInput value={dueDate} onChangeText={(value) => setDueDate(formatDueDateInput(value))} placeholder="Vencimento (YYYY-MM-DD)" placeholderTextColor="#666" autoCapitalize="none" autoCorrect={false} maxLength={10} keyboardType="numbers-and-punctuation" className="border border-white/10 text-white rounded-xl p-4" />
              {dueDateError && <ThemedText className="text-red-500 text-xs">{dueDateError}</ThemedText>}

              <View className="flex flex-col gap-3 mt-3">
                <TouchableOpacity onPress={handleAddTask} disabled={!canAdd || isSubmitting} className={`items-center py-3 rounded-full bg-white ${(!canAdd || isSubmitting) ? "opacity-50" : ""}`}>
                  <Text className="text-black font-semibold">Adicionar tarefa</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCancel} className="items-center py-3 rounded-full border border-white/10">
                  <Text className="text-white">Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View className="bg-[#111] rounded-2xl px-4 border border-white/10">
            {orderedTasks.length === 0 ? (
              <ThemedText className="text-center py-5 text-white/60">Sem tarefas por aqui.</ThemedText>
            ) : (
              orderedTasks.map((task, index) => (
                <View key={task.id} className={`flex flex-row items-center gap-4 py-4 ${index === orderedTasks.length - 1 ? "" : "border-b border-white/10"}`}>
                  <TouchableOpacity onPress={() => handleToggle(task)} className={`w-6 h-6 rounded-md border flex items-center justify-center ${task.completed ? "bg-white border-white" : "border-white/60"}`}>
                    {task.completed && <Text className="text-black font-bold text-xs">✓</Text>}
                  </TouchableOpacity>

                  <View className="flex-1 flex col gap-1">
                    <ThemedText className={`font-semibold ${task.completed ? "line-through opacity-60" : ""}`}>
                      {task.title}
                    </ThemedText>
                    {task.dueDate && (
                      <ThemedText className="text-xs text-white/60">Vence em {formatDateBR(task.dueDate)}</ThemedText>
                    )}
                  </View>

                  <TouchableOpacity onPress={() => handleDelete(task)} className="border border-white/10 rounded-full px-3 py-1">
                    <Text className="text-white text-xs">Excluir</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {!isDesktop && !showForm && (
        <TouchableOpacity
          onPress={() => setShowForm(true)}
          className="absolute right-5 bg-white rounded-full px-5 py-3"
          style={{ bottom: 24 + insets.bottom }}
        >
          <Text className="text-black font-semibold">Nova tarefa</Text>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}
