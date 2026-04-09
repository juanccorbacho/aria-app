import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack, Button, Card, Input } from "tamagui";

import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useTransactions } from "@/hooks/useTransactions";
import type { Transaction, TransactionType } from "@/types/models";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

const formatCurrencyBRL = (valueCents: number): string => {
  const value: number = valueCents / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatDateBR = (isoDate: string): string => {
  const [year, month, day] = isoDate.split("-").map((chunk) => Number(chunk));
  if (!year || !month || !day) return isoDate;
  const date: Date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
};

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

const formatDateInput = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
};

const isRealIsoDate = (value: string): boolean => {
  if (!isoDateRegex.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map((chunk) => Number(chunk));
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const formatAmountInput = (value: string): string => {
  const sanitized = value.replace(/[^\d.,]/g, "");
  const normalized = sanitized.replace(/,/g, ".");
  const [intPart, decPart] = normalized.split(".");
  const safeInt = intPart.replace(/\D/g, "");
  const safeDec = (decPart ?? "").replace(/\D/g, "").slice(0, 2);

  if (safeDec.length > 0) {
    return `${safeInt || "0"},${safeDec}`;
  }

  return safeInt;
};

const parseAmountToCents = (value: string): number | null => {
  const sanitized = value.replace(/\s/g, "");
  if (sanitized.length === 0) {
    return null;
  }

  const normalized = sanitized.replace(/\./g, "").replace(/,/g, ".");
  const parsed = Number(normalized);

  if (Number.isNaN(parsed)) {
    return null;
  }

  return Math.round(parsed * 100);
};

export default function TransactionsScreen(): React.JSX.Element {
  const isDesktop = useIsDesktop();
  const insets = useSafeAreaInsets();
  const {
    transactions,
    isLoading,
    errorMessage,
    createTransaction,
    deleteTransaction,
  } = useTransactions();

  const [showForm, setShowForm] = useState<boolean>(false);
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [type, setType] = useState<TransactionType>("entrada");
  const [category, setCategory] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const orderedTransactions = useMemo((): Transaction[] => {
    const copy = [...transactions];
    return copy.sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions]);

  const descriptionError = useMemo((): string | null => {
    return description.trim().length === 0 ? "Descrição é obrigatória" : null;
  }, [description]);

  const amountCents = useMemo(() => parseAmountToCents(amount), [amount]);

  const amountError = useMemo((): string | null => {
    if (amountCents === null || amountCents <= 0) {
      return "Valor deve ser maior que zero";
    }
    return null;
  }, [amountCents]);

  const dateError = useMemo((): string | null => {
    if (date.trim().length === 0) {
      return "Data é obrigatória";
    }

    if (!isoDateRegex.test(date)) {
      return "Data inválida. Use o formato AAAA-MM-DD";
    }

    if (!isRealIsoDate(date)) {
      return "Data inválida. Use o formato AAAA-MM-DD";
    }

    return null;
  }, [date]);

  const canSubmit = useMemo((): boolean => {
    return !descriptionError && !amountError && !dateError;
  }, [descriptionError, amountError, dateError]);

  const handleCreate = async (): Promise<void> => {
    if (!canSubmit || amountCents === null || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createTransaction({
        description: description.trim(),
        amountCents,
        type,
        date,
        category: category.trim().length > 0 ? category.trim() : null,
      });
      setDescription("");
      setAmount("");
      setCategory("");
      setDate("");
      setType("entrada");
      setShowForm(false);
    } catch (error: unknown) {
      Alert.alert(
        "Erro ao criar transação",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = (): void => {
    setDescription("");
    setAmount("");
    setCategory("");
    setDate("");
    setType("entrada");
    setShowForm(false);
  };

  const handleDelete = (transaction: Transaction): void => {
    Alert.alert(
      "Excluir transação",
      "Tem certeza que deseja excluir esta transação?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTransaction(transaction.id);
            } catch (error: unknown) {
              Alert.alert(
                "Erro ao excluir transação",
                error instanceof Error ? error.message : "Tente novamente.",
              );
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <ThemedView f={1} ai="center" jc="center">
        <ActivityIndicator size="large" color="#000000" />
      </ThemedView>
    );
  }

  if (errorMessage) {
    return (
      <ThemedView f={1} ai="center" jc="center">
        <ThemedText color="$danger">{errorMessage}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView f={1}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 28 }}
      >
        <YStack gap="$5" w="100%" maxWidth={isDesktop ? "100%" : 720} als="center">
          
          <XStack ai="center" jc="space-between" gap="$4">
            <YStack gap="$1">
              <ThemedText type="title" fontSize="$7">Transações</ThemedText>
              <ThemedText type="default" o={0.6}>Acompanhe entradas e saídas do mês.</ThemedText>
            </YStack>
            {isDesktop && !showForm ? (
              <Button onPress={() => setShowForm(true)} bg="$buttonBg" color="$buttonColor" br="$pill">
                Nova transação
              </Button>
            ) : null}
          </XStack>

          {showForm && (
            <Card bg="$cardBackground" br="$comfortable" p="$5" bw={1} bc="$cardBorder" gap="$4">
              <Input
                value={description}
                onChangeText={setDescription}
                placeholder="Descrição"
                bg="transparent"
                color="$color"
                br="$comfortable"
                bw={1}
                borderColor="$cardBorder"
              />
              {descriptionError && <ThemedText color="$danger" fontSize={12}>{descriptionError}</ThemedText>}

              <Input
                value={amount}
                onChangeText={(value) => setAmount(formatAmountInput(value))}
                placeholder="Valor (R$)"
                keyboardType="decimal-pad"
                bg="transparent"
                color="$color"
                br="$comfortable"
                bw={1}
                borderColor="$cardBorder"
              />
              {amountError && <ThemedText color="$danger" fontSize={12}>{amountError}</ThemedText>}

              <XStack gap="$3">
                <Button
                  f={1}
                  br="$comfortable"
                  bg={type === "entrada" ? "$success" : "transparent"}
                  bw={1}
                  borderColor={type === "entrada" ? "$success" : "$cardBorder"}
                  onPress={() => setType("entrada")}
                >
                  <ThemedText type="defaultSemiBold" color={type === "entrada" ? "$pureBlack" : "$color"}>Entrada</ThemedText>
                </Button>
                <Button
                  f={1}
                  br="$comfortable"
                  bg={type === "saida" ? "$success" : "transparent"}
                  bw={1}
                  borderColor={type === "saida" ? "$success" : "$cardBorder"}
                  onPress={() => setType("saida")}
                >
                  <ThemedText type="defaultSemiBold" color={type === "saida" ? "$pureBlack" : "$color"}>Saída</ThemedText>
                </Button>
              </XStack>

              <Input
                value={category}
                onChangeText={setCategory}
                placeholder="Categoria (opcional)"
                bg="transparent"
                color="$color"
                br="$comfortable"
                bw={1}
                borderColor="$cardBorder"
              />

              <Input
                value={date}
                onChangeText={(value) => setDate(formatDateInput(value))}
                placeholder="Data (AAAA-MM-DD)"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={10}
                keyboardType="numbers-and-punctuation"
                bg="transparent"
                color="$color"
                br="$comfortable"
                bw={1}
                borderColor="$cardBorder"
              />
              {dateError && <ThemedText color="$danger" fontSize={12}>{dateError}</ThemedText>}

              <YStack gap="$3" mt="$3">
                <Button onPress={handleCreate} disabled={!canSubmit || isSubmitting} opacity={(!canSubmit || isSubmitting) ? 0.5 : 1} bg="$success" br="$comfortable" color="$pureBlack">
                  Adicionar transação
                </Button>
                <Button onPress={handleCancel} bg="transparent" br="$comfortable" bw={1} borderColor="$cardBorder">
                  Cancelar
                </Button>
              </YStack>
            </Card>
          )}

          <Card bg="$cardBackground" br="$comfortable" px="$4" py="$2" bw={1} bc="$cardBorder">
            {orderedTransactions.length === 0 ? (
              <ThemedText ta="center" py="$5" o={0.6}>Nenhuma transação cadastrada.</ThemedText>
            ) : (
              orderedTransactions.map((transaction, index) => {
                const isIncome = transaction.type === "entrada";
                return (
                  <XStack key={transaction.id} ai="center" gap="$4" py="$4" borderBottomWidth={index === orderedTransactions.length - 1 ? 0 : 1} borderBottomColor="$cardBorder">
                    <YStack f={1} gap="$1">
                      <ThemedText type="defaultSemiBold">{transaction.description}</ThemedText>
                      <ThemedText type="default" fontSize={12} o={0.6}>
                        {transaction.category ?? "Sem categoria"} · {formatDateBR(transaction.date)}
                      </ThemedText>
                    </YStack>

                    <YStack ai="flex-end" gap="$2">
                      <ThemedText type="defaultSemiBold" color={isIncome ? "$success" : "$danger"}>
                        {formatCurrencyBRL(transaction.amountCents)}
                      </ThemedText>
                      <ThemedText type="default" fontSize={12} o={0.6}>
                        {isIncome ? "Entrada" : "Saída"}
                      </ThemedText>
                      <Button onPress={() => handleDelete(transaction)} bg="transparent" bw={1} borderColor="$cardBorder" size="$2" br="$comfortable" color="$danger">
                        Excluir
                      </Button>
                    </YStack>
                  </XStack>
                );
              })
            )}
          </Card>
        </YStack>
      </ScrollView>

      {!isDesktop && !showForm && (
        <Button
          pos="absolute"
          right={20}
          bottom={24 + insets.bottom}
          bg="$buttonBg"
          color="$buttonColor"
          br="$comfortable"
          onPress={() => setShowForm(true)}
        >
          Nova transação
        </Button>
      )}
    </ThemedView>
  );
}
