export type Profile = {
  id: string;
  userId: string;
  fullName: string;
  email: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type TransactionType = 'entrada' | 'saida';

export type BillUrgency = 'alto' | 'medio';

export type Transaction = {
  id: string;
  userId: string;
  title: string;
  category: string | null;
  amountCents: number;
  type: TransactionType;
  date: string;
  createdAt: string;
};

export type Bill = {
  id: string;
  userId: string;
  name: string;
  amountCents: number;
  dueDate: string;
  isPaid: boolean;
  urgency: BillUrgency;
  createdAt: string;
  paidAt: string | null;
};

