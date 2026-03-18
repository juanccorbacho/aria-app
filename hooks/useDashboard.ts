import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { getBills } from "@/services/billService";
import { getProfile } from "@/services/profileService";
import { getTasks } from "@/services/taskService";
import { getTransactions } from "@/services/transactionService";
import type {
    Bill,
    Profile,
    Transaction,
    TransactionType,
} from "@/types/models";

type UseDashboardReturn = {
  profile: Profile | null;
  saldoMesCents: number; // entradas - saídas do mês atual
  totalPendentesCents: number; // bills paid=false
  urgentBills: Bill[];
  pendingTasksCount: number;
  recentTransactions: Transaction[];
  isLoading: boolean;
  errorMessage: string | null;
  refresh: () => void;
};

const isIncomeType = (type: TransactionType): boolean => {
  return type === "entrada";
};

const isExpenseType = (type: TransactionType): boolean => {
  return type === "saida";
};

export const useDashboard = (): UseDashboardReturn => {
  const { user } = useAuth();
  const userId: string | undefined = user?.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [saldoMesCents, setSaldoMesCents] = useState<number>(0);
  const [totalPendentesCents, setTotalPendentesCents] = useState<number>(0);
  const [urgentBills, setUrgentBills] = useState<Bill[]>([]);
  const [pendingTasksCount, setPendingTasksCount] = useState<number>(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    [],
  );
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
        const [profileData, transactionsData, billsData, tasksData] =
          await Promise.all([
            getProfile(userId),
            getTransactions(userId),
            getBills(userId),
            getTasks(userId),
          ]);

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const startISO = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}-${String(monthStart.getDate()).padStart(2, "0")}`;
        const endISO = `${monthEnd.getFullYear()}-${String(monthEnd.getMonth() + 1).padStart(2, "0")}-${String(monthEnd.getDate()).padStart(2, "0")}`;

        const currentMonthTransactions = transactionsData.filter(
          (transaction) =>
            transaction.date >= startISO && transaction.date <= endISO,
        );

        const entradasCents: number = currentMonthTransactions
          .filter((t) => isIncomeType(t.type))
          .reduce((acc, t) => acc + t.amountCents, 0);

        const saidasCents: number = currentMonthTransactions
          .filter((t) => isExpenseType(t.type))
          .reduce((acc, t) => acc + t.amountCents, 0);

        const totalBillsCents: number = billsData
          .filter((b) => !b.paid)
          .reduce((acc, b) => acc + b.amountCents, 0);

        const urgentBillsData = billsData.filter(
          (bill) => bill.urgency === "alto" && !bill.paid,
        );

        const pendingTasks = tasksData.filter((task) => !task.completed).length;

        setProfile(profileData);
        setSaldoMesCents(entradasCents - saidasCents);
        setTotalPendentesCents(totalBillsCents);
        setUrgentBills(urgentBillsData);
        setPendingTasksCount(pendingTasks);
        setRecentTransactions(transactionsData.slice(0, 5));
        setIsLoading(false);
      } catch (error: unknown) {
        setIsLoading(false);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Erro ao carregar o dashboard.",
        );
      }
    };

    void run();
  }, [userId, refreshTick]);

  return {
    profile,
    saldoMesCents,
    totalPendentesCents,
    urgentBills,
    pendingTasksCount,
    recentTransactions,
    isLoading,
    errorMessage,
    refresh,
  };
};
