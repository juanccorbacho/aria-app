import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import type { CreateTaskInput, UpdateTaskInput } from "@/services/taskService";
import {
    createTask as createTaskService,
    deleteTask as deleteTaskService,
    getTasks,
    toggleTask as toggleTaskService,
    updateTask as updateTaskService,
} from "@/services/taskService";
import type { Task } from "@/types/models";

type UseTasksReturn = {
  tasks: Task[];
  isLoading: boolean;
  errorMessage: string | null;
  refresh: () => void;
  createTask: (input: Omit<CreateTaskInput, "userId">) => Promise<void>;
  updateTask: (input: UpdateTaskInput) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
};

export const useTasks = (): UseTasksReturn => {
  const { user } = useAuth();
  const userId: string | undefined = user?.id;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState<number>(0);

  const refresh = useCallback((): void => {
    setRefreshTick((current) => current + 1);
  }, []);

  useEffect(() => {
    const run = async (): Promise<void> => {
      if (!userId) {
        setIsLoading(false);
        setErrorMessage("Usuário não autenticado.");
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const tasksData = await getTasks(userId);
        setTasks(tasksData);
        setIsLoading(false);
      } catch (error: unknown) {
        setIsLoading(false);
        setErrorMessage(
          error instanceof Error ? error.message : "Erro ao carregar tarefas.",
        );
      }
    };

    void run();
  }, [userId, refreshTick]);

  const createTask = useCallback(
    async (input: Omit<CreateTaskInput, "userId">): Promise<void> => {
      if (!userId) {
        setErrorMessage("Usuário não autenticado.");
        throw new Error("Usuário não autenticado.");
      }

      try {
        const created = await createTaskService({
          userId,
          title: input.title,
          dueDate: input.dueDate,
        });
        setTasks((current) => [created, ...current]);
      } catch (error: unknown) {
        setErrorMessage(
          error instanceof Error ? error.message : "Erro ao criar tarefa.",
        );
        throw error;
      }
    },
    [userId],
  );

  const updateTask = useCallback(
    async (input: UpdateTaskInput): Promise<void> => {
      if (!userId) {
        setErrorMessage("Usuário não autenticado.");
        throw new Error("Usuário não autenticado.");
      }

      try {
        const updated = await updateTaskService({
          ...input,
          userId,
        });
        setTasks((current) =>
          current.map((task) => (task.id === updated.id ? updated : task)),
        );
      } catch (error: unknown) {
        setErrorMessage(
          error instanceof Error ? error.message : "Erro ao atualizar tarefa.",
        );
        throw error;
      }
    },
    [userId],
  );

  const deleteTask = useCallback(
    async (taskId: string): Promise<void> => {
      if (!userId) {
        setErrorMessage("Usuário não autenticado.");
        throw new Error("Usuário não autenticado.");
      }

      try {
        await deleteTaskService(taskId, userId);
        setTasks((current) => current.filter((task) => task.id !== taskId));
      } catch (error: unknown) {
        setErrorMessage(
          error instanceof Error ? error.message : "Erro ao excluir tarefa.",
        );
        throw error;
      }
    },
    [userId],
  );

  const toggleTask = useCallback(
    async (taskId: string): Promise<void> => {
      if (!userId) {
        setErrorMessage("Usuário não autenticado.");
        throw new Error("Usuário não autenticado.");
      }

      const currentTask = tasks.find((task) => task.id === taskId);

      if (!currentTask) {
        return;
      }

      try {
        const updated = await toggleTaskService(
          taskId,
          userId,
          !currentTask.completed,
        );
        setTasks((current) =>
          current.map((task) => (task.id === updated.id ? updated : task)),
        );
      } catch (error: unknown) {
        setErrorMessage(
          error instanceof Error ? error.message : "Erro ao atualizar tarefa.",
        );
        throw error;
      }
    },
    [tasks, userId],
  );

  return {
    tasks,
    isLoading,
    errorMessage,
    refresh,
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
  };
};
