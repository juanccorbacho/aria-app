import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useBills } from "@/hooks/useBills";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import type { Bill, BillUrgency } from "@/types/models";

type FilterStatus = "todas" | "pendentes" | "pagas";

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

export default function BillsScreen(): React.JSX.Element {
  const isDesktop = useIsDesktop();
  const insets = useSafeAreaInsets();
  const { bills, isLoading, errorMessage, createBill, togglePaid, deleteBill } =
    useBills();

  const [showForm, setShowForm] = useState<boolean>(false);
  const [filter, setFilter] = useState<FilterStatus>("todas");
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [urgency, setUrgency] = useState<BillUrgency>("medio");
  const [paid, setPaid] = useState<boolean>(false);
  const [recurring, setRecurring] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

  const dueDateError = useMemo((): string | null => {
    if (dueDate.trim().length === 0) {
      return "Vencimento é obrigatório";
    }

    if (!isoDateRegex.test(dueDate)) {
      return "Data inválida. Use o formato AAAA-MM-DD";
    }

    if (!isRealIsoDate(dueDate)) {
      return "Data inválida. Use o formato AAAA-MM-DD";
    }

    return null;
  }, [dueDate]);

  const canSubmit = useMemo((): boolean => {
    return !descriptionError && !amountError && !dueDateError;
  }, [descriptionError, amountError, dueDateError]);

  const filteredBills = useMemo((): Bill[] => {
    const base = bills.filter((bill) => {
      if (filter === "pendentes") return !bill.paid;
      if (filter === "pagas") return bill.paid;
      return true;
    });

    return [...base].sort((a, b) => {
      if (a.paid !== b.paid) {
        return a.paid ? 1 : -1;
      }

      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [bills, filter]);

  const handleCreate = async (): Promise<void> => {
    if (!canSubmit || amountCents === null || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createBill({
        description: description.trim(),
        amountCents,
        dueDate,
        urgency,
        paid,
        recurring,
      });
      setDescription("");
      setAmount("");
      setDueDate("");
      setUrgency("medio");
      setPaid(false);
      setRecurring(false);
      setShowForm(false);
    } catch (error: unknown) {
      Alert.alert(
        "Erro ao criar conta",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = (): void => {
    setDescription("");
    setAmount("");
    setDueDate("");
    setUrgency("medio");
    setPaid(false);
    setRecurring(false);
    setShowForm(false);
  };

  const handleDelete = (bill: Bill): void => {
    Alert.alert("Excluir conta", "Tem certeza que deseja excluir esta conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteBill(bill.id);
          } catch (error: unknown) {
            Alert.alert(
              "Erro ao excluir conta",
              error instanceof Error ? error.message : "Tente novamente.",
            );
          }
        },
      },
    ]);
  };

  const handleTogglePaid = async (bill: Bill): Promise<void> => {
    try {
      await togglePaid(bill.id);
    } catch (error: unknown) {
      Alert.alert(
        "Erro ao atualizar conta",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    }
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
              <Text style={styles.title}>Contas a pagar</Text>
              <Text style={styles.subtitle}>
                Acompanhe vencimentos e pagamentos.
              </Text>
            </View>
            {isDesktop && !showForm ? (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setShowForm(true)}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Nova conta</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.filterRow}>
            {["todas", "pendentes", "pagas"].map((value) => {
              const label =
                value === "todas"
                  ? "Todas"
                  : value === "pendentes"
                    ? "Pendentes"
                    : "Pagas";
              const active = filter === value;
              return (
                <TouchableOpacity
                  key={value}
                  accessibilityRole="button"
                  onPress={() => setFilter(value as FilterStatus)}
                  style={[
                    styles.filterButton,
                    active && styles.filterButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      active && styles.filterButtonTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
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

              <TextInput
                value={dueDate}
                onChangeText={(value) => setDueDate(formatDateInput(value))}
                placeholder="Vencimento (AAAA-MM-DD)"
                placeholderTextColor="#6E6E6E"
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={10}
                keyboardType="numbers-and-punctuation"
              />
              {dueDateError ? (
                <Text style={styles.inputError}>{dueDateError}</Text>
              ) : null}

              <View style={styles.urgencyRow}>
                {["alto", "medio", "baixo"].map((value) => {
                  const label =
                    value === "alto"
                      ? "Alto"
                      : value === "medio"
                        ? "Médio"
                        : "Baixo";
                  const active = urgency === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      accessibilityRole="button"
                      onPress={() => setUrgency(value as BillUrgency)}
                      style={[
                        styles.urgencyButton,
                        active && styles.urgencyButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.urgencyButtonText,
                          active && styles.urgencyButtonTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.toggleRow}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: paid }}
                  onPress={() => setPaid((current) => !current)}
                  style={[styles.checkbox, paid && styles.checkboxChecked]}
                >
                  {paid ? <Text style={styles.checkboxMark}>✓</Text> : null}
                </Pressable>
                <Text style={styles.toggleLabel}>Pago</Text>
              </View>

              <View style={styles.toggleRow}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: recurring }}
                  onPress={() => setRecurring((current) => !current)}
                  style={[styles.checkbox, recurring && styles.checkboxChecked]}
                >
                  {recurring ? (
                    <Text style={styles.checkboxMark}>✓</Text>
                  ) : null}
                </Pressable>
                <Text style={styles.toggleLabel}>Recorrente</Text>
              </View>

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
                  <Text style={styles.addButtonText}>Adicionar conta</Text>
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
            {filteredBills.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma conta cadastrada.</Text>
            ) : (
              filteredBills.map((bill) => {
                const urgencyStyle =
                  bill.urgency === "alto"
                    ? styles.badgeRed
                    : bill.urgency === "medio"
                      ? styles.badgeYellow
                      : styles.badgeGreen;

                return (
                  <View key={bill.id} style={styles.row}>
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: bill.paid }}
                      onPress={() => handleTogglePaid(bill)}
                      style={[
                        styles.checkbox,
                        bill.paid && styles.checkboxChecked,
                      ]}
                    >
                      {bill.paid ? (
                        <Text style={styles.checkboxMark}>✓</Text>
                      ) : null}
                    </Pressable>

                    <View style={styles.rowLeft}>
                      <Text style={styles.rowTitle}>{bill.description}</Text>
                      <Text style={styles.rowSubtitle}>
                        Vence em {formatDateBR(bill.dueDate)}
                      </Text>
                      <View style={[styles.badge, urgencyStyle]}>
                        <Text style={styles.badgeText}>{bill.urgency}</Text>
                      </View>
                    </View>

                    <View style={styles.rowRight}>
                      <Text style={styles.rowAmount}>
                        {formatCurrencyBRL(bill.amountCents)}
                      </Text>
                      <Text style={styles.rowMeta}>
                        {bill.paid ? "Pago" : "Pendente"}
                      </Text>
                      <TouchableOpacity
                        accessibilityRole="button"
                        onPress={() => handleDelete(bill)}
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
          <Text style={styles.fabButtonText}>Nova conta</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
  scroll: {
    flex: 1,
    width: "100%",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 28,
    flexGrow: 1,
  },
  wrapper: {
    gap: 16,
    width: "100%",
  },
  wrapperDesktop: {
    width: "100%",
  },
  wrapperMobile: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
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
  filterRow: {
    flexDirection: "row",
    gap: 10,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2B2B2B",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  filterButtonActive: {
    backgroundColor: "#2EEA8A",
    borderColor: "#2EEA8A",
  },
  filterButtonText: {
    color: "#B3B3B3",
    fontSize: 13,
    fontWeight: "700",
  },
  filterButtonTextActive: {
    color: "#0D0D0D",
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
  urgencyRow: {
    flexDirection: "row",
    gap: 10,
  },
  urgencyButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2B2B2B",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  urgencyButtonActive: {
    backgroundColor: "#2EEA8A",
    borderColor: "#2EEA8A",
  },
  urgencyButtonText: {
    color: "#B3B3B3",
    fontSize: 13,
    fontWeight: "700",
  },
  urgencyButtonTextActive: {
    color: "#0D0D0D",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toggleLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  formActions: {
    gap: 10,
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
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2B2B2B",
  },
  rowLeft: {
    flex: 1,
    gap: 4,
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
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    color: "#0D0D0D",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  badgeRed: {
    backgroundColor: "#FF4D4F",
  },
  badgeYellow: {
    backgroundColor: "#FFD54A",
  },
  badgeGreen: {
    backgroundColor: "#2EEA8A",
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
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3A3A3A",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111111",
  },
  checkboxChecked: {
    backgroundColor: "#2EEA8A",
    borderColor: "#2EEA8A",
  },
  checkboxMark: {
    color: "#0D0D0D",
    fontWeight: "800",
    fontSize: 14,
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
  fabButton: {
    position: "absolute",
    right: 20,
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
});
