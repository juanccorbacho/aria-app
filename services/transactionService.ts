import { supabase } from "@/services/supabase";
import type { Transaction, TransactionType } from "@/types/models";

export type CreateTransactionInput = {
  userId: string;
  description: string;
  category?: string | null;
  amountCents: number;
  type: TransactionType;
  date: string;
};

export type UpdateTransactionInput = {
  userId: string;
  transactionId: string;
  description?: string;
  category?: string | null;
  amountCents?: number;
  type?: TransactionType;
  date?: string;
};

export const getTransactions = async (
  userId: string,
): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return [];
  }

  const transactions: Transaction[] = data.map((row) => ({
    id: row.id as string,
    userId: row.user_id as string,
    description: row.description as string,
    category: (row.category as string | null) ?? null,
    amountCents: row.amount_cents as number,
    type: row.type as TransactionType,
    date: row.date as string,
    createdAt: row.created_at as string,
  }));

  return transactions;
};

export const createTransaction = async (
  input: CreateTransactionInput,
): Promise<Transaction> => {
  const payload = {
    user_id: input.userId,
    description: input.description,
    category: input.category ?? null,
    amount_cents: input.amountCents,
    type: input.type,
    date: input.date,
  };

  const { data, error } = await supabase
    .from("transactions")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const row = data;

  const transaction: Transaction = {
    id: row.id as string,
    userId: row.user_id as string,
    description: row.description as string,
    category: (row.category as string | null) ?? null,
    amountCents: row.amount_cents as number,
    type: row.type as TransactionType,
    date: row.date as string,
    createdAt: row.created_at as string,
  };

  return transaction;
};

export const updateTransaction = async (
  input: UpdateTransactionInput,
): Promise<Transaction> => {
  const payload: Partial<{
    description: string;
    category: string | null;
    amount_cents: number;
    type: TransactionType;
    date: string;
  }> = {};

  if (input.description !== undefined) {
    payload.description = input.description;
  }

  if (input.category !== undefined) {
    payload.category = input.category;
  }

  if (input.amountCents !== undefined) {
    payload.amount_cents = input.amountCents;
  }

  if (input.type !== undefined) {
    payload.type = input.type;
  }

  if (input.date !== undefined) {
    payload.date = input.date;
  }

  if (Object.keys(payload).length === 0) {
    throw new Error("Nenhuma atualização informada.");
  }

  const { data, error } = await supabase
    .from("transactions")
    .update(payload)
    .eq("id", input.transactionId)
    .eq("user_id", input.userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: data.id as string,
    userId: data.user_id as string,
    description: data.description as string,
    category: (data.category as string | null) ?? null,
    amountCents: data.amount_cents as number,
    type: data.type as TransactionType,
    date: data.date as string,
    createdAt: data.created_at as string,
  };
};

export const deleteTransaction = async (
  transactionId: string,
  userId: string,
): Promise<void> => {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
};
