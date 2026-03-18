import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useTasks } from "@/hooks/useTasks";
import type { Task } from "@/types/models";

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
      <View style={styles.screen}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.screen}>
        <Text style={styles.errorText}>{errorMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.wrapper,
            isDesktop ? styles.wrapperDesktop : styles.wrapperMobile,
          ]}
        >
          <View style={styles.headerRow}>
            <View style={styles.header}>
              <Text style={styles.title}>Tarefas</Text>
              <Text style={styles.subtitle}>
                Organize o que precisa ser feito este mes.
              </Text>
            </View>
            {isDesktop && !showForm ? (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setShowForm(true)}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Nova tarefa</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {showForm ? (
            <View style={styles.inputCard}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Nova tarefa"
                placeholderTextColor="#6E6E6E"
                style={styles.input}
                onSubmitEditing={handleAddTask}
                returnKeyType="done"
              />
              <TextInput
                value={dueDate}
                onChangeText={(value) => setDueDate(formatDueDateInput(value))}
                placeholder="Vencimento (YYYY-MM-DD)"
                placeholderTextColor="#6E6E6E"
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={10}
                keyboardType="numbers-and-punctuation"
              />
              {dueDateError ? (
                <Text style={styles.inputError}>{dueDateError}</Text>
              ) : null}
              <View style={styles.formActions}>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={handleAddTask}
                  disabled={!canAdd || isSubmitting}
                  style={[
                    styles.addButton,
                    !canAdd && styles.addButtonDisabled,
                  ]}
                >
                  <Text style={styles.addButtonText}>Adicionar tarefa</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={handleCancel}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          <View style={styles.listCard}>
            {orderedTasks.length === 0 ? (
              <Text style={styles.emptyText}>Sem tarefas por aqui.</Text>
            ) : (
              orderedTasks.map((task) => (
                <View key={task.id} style={styles.taskRow}>
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: task.completed }}
                    onPress={() => handleToggle(task)}
                    style={[
                      styles.checkbox,
                      task.completed && styles.checkboxChecked,
                    ]}
                  >
                    {task.completed ? (
                      <Text style={styles.checkboxMark}>✓</Text>
                    ) : null}
                  </Pressable>

                  <View style={styles.taskBody}>
                    <Text
                      style={[
                        styles.taskTitle,
                        task.completed && styles.taskTitleDone,
                      ]}
                    >
                      {task.title}
                    </Text>
                    {task.dueDate ? (
                      <Text style={styles.taskMeta}>
                        Vence em {formatDateBR(task.dueDate)}
                      </Text>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => handleDelete(task)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteButtonText}>Excluir</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
      {!isDesktop && !showForm ? (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => setShowForm(true)}
          style={[styles.fabButton, { bottom: 24 + insets.bottom }]}
        >
          <Text style={styles.fabButtonText}>Nova tarefa</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 28,
    flexGrow: 1,
  },
  scroll: {
    flex: 1,
    width: "100%",
  },
  wrapper: {
    gap: 16,
    width: "100%",
  },
  wrapperDesktop: {
    width: "100%",
  },
  wrapperMobile: {
    maxWidth: 720,
    alignSelf: "center",
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  header: {
    gap: 6,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },
  subtitle: {
    color: "#A0A0A0",
    fontSize: 14,
  },
  inputCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2B2B2B",
    gap: 12,
  },
  input: {
    color: "#FFFFFF",
    fontSize: 15,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#0F0F0F",
    borderWidth: 1,
    borderColor: "#262626",
  },
  addButton: {
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#2EEA8A",
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: "#0D0D0D",
    fontSize: 14,
    fontWeight: "700",
  },
  inputError: {
    color: "#FF4D4F",
    fontSize: 12,
  },
  primaryButton: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: Colors.light.tint,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  fabButton: {
    position: "absolute",
    right: 20,
    bottom: 24,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fabButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  formActions: {
    gap: 10,
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2B2B2B",
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  listCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#2B2B2B",
    gap: 4,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2B2B2B",
  },
  taskBody: {
    flex: 1,
    gap: 4,
  },
  taskTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  taskTitleDone: {
    color: "#7A7A7A",
    textDecorationLine: "line-through",
  },
  taskMeta: {
    color: "#8F8F8F",
    fontSize: 12,
  },
  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3A3A3A",
  },
  deleteButtonText: {
    color: "#FF4D4F",
    fontSize: 12,
    fontWeight: "700",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3A3A3A",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111111",
  },
  checkboxChecked: {
    backgroundColor: "#2EEA8A",
    borderColor: "#2EEA8A",
  },
  checkboxMark: {
    color: "#0D0D0D",
    fontWeight: "800",
    fontSize: 14,
  },
  emptyText: {
    color: "#8F8F8F",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },
  errorText: {
    color: "#FF4D4F",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
