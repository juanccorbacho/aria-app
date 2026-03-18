import { supabase } from "@/services/supabase";
import type { Task } from "@/types/models";

type TaskRow = {
  id: string;
  user_id: string;
  title: string;
  completed: boolean;
  due_date: string | null;
  created_at: string;
};

export type CreateTaskInput = {
  userId: string;
  title: string;
  dueDate?: string | null;
};

export type UpdateTaskInput = {
  userId: string;
  taskId: string;
  title?: string;
  completed?: boolean;
  dueDate?: string | null;
};

const mapTask = (row: TaskRow): Task => {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    completed: row.completed,
    dueDate: row.due_date,
    createdAt: row.created_at,
  };
};

export const getTasks = async (userId: string): Promise<Task[]> => {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return [];
  }

  return data.map((row) => mapTask(row as TaskRow));
};

export const createTask = async (input: CreateTaskInput): Promise<Task> => {
  const payload = {
    user_id: input.userId,
    title: input.title,
    completed: false,
    due_date: input.dueDate ?? null,
  };

  const { data, error } = await supabase
    .from("tasks")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapTask(data as TaskRow);
};

export const updateTask = async (input: UpdateTaskInput): Promise<Task> => {
  const payload: Partial<Pick<TaskRow, "title" | "completed" | "due_date">> =
    {};

  if (input.title !== undefined) {
    payload.title = input.title;
  }

  if (input.completed !== undefined) {
    payload.completed = input.completed;
  }

  if (input.dueDate !== undefined) {
    payload.due_date = input.dueDate;
  }

  if (Object.keys(payload).length === 0) {
    throw new Error("Nenhuma atualização informada.");
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(payload)
    .eq("id", input.taskId)
    .eq("user_id", input.userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapTask(data as TaskRow);
};

export const deleteTask = async (
  taskId: string,
  userId: string,
): Promise<void> => {
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
};

export const toggleTask = async (
  taskId: string,
  userId: string,
  completed: boolean,
): Promise<Task> => {
  const { data, error } = await supabase
    .from("tasks")
    .update({ completed })
    .eq("id", taskId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapTask(data as TaskRow);
};
