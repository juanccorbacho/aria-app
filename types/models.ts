export type Profile = {
  id: string;
  workspaceId: string;
  fullName: string;
  email: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type TransactionType = "entrada" | "saida";

export type BillUrgency = "alto" | "medio" | "baixo";

export type Transaction = {
  id: string;
  workspaceId: string;
  description: string;
  category: string | null;
  amountCents: number;
  type: TransactionType;
  date: string;
  createdAt: string;
};

export type Bill = {
  id: string;
  workspaceId: string;
  description: string;
  amountCents: number;
  dueDate: string;
  paid: boolean;
  recurring: boolean;
  urgency: BillUrgency;
  createdAt: string;
};

export type Task = {
  id: string;
  workspaceId: string;
  title: string;
  completed: boolean;
  dueDate: string | null;
  createdAt: string;
};
