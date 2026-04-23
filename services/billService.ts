import { supabase } from "@/services/supabase";
import type { Bill, BillUrgency, BillStatus } from "@/types/models";

export type CreateBillInput = {
  workspaceId: string;
  profileId: string;
  name: string;
  amountCents: number;
  dueDate: string;
  status?: BillStatus;
  priority: BillUrgency;
};

export const getBills = async (workspaceId: string): Promise<Bill[]> => {
  const { data, error } = await supabase
    .from("bills")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("due_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return [];
  }

  const bills: Bill[] = data.map((row) => ({
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    profileId: row.profile_id as string,
    name: row.name as string,
    amountCents: row.amount_cents as number,
    dueDate: row.due_date as string,
    status: row.status as BillStatus,
    priority: (row.priority as BillUrgency) ?? "MEDIUM",
    createdAt: row.created_at as string,
    updatedAt: (row.updated_at as string | null) ?? null,
  }));

  return bills;
};

export const createBill = async (input: CreateBillInput): Promise<Bill> => {
  const payload = {
    workspace_id: input.workspaceId,
    profile_id: input.profileId,
    name: input.name,
    amount_cents: input.amountCents,
    due_date: input.dueDate,
    status: input.status ?? "PENDING",
    priority: input.priority,
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
    workspaceId: row.workspace_id as string,
    profileId: row.profile_id as string,
    name: row.name as string,
    amountCents: row.amount_cents as number,
    dueDate: row.due_date as string,
    status: row.status as BillStatus,
    priority: (row.priority as BillUrgency) ?? "MEDIUM",
    createdAt: row.created_at as string,
    updatedAt: (row.updated_at as string | null) ?? null,
  };

  return bill;
};

export const toggleBillPaid = async (
  billId: string,
  workspaceId: string,
  status: BillStatus,
): Promise<Bill> => {
  const { data, error } = await supabase
    .from("bills")
    .update({ status })
    .eq("id", billId)
    .eq("workspace_id", workspaceId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: data.id as string,
    workspaceId: data.workspace_id as string,
    profileId: data.profile_id as string,
    name: data.name as string,
    amountCents: data.amount_cents as number,
    dueDate: data.due_date as string,
    status: data.status as BillStatus,
    priority: (data.priority as BillUrgency) ?? "MEDIUM",
    createdAt: data.created_at as string,
    updatedAt: (data.updated_at as string | null) ?? null,
  };
};

export const deleteBill = async (
  billId: string,
  workspaceId: string,
): Promise<void> => {
  const { error } = await supabase
    .from("bills")
    .delete()
    .eq("id", billId)
    .eq("workspace_id", workspaceId);

  if (error) {
    throw new Error(error.message);
  }
};
