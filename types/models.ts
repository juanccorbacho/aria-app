export type Profile = {
  id: string;
  workspaceId: string;
  fullName: string;
  email: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type TransactionType = "INCOME" | "EXPENSE";

export type BillUrgency = "HIGH" | "MEDIUM" | "LOW";

export type SplitType = "equal" | "percentage" | "fixed";

export type Transaction = {
  id: string;
  workspaceId: string;
  profileId: string;
  description: string | null;
  category: string | null;
  amountCents: number;
  type: TransactionType;
  occurredAt: string;
  createdAt: string;
};

export type BillStatus = "PENDING" | "PAID";

export type Bill = {
  id: string;
  workspaceId: string;
  profileId: string;
  name: string;
  amountCents: number;
  dueDate: string;
  status: BillStatus;
  priority: BillUrgency;
  createdAt: string;
  updatedAt: string | null;
};

export type Task = {
  id: string;
  workspaceId: string;
  title: string;
  completed: boolean;
  dueDate: string | null;
  createdAt: string;
};
