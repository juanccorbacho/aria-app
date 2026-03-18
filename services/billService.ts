import { supabase } from "@/services/supabase";
import type { Bill, BillUrgency } from "@/types/models";

export type CreateBillInput = {
  userId: string;
  description: string;
  amountCents: number;
  dueDate: string;
  urgency: BillUrgency;
  paid?: boolean;
  recurring?: boolean;
};

export const getBills = async (userId: string): Promise<Bill[]> => {
  const { data, error } = await supabase
    .from("bills")
    .select("*")
    .eq("user_id", userId)
    .order("due_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return [];
  }

  const bills: Bill[] = data.map((row) => ({
    id: row.id as string,
    userId: row.user_id as string,
    description: row.description as string,
    amountCents: row.amount_cents as number,
    dueDate: row.due_date as string,
    paid: row.paid as boolean,
    recurring: row.recurring as boolean,
    urgency: (row.urgency as BillUrgency) ?? "medio",
    createdAt: row.created_at as string,
  }));

  return bills;
};

export const createBill = async (input: CreateBillInput): Promise<Bill> => {
  const payload = {
    user_id: input.userId,
    description: input.description,
    amount_cents: input.amountCents,
    due_date: input.dueDate,
    urgency: input.urgency,
    paid: input.paid ?? false,
    recurring: input.recurring ?? false,
  };

  const { data, error } = await supabase
    .from("bills")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const row = data;

  const bill: Bill = {
    id: row.id as string,
    userId: row.user_id as string,
    description: row.description as string,
    amountCents: row.amount_cents as number,
    dueDate: row.due_date as string,
    paid: row.paid as boolean,
    recurring: row.recurring as boolean,
    urgency: (row.urgency as BillUrgency) ?? "medio",
    createdAt: row.created_at as string,
  };

  return bill;
};

export const toggleBillPaid = async (
  billId: string,
  userId: string,
  paid: boolean,
): Promise<Bill> => {
  const { data, error } = await supabase
    .from("bills")
    .update({ paid })
    .eq("id", billId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: data.id as string,
    userId: data.user_id as string,
    description: data.description as string,
    amountCents: data.amount_cents as number,
    dueDate: data.due_date as string,
    paid: data.paid as boolean,
    recurring: data.recurring as boolean,
    urgency: (data.urgency as BillUrgency) ?? "medio",
    createdAt: data.created_at as string,
  };
};

export const deleteBill = async (
  billId: string,
  userId: string,
): Promise<void> => {
  const { error } = await supabase
    .from("bills")
    .delete()
    .eq("id", billId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
};
