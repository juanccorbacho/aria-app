import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack, Button, Card, Input } from "tamagui";

import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useTasks } from "@/hooks/useTasks";
import type { Task } from "@/types/models";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

const formatDateBR = (isoDate: string): string => {
  const [year, month, day] = isoDate.split("-").map((chunk) => Number(chunk));
  if (!year || !month || !day) return isoDate;
  const date: Date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
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
  if (!isoDateRegex.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map((chunk) => Number(chunk));
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

export default function TasksScreen(): React.JSX.Element {
  const isDesktop = useIsDesktop();
  const insets = useSafeAreaInsets();
  const { tasks, isLoading, errorMessage, createTask, toggleTask, deleteTask } =
    useTasks();
  const [showForm, setShowForm] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const dueDateError = useMemo((): string | null => {
    const trimmed = dueDate.trim();
    if (trimmed.length === 0) {
      return null;
    }

    if (!isoDateRegex.test(trimmed)) {
      return "Data inválida. Use o formato AAAA-MM-DD";
    }

    if (!isRealIsoDate(trimmed)) {
      return "Data inválida. Use o formato AAAA-MM-DD";
    }

    const today = toIsoDate(new Date());
    if (trimmed < today) {
      return "Data não pode ser anterior a hoje";
    }

    return null;
  }, [dueDate]);

  const canAdd: boolean = useMemo(
    () => title.trim().length > 0 && !dueDateError,
    [title, dueDateError],
  );

  const orderedTasks = useMemo((): Task[] => {
    const copy = [...tasks];
    return copy.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      if (!a.completed && !b.completed) {
        const aHasDate = Boolean(a.dueDate);
        const bHasDate = Boolean(b.dueDate);

        if (aHasDate !== bHasDate) {
          return aHasDate ? -1 : 1;
        }

        if (a.dueDate && b.dueDate) {
          return a.dueDate.localeCompare(b.dueDate);
        }
      }

      return 0;
    });
  }, [tasks]);

  const handleAddTask = async (): Promise<void> => {
    if (!canAdd || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const trimmed = title.trim();
      const trimmedDueDate = dueDate.trim();
      await createTask({
        title: trimmed,
        dueDate: trimmedDueDate.length > 0 ? trimmedDueDate : null,
      });
      setTitle("");
      setDueDate("");
      setShowForm(false);
    } catch (error: unknown) {
      Alert.alert(
        "Erro ao adicionar tarefa",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = (): void => {
    setTitle("");
    setDueDate("");
    setShowForm(false);
  };

  const handleToggle = async (task: Task): Promise<void> => {
    try {
      await toggleTask(task.id);
    } catch (error: unknown) {
      Alert.alert(
        "Erro ao atualizar tarefa",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    }
  };

  const handleDelete = (task: Task): void => {
    Alert.alert(
      "Excluir tarefa",
      "Tem certeza que deseja excluir esta tarefa?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTask(task.id);
            } catch (error: unknown) {
              Alert.alert(
                "Erro ao excluir tarefa",
                error instanceof Error ? error.message : "Tente novamente.",
              );
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <ThemedView f={1} ai="center" jc="center">
        <ActivityIndicator size="large" color="#000000" />
      </ThemedView>
    );
  }

  if (errorMessage) {
    return (
      <ThemedView f={1} ai="center" jc="center">
        <ThemedText color="$danger">{errorMessage}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView f={1}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 28 }}
      >
        <YStack gap="$5" w="100%" maxWidth={isDesktop ? "100%" : 720} als="center">
          
          <XStack ai="center" jc="space-between" gap="$4">
            <YStack gap="$1">
              <ThemedText type="title" fontSize="$7">Tarefas</ThemedText>
              <ThemedText type="default" o={0.6}>Organize o que precisa ser feito este mês.</ThemedText>
            </YStack>
            {isDesktop && !showForm ? (
              <Button onPress={() => setShowForm(true)} bg="$buttonBg" color="$buttonColor" br="$pill">
                Nova tarefa
              </Button>
            ) : null}
          </XStack>

          {showForm && (
            <Card bg="$cardBackground" br="$comfortable" p="$5" bw={1} bc="$cardBorder" gap="$4">
              <Input
                value={title}
                onChangeText={setTitle}
                placeholder="Nova tarefa"
                onSubmitEditing={handleAddTask}
                returnKeyType="done"
                bg="transparent"
                color="$color"
                br="$comfortable"
                bw={1}
                borderColor="$cardBorder"
              />

              <Input
                value={dueDate}
                onChangeText={(value) => setDueDate(formatDueDateInput(value))}
                placeholder="Vencimento (YYYY-MM-DD)"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={10}
                keyboardType="numbers-and-punctuation"
                bg="transparent"
                color="$color"
                br="$comfortable"
                bw={1}
                borderColor="$cardBorder"
              />
              {dueDateError && <ThemedText color="$danger" fontSize={12}>{dueDateError}</ThemedText>}

              <YStack gap="$3" mt="$3">
                <Button onPress={handleAddTask} disabled={!canAdd || isSubmitting} opacity={(!canAdd || isSubmitting) ? 0.5 : 1} bg="$success" br="$comfortable" color="$pureBlack">
                  Adicionar tarefa
                </Button>
                <Button onPress={handleCancel} bg="transparent" br="$comfortable" bw={1} borderColor="$cardBorder">
                  Cancelar
                </Button>
              </YStack>
            </Card>
          )}

          <Card bg="$cardBackground" br="$comfortable" px="$4" py="$2" bw={1} bc="$cardBorder">
            {orderedTasks.length === 0 ? (
              <ThemedText ta="center" py="$5" o={0.6}>Sem tarefas por aqui.</ThemedText>
            ) : (
              orderedTasks.map((task, index) => (
                <XStack key={task.id} ai="center" gap="$4" py="$4" borderBottomWidth={index === orderedTasks.length - 1 ? 0 : 1} borderBottomColor="$cardBorder">
                  <Pressable
                    onPress={() => handleToggle(task)}
                    style={{ width: 24, height: 24, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', borderColor: task.completed ? '#2EEA8A' : '#3A3A3A', backgroundColor: task.completed ? '#2EEA8A' : 'transparent' }}
                  >
                    {task.completed && <Text style={{ color: '#000', fontWeight: 'bold' }}>✓</Text>}
                  </Pressable>

                  <YStack f={1} gap="$1">
                    <ThemedText type="defaultSemiBold" textDecorationLine={task.completed ? "line-through" : "none"} o={task.completed ? 0.6 : 1}>
                      {task.title}
                    </ThemedText>
                    {task.dueDate && (
                      <ThemedText type="default" fontSize={12} o={0.6}>
                        Vence em {formatDateBR(task.dueDate)}
                      </ThemedText>
                    )}
                  </YStack>

                  <Button onPress={() => handleDelete(task)} bg="transparent" bw={1} borderColor="$cardBorder" size="$2" br="$comfortable" color="$danger">
                    Excluir
                  </Button>
                </XStack>
              ))
            )}
          </Card>
        </YStack>
      </ScrollView>

      {!isDesktop && !showForm && (
        <Button
          pos="absolute"
          right={20}
          bottom={24 + insets.bottom}
          bg="$buttonBg"
          color="$buttonColor"
          br="$comfortable"
          onPress={() => setShowForm(true)}
        >
          Nova tarefa
        </Button>
      )}
    </ThemedView>
  );
}
