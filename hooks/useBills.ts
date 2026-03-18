import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import type { CreateBillInput } from "@/services/billService";
import {
    createBill as createBillService,
    deleteBill as deleteBillService,
    getBills,
    toggleBillPaid as toggleBillPaidService,
} from "@/services/billService";
import type { Bill } from "@/types/models";

type UseBillsReturn = {
  bills: Bill[];
  isLoading: boolean;
  errorMessage: string | null;
  refresh: () => void;
  createBill: (input: Omit<CreateBillInput, "userId">) => Promise<void>;
  togglePaid: (billId: string) => Promise<void>;
  deleteBill: (billId: string) => Promise<void>;
};

export const useBills = (): UseBillsReturn => {
  const { user } = useAuth();
  const userId: string | undefined = user?.id;

  const [bills, setBills] = useState<Bill[]>([]);
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
        const data = await getBills(userId);
        setBills(data);
        setIsLoading(false);
      } catch (error: unknown) {
        setIsLoading(false);
        setErrorMessage(
          error instanceof Error ? error.message : "Erro ao carregar contas.",
        );
      }
    };

    void run();
  }, [userId, refreshTick]);

  const createBill = useCallback(
    async (input: Omit<CreateBillInput, "userId">): Promise<void> => {
      if (!userId) {
        setErrorMessage("Usuário não autenticado.");
        throw new Error("Usuário não autenticado.");
      }

      try {
        const created = await createBillService({
          userId,
          description: input.description,
          amountCents: input.amountCents,
          dueDate: input.dueDate,
          urgency: input.urgency,
          paid: input.paid,
          recurring: input.recurring,
        });
        setBills((current) => [created, ...current]);
      } catch (error: unknown) {
        setErrorMessage(
          error instanceof Error ? error.message : "Erro ao criar conta.",
        );
        throw error;
      }
    },
    [userId],
  );

  const togglePaid = useCallback(
    async (billId: string): Promise<void> => {
      if (!userId) {
        setErrorMessage("Usuário não autenticado.");
        throw new Error("Usuário não autenticado.");
      }

      const currentBill = bills.find((bill) => bill.id === billId);
      if (!currentBill) {
        return;
      }

      try {
        const updated = await toggleBillPaidService(
          billId,
          userId,
          !currentBill.paid,
        );
        setBills((current) =>
          current.map((bill) => (bill.id === updated.id ? updated : bill)),
        );
      } catch (error: unknown) {
        setErrorMessage(
          error instanceof Error ? error.message : "Erro ao atualizar conta.",
        );
        throw error;
      }
    },
    [bills, userId],
  );

  const deleteBill = useCallback(
    async (billId: string): Promise<void> => {
      if (!userId) {
        setErrorMessage("Usuário não autenticado.");
        throw new Error("Usuário não autenticado.");
      }

      try {
        await deleteBillService(billId, userId);
        setBills((current) => current.filter((bill) => bill.id !== billId));
      } catch (error: unknown) {
        setErrorMessage(
          error instanceof Error ? error.message : "Erro ao excluir conta.",
        );
        throw error;
      }
    },
    [userId],
  );

  return {
    bills,
    isLoading,
    errorMessage,
    refresh,
    createBill,
    togglePaid,
    deleteBill,
  };
};
