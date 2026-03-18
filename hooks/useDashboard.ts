import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { getProfile } from '@/services/profileService';
import { getBills } from '@/services/billService';
import { getTransactions } from '@/services/transactionService';
import type { Bill, Profile, Transaction, TransactionType } from '@/types/models';

type UseDashboardReturn = {
  profile: Profile | null;
  transactions: Transaction[];
  bills: Bill[];
  saldoAtualCents: number; // entradas - saídas
  totalAPagarCents: number; // bills is_paid=false
  isLoading: boolean;
  errorMessage: string | null;
  refresh: () => void;
};

const isIncomeType = (type: TransactionType): boolean => {
  return type === 'entrada';
};

const isExpenseType = (type: TransactionType): boolean => {
  return type === 'saida';
};

export const useDashboard = (): UseDashboardReturn => {
  const { user } = useAuth();
  const userId: string | undefined = user?.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [saldoAtualCents, setSaldoAtualCents] = useState<number>(0);
  const [totalAPagarCents, setTotalAPagarCents] = useState<number>(0);
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
        setErrorMessage('Usuário não autenticado.');
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [profileData, transactionsData, billsData] = await Promise.all([
          getProfile(userId),
          getTransactions(userId),
          getBills(userId),
        ]);

        const entradasCents: number = transactionsData
          .filter((t) => isIncomeType(t.type))
          .reduce((acc, t) => acc + t.amountCents, 0);

        const saidasCents: number = transactionsData
          .filter((t) => isExpenseType(t.type))
          .reduce((acc, t) => acc + t.amountCents, 0);

        const totalBillsCents: number = billsData.reduce((acc, b) => acc + b.amountCents, 0);

        setProfile(profileData);
        setTransactions(transactionsData);
        setBills(billsData);
        setSaldoAtualCents(entradasCents - saidasCents);
        setTotalAPagarCents(totalBillsCents);
        setIsLoading(false);
      } catch (error: unknown) {
        setIsLoading(false);
        setErrorMessage(error instanceof Error ? error.message : 'Erro ao carregar o dashboard.');
      }
    };

    void run();
  }, [userId, refreshTick]);

  return {
    profile,
    transactions,
    bills,
    saldoAtualCents,
    totalAPagarCents,
    isLoading,
    errorMessage,
    refresh,
  };
};

