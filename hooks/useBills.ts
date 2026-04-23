import { useCallback, useEffect, useState } from "react";

import { useProfile } from "@/hooks/useProfile";
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
  createBill: (input: Omit<CreateBillInput, "workspaceId" | "profileId">) => Promise<void>;
  togglePaid: (billId: string) => Promise<void>;
  deleteBill: (billId: string) => Promise<void>;
};

export const useBills = (): UseBillsReturn => {
  const { workspaceId, profileId, errorMessage: profileError, isLoading: isProfileLoading } = useProfile();

  const [bills, setBills] = useState<Bill[]>([]);
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
        setErrorMessage(profileError ?? "Usuário não autenticado.");
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const data = await getBills(workspaceId);
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
  }, [workspaceId, refreshTick]);

  const createBill = useCallback(
    async (input: Omit<CreateBillInput, "workspaceId" | "profileId">): Promise<void> => {
      if (!workspaceId || !profileId) {
        setErrorMessage("Usuário não autenticado.");
        throw new Error("Usuário não autenticado.");
      }

      try {
        const created = await createBillService({
          workspaceId,
          profileId,
          name: input.name,
          amountCents: input.amountCents,
          dueDate: input.dueDate,
          priority: input.priority,
          status: input.status,
        });
        setBills((current) => [created, ...current]);
      } catch (error: unknown) {
        setErrorMessage(
          error instanceof Error ? error.message : "Erro ao criar conta.",
        );
        throw error;
      }
    },
    [workspaceId],
  );

  const togglePaid = useCallback(
    async (billId: string): Promise<void> => {
      if (!workspaceId) {
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
          workspaceId,
          currentBill.status === "PAID" ? "PENDING" : "PAID",
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
    [bills, workspaceId],
  );

  const deleteBill = useCallback(
    async (billId: string): Promise<void> => {
      if (!workspaceId) {
        setErrorMessage("Usuário não autenticado.");
        throw new Error("Usuário não autenticado.");
      }

      try {
        await deleteBillService(billId, workspaceId);
        setBills((current) => current.filter((bill) => bill.id !== billId));
      } catch (error: unknown) {
        setErrorMessage(
          error instanceof Error ? error.message : "Erro ao excluir conta.",
        );
        throw error;
      }
    },
    [workspaceId],
  );

  return {
    bills,
    isLoading: isProfileLoading || isLoading,
    errorMessage: profileError || errorMessage,
    refresh,
    createBill,
    togglePaid,
    deleteBill,
  };
};
