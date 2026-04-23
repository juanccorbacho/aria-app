import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import type {
    CreateTransactionInput,
    UpdateTransactionInput,
} from "@/services/transactionService";
import {
    createTransaction as createTransactionService,
    deleteTransaction as deleteTransactionService,
    getTransactions,
    updateTransaction as updateTransactionService,
} from "@/services/transactionService";
import type { Transaction } from "@/types/models";

type UseTransactionsReturn = {
  transactions: Transaction[];
  isLoading: boolean;
  errorMessage: string | null;
  refresh: () => void;
  createTransaction: (
    input: Omit<CreateTransactionInput, "workspaceId">,
  ) => Promise<void>;
  updateTransaction: (
    input: Omit<UpdateTransactionInput, "workspaceId">,
  ) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
};

export const useTransactions = (): UseTransactionsReturn => {
  const { user } = useAuth();
  const workspaceId: string | undefined = user?.user_metadata?.workspace_id;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState<number>(0);

  const refresh = useCallback((): void => {
    setRefreshTick((current) => current + 1);
  }, []);

  useEffect(() => {
    const run = async (): Promise<void> => {
      if (!workspaceId) {
        setIsLoading(false);
        setErrorMessage("Usuário não autenticado.");
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const data = await getTransactions(workspaceId);
        setTransactions(data);
        setIsLoading(false);
      } catch (error: unknown) {
        setIsLoading(false);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Erro ao carregar transações.",
        );
      }
    };

    void run();
  }, [workspaceId, refreshTick]);

  const createTransaction = useCallback(
    async (input: Omit<CreateTransactionInput, "workspaceId">): Promise<void> => {
      if (!workspaceId) {
        setErrorMessage("Usuário não autenticado.");
        throw new Error("Usuário não autenticado.");
      }

      try {
        const created = await createTransactionService({
          workspaceId,
          description: input.description,
          category: input.category,
          amountCents: input.amountCents,
          type: input.type,
          date: input.date,
        });
        setTransactions((current) => [created, ...current]);
      } catch (error: unknown) {
        setErrorMessage(
          error instanceof Error ? error.message : "Erro ao criar transação.",
        );
        throw error;
      }
    },
    [workspaceId],
  );

  const updateTransaction = useCallback(
    async (input: Omit<UpdateTransactionInput, "workspaceId">): Promise<void> => {
      if (!workspaceId) {
        setErrorMessage("Usuário não autenticado.");
        throw new Error("Usuário não autenticado.");
      }

      try {
        const updated = await updateTransactionService({
          ...input,
          workspaceId,
        });
        setTransactions((current) =>
          current.map((transaction) =>
            transaction.id === updated.id ? updated : transaction,
          ),
        );
      } catch (error: unknown) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Erro ao atualizar transação.",
        );
        throw error;
      }
    },
    [],
  );

  const deleteTransaction = useCallback(
    async (transactionId: string): Promise<void> => {
      if (!workspaceId) {
        setErrorMessage("Usuário não autenticado.");
        throw new Error("Usuário não autenticado.");
      }

      try {
        await deleteTransactionService(transactionId, workspaceId);
        setTransactions((current) =>
          current.filter((transaction) => transaction.id !== transactionId),
        );
      } catch (error: unknown) {
        setErrorMessage(
          error instanceof Error ? error.message : "Erro ao excluir transação.",
        );
        throw error;
      }
    },
    [workspaceId],
  );

  return {
    transactions,
    isLoading,
    errorMessage,
    refresh,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
};
