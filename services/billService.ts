import { supabase } from '@/services/supabase';
import type { Bill, BillUrgency } from '@/types/models';

export type CreateBillInput = {
  userId: string;
  name: string;
  amountCents: number;
  dueDate: string;
};

export const getBills = async (userId: string): Promise<Bill[]> => {
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('user_id', userId)
    .eq('is_paid', false)
    .order('due_date', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return [];
  }

  const bills: Bill[] = data.map((row) => ({
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    amountCents: row.amount_cents as number,
    dueDate: row.due_date as string,
    isPaid: row.is_paid as boolean,
    urgency: (row.urgency as BillUrgency) ?? 'medio',
    createdAt: row.created_at as string,
    paidAt: (row.paid_at as string | null) ?? null,
  }));

  return bills;
};

export const createBill = async (input: CreateBillInput): Promise<Bill> => {
  const payload = {
    user_id: input.userId,
    name: input.name,
    amount_cents: input.amountCents,
    due_date: input.dueDate,
    is_paid: false,
  };

  const { data, error } = await supabase.from('bills').insert(payload).select().single();

  if (error) {
    throw new Error(error.message);
  }

  const row = data;

  const bill: Bill = {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    amountCents: row.amount_cents as number,
    dueDate: row.due_date as string,
    isPaid: row.is_paid as boolean,
    urgency: (row.urgency as BillUrgency) ?? 'medio',
    createdAt: row.created_at as string,
    paidAt: (row.paid_at as string | null) ?? null,
  };

  return bill;
};

export const markBillAsPaid = async (billId: string): Promise<void> => {
  const { error } = await supabase
    .from('bills')
    .update({
      is_paid: true,
      paid_at: new Date().toISOString(),
    })
    .eq('id', billId);

  if (error) {
    throw new Error(error.message);
  }
};

