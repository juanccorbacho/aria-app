import { supabase } from '@/services/supabase';
import type { Transaction, TransactionType } from '@/types/models';

export type CreateTransactionInput = {
  userId: string;
  title: string;
  category?: string | null;
  amountCents: number;
  type: TransactionType;
  date: string;
};

export const getTransactions = async (userId: string): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return [];
  }

  const transactions: Transaction[] = data.map((row) => ({
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    category: (row.category as string | null) ?? null,
    amountCents: row.amount_cents as number,
    type: row.type as TransactionType,
    date: row.date as string,
    createdAt: row.created_at as string,
  }));

  return transactions;
};

export const createTransaction = async (input: CreateTransactionInput): Promise<Transaction> => {
  const payload = {
    user_id: input.userId,
    title: input.title,
    category: input.category ?? null,
    amount_cents: input.amountCents,
    type: input.type,
    date: input.date,
  };

  const { data, error } = await supabase.from('transactions').insert(payload).select().single();

  if (error) {
    throw new Error(error.message);
  }

  const row = data;

  const transaction: Transaction = {
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    category: (row.category as string | null) ?? null,
    amountCents: row.amount_cents as number,
    type: row.type as TransactionType,
    date: row.date as string,
    createdAt: row.created_at as string,
  };

  return transaction;
};

