import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack, Button, Card, Input } from "tamagui";

import { useBills } from "@/hooks/useBills";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import type { Bill, BillUrgency } from "@/types/models";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

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
              <ThemedText type="title" fontSize="$7">Contas a pagar</ThemedText>
              <ThemedText type="default" o={0.6}>Acompanhe vencimentos e pagamentos.</ThemedText>
            </YStack>
            {isDesktop && !showForm ? (
              <Button onPress={() => setShowForm(true)} bg="$buttonBg" color="$buttonColor" br="$pill">
                Nova conta
              </Button>
            ) : null}
          </XStack>

          <XStack gap="$3">
            {["todas", "pendentes", "pagas"].map((value) => {
              const label = value === "todas" ? "Todas" : value === "pendentes" ? "Pendentes" : "Pagas";
              const active = filter === value;
              return (
                <Button
                  key={value}
                  onPress={() => setFilter(value as FilterStatus)}
                  f={1}
                  br="$comfortable"
                  bg={active ? "$success" : "$cardBackground"}
                  color={active ? "$pureBlack" : "$color"}
                  bw={1}
                  borderColor={active ? "$success" : "$cardBorder"}
                >
                  <ThemedText type="defaultSemiBold" color={active ? "$pureBlack" : "$color"}>{label}</ThemedText>
                </Button>
              );
            })}
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

              <Input
                value={dueDate}
                onChangeText={(value) => setDueDate(formatDateInput(value))}
                placeholder="Vencimento (AAAA-MM-DD)"
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
              {dueDateError && <ThemedText color="$danger" fontSize={12}>{dueDateError}</ThemedText>}

              <XStack gap="$3">
                {["alto", "medio", "baixo"].map((value) => {
                  const label = value === "alto" ? "Alto" : value === "medio" ? "Médio" : "Baixo";
                  const active = urgency === value;
                  return (
                    <Button
                      key={value}
                      onPress={() => setUrgency(value as BillUrgency)}
                      f={1}
                      br="$comfortable"
                      bg={active ? "$success" : "transparent"}
                      bw={1}
                      borderColor={active ? "$success" : "$cardBorder"}
                    >
                      <ThemedText color={active ? "$pureBlack" : "$color"} type="defaultSemiBold">{label}</ThemedText>
                    </Button>
                  );
                })}
              </XStack>

              <XStack ai="center" gap="$3">
                <Pressable
                  onPress={() => setPaid((c) => !c)}
                  style={{ width: 24, height: 24, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', borderColor: paid ? '#2EEA8A' : '#3A3A3A', backgroundColor: paid ? '#2EEA8A' : 'transparent' }}
                >
                  {paid && <Text style={{ color: '#000', fontWeight: 'bold' }}>✓</Text>}
                </Pressable>
                <ThemedText type="defaultSemiBold">Pago</ThemedText>
              </XStack>

              <XStack ai="center" gap="$3">
                <Pressable
                  onPress={() => setRecurring((c) => !c)}
                  style={{ width: 24, height: 24, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', borderColor: recurring ? '#2EEA8A' : '#3A3A3A', backgroundColor: recurring ? '#2EEA8A' : 'transparent' }}
                >
                  {recurring && <Text style={{ color: '#000', fontWeight: 'bold' }}>✓</Text>}
        </Pressable>
                <ThemedText type="defaultSemiBold">Recorrente</ThemedText>
              </XStack>

              <YStack gap="$3" mt="$3">
                <Button onPress={handleCreate} disabled={!canSubmit || isSubmitting} opacity={(!canSubmit || isSubmitting) ? 0.5 : 1} bg="$success" br="$comfortable" color="$pureBlack">
                  Adicionar conta
                </Button>
                <Button onPress={handleCancel} bg="transparent" br="$comfortable" bw={1} borderColor="$cardBorder">
                  Cancelar
                </Button>
              </YStack>
            </Card>
          )}

          <Card bg="$cardBackground" br="$comfortable" px="$4" py="$2" bw={1} bc="$cardBorder">
            {filteredBills.length === 0 ? (
              <ThemedText ta="center" py="$5" o={0.6}>Nenhuma conta cadastrada.</ThemedText>
            ) : (
              filteredBills.map((bill, index) => {
                const urgencyColor = bill.urgency === "alto" ? "$danger" : bill.urgency === "medio" ? "$warning" : "$success";

                return (
                  <XStack key={bill.id} ai="center" gap="$4" py="$4" borderBottomWidth={index === filteredBills.length - 1 ? 0 : 1} borderBottomColor="$cardBorder">
                    <Pressable
                  onPress={() => handleTogglePaid(bill)}
                  style={{ width: 24, height: 24, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', borderColor: bill.paid ? '#2EEA8A' : '#3A3A3A', backgroundColor: bill.paid ? '#2EEA8A' : 'transparent' }}
                >
                  {bill.paid && <Text style={{ color: '#000', fontWeight: 'bold' }}>✓</Text>}
                </Pressable>

                    <YStack f={1} gap="$1">
                      <ThemedText type="defaultSemiBold">{bill.description}</ThemedText>
                      <ThemedText type="default" fontSize={12} o={0.6}>Vence em {formatDateBR(bill.dueDate)}</ThemedText>
                      <XStack bg={urgencyColor} px="$2" py="$1" br="$pill" als="flex-start" mt="$1">
                        <ThemedText type="monoLabel" fontSize={10} color="$pureBlack">{bill.urgency}</ThemedText>
                      </XStack>
                    </YStack>

                    <YStack ai="flex-end" gap="$2">
                      <ThemedText type="defaultSemiBold">{formatCurrencyBRL(bill.amountCents)}</ThemedText>
                      <ThemedText type="default" fontSize={12} o={0.6}>{bill.paid ? "Pago" : "Pendente"}</ThemedText>
                      <Button onPress={() => handleDelete(bill)} bg="transparent" bw={1} borderColor="$cardBorder" size="$2" br="$comfortable" color="$danger">
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
          Nova conta
        </Button>
      )}
    </ThemedView>
  );
}
