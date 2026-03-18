import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useTransactions } from "@/hooks/useTransactions";
import type { Transaction, TransactionType } from "@/types/models";

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
      <View style={styles.screen}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.screen}>
        <Text style={styles.errorText}>{errorMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.wrapper,
            isDesktop ? styles.wrapperDesktop : styles.wrapperMobile,
          ]}
        >
          <View style={styles.headerRow}>
            <View style={styles.header}>
              <Text style={styles.title}>Transações</Text>
              <Text style={styles.subtitle}>
                Acompanhe entradas e saídas do mês.
              </Text>
            </View>
            {isDesktop && !showForm ? (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setShowForm(true)}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Nova transação</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {showForm ? (
            <View style={styles.inputCard}>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Descrição"
                placeholderTextColor="#6E6E6E"
                style={styles.input}
              />
              {descriptionError ? (
                <Text style={styles.inputError}>{descriptionError}</Text>
              ) : null}

              <TextInput
                value={amount}
                onChangeText={(value) => setAmount(formatAmountInput(value))}
                placeholder="Valor (R$)"
                placeholderTextColor="#6E6E6E"
                style={styles.input}
                keyboardType="decimal-pad"
              />
              {amountError ? (
                <Text style={styles.inputError}>{amountError}</Text>
              ) : null}

              <View style={styles.typeRow}>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => setType("entrada")}
                  style={[
                    styles.typeButton,
                    type === "entrada" && styles.typeButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      type === "entrada" && styles.typeButtonTextActive,
                    ]}
                  >
                    Entrada
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => setType("saida")}
                  style={[
                    styles.typeButton,
                    type === "saida" && styles.typeButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      type === "saida" && styles.typeButtonTextActive,
                    ]}
                  >
                    Saída
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                value={category}
                onChangeText={setCategory}
                placeholder="Categoria (opcional)"
                placeholderTextColor="#6E6E6E"
                style={styles.input}
              />

              <TextInput
                value={date}
                onChangeText={(value) => setDate(formatDateInput(value))}
                placeholder="Data (AAAA-MM-DD)"
                placeholderTextColor="#6E6E6E"
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={10}
                keyboardType="numbers-and-punctuation"
              />
              {dateError ? (
                <Text style={styles.inputError}>{dateError}</Text>
              ) : null}

              <View style={styles.formActions}>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={handleCreate}
                  disabled={!canSubmit || isSubmitting}
                  style={[
                    styles.addButton,
                    !canSubmit && styles.addButtonDisabled,
                  ]}
                >
                  <Text style={styles.addButtonText}>Adicionar transação</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={handleCancel}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          <View style={styles.listCard}>
            {orderedTransactions.length === 0 ? (
              <Text style={styles.emptyText}>
                Nenhuma transação cadastrada.
              </Text>
            ) : (
              orderedTransactions.map((transaction) => {
                const isIncome = transaction.type === "entrada";
                return (
                  <View key={transaction.id} style={styles.row}>
                    <View style={styles.rowLeft}>
                      <Text style={styles.rowTitle}>
                        {transaction.description}
                      </Text>
                      <Text style={styles.rowSubtitle}>
                        {transaction.category ?? "Sem categoria"} ·{" "}
                        {formatDateBR(transaction.date)}
                      </Text>
                    </View>

                    <View style={styles.rowRight}>
                      <Text
                        style={[
                          styles.rowAmount,
                          isIncome ? styles.positive : styles.negative,
                        ]}
                      >
                        {formatCurrencyBRL(transaction.amountCents)}
                      </Text>
                      <Text style={styles.rowMeta}>
                        {isIncome ? "Entrada" : "Saída"}
                      </Text>
                      <TouchableOpacity
                        accessibilityRole="button"
                        onPress={() => handleDelete(transaction)}
                        style={styles.deleteButton}
                      >
                        <Text style={styles.deleteButtonText}>Excluir</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
      {!isDesktop && !showForm ? (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => setShowForm(true)}
          style={[styles.fabButton, { bottom: 24 + insets.bottom }]}
        >
          <Text style={styles.fabButtonText}>Nova transação</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 28,
    flexGrow: 1,
  },
  scroll: {
    flex: 1,
    width: "100%",
  },
  wrapper: {
    gap: 16,
    width: "100%",
  },
  wrapperDesktop: {
    width: "100%",
  },
  wrapperMobile: {
    maxWidth: 820,
    alignSelf: "center",
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  header: {
    gap: 6,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },
  subtitle: {
    color: "#A0A0A0",
    fontSize: 14,
  },
  inputCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2B2B2B",
    gap: 12,
  },
  input: {
    color: "#FFFFFF",
    fontSize: 15,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#0F0F0F",
    borderWidth: 1,
    borderColor: "#262626",
  },
  inputError: {
    color: "#FF4D4F",
    fontSize: 12,
  },
  primaryButton: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: Colors.light.tint,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  fabButton: {
    position: "absolute",
    right: 20,
    bottom: 24,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fabButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  formActions: {
    gap: 10,
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2B2B2B",
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  typeRow: {
    flexDirection: "row",
    gap: 10,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2B2B2B",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  typeButtonActive: {
    backgroundColor: "#2EEA8A",
    borderColor: "#2EEA8A",
  },
  typeButtonText: {
    color: "#B3B3B3",
    fontSize: 13,
    fontWeight: "700",
  },
  typeButtonTextActive: {
    color: "#0D0D0D",
  },
  addButton: {
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#2EEA8A",
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: "#0D0D0D",
    fontSize: 14,
    fontWeight: "700",
  },
  listCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#2B2B2B",
    gap: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2B2B2B",
  },
  rowLeft: {
    flex: 1,
    paddingRight: 10,
    gap: 2,
  },
  rowRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  rowTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  rowSubtitle: {
    color: "#8F8F8F",
    fontSize: 12,
  },
  rowAmount: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  rowMeta: {
    color: "#8F8F8F",
    fontSize: 12,
  },
  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3A3A3A",
  },
  deleteButtonText: {
    color: "#FF4D4F",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyText: {
    color: "#8F8F8F",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },
  errorText: {
    color: "#FF4D4F",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  positive: {
    color: "#2EEA8A",
  },
  negative: {
    color: "#FF4D4F",
  },
});
