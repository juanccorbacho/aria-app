import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, View, TouchableOpacity, TextInput, Text, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useBills } from "@/hooks/useBills";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { formatCurrencyBRL } from "@/utils/currency";
import type { Bill, BillUrgency } from "@/types/models";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

type FilterStatus = "todas" | "pendentes" | "pagas";

const formatDateBR = (isoDate: string): string => {
  const [year, month, day] = isoDate.split("-").map((chunk) => Number(chunk));
  if (!year || !month || !day) return isoDate;
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
};

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

const formatDateInput = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
};

const isRealIsoDate = (value: string): boolean => {
  if (!isoDateRegex.test(value)) return false;
  const [year, month, day] = value.split("-").map((chunk) => Number(chunk));
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

const formatAmountInput = (value: string): string => {
  const sanitized = value.replace(/[^\d.,]/g, "");
  const normalized = sanitized.replace(/,/g, ".");
  const [intPart, decPart] = normalized.split(".");
  const safeInt = intPart.replace(/\D/g, "");
  const safeDec = (decPart ?? "").replace(/\D/g, "").slice(0, 2);
  if (safeDec.length > 0) return `${safeInt || "0"},${safeDec}`;
  return safeInt;
};

const parseAmountToCents = (value: string): number | null => {
  const sanitized = value.replace(/\s/g, "");
  if (sanitized.length === 0) return null;
  const normalized = sanitized.replace(/\./g, "").replace(/,/g, ".");
  const parsed = Number(normalized);
  if (Number.isNaN(parsed)) return null;
  return Math.round(parsed * 100);
};

export default function BillsScreen(): React.JSX.Element {
  const isDesktop = useIsDesktop();
  const insets = useSafeAreaInsets();
  const { bills, isLoading, errorMessage, createBill, togglePaid, deleteBill } = useBills();

  const [showForm, setShowForm] = useState<boolean>(false);
  const [filter, setFilter] = useState<FilterStatus>("todas");
  const [name, setName] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [priority, setPriority] = useState<BillUrgency>("MEDIUM");
  const [status, setStatus] = useState<"PENDING" | "PAID">("PENDING");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const nameError = useMemo((): string | null => name.trim().length === 0 ? "Nome é obrigatório" : null, [name]);
  const amountCents = useMemo(() => parseAmountToCents(amount), [amount]);
  const amountError = useMemo((): string | null => (amountCents === null || amountCents <= 0) ? "Valor deve ser maior que zero" : null, [amountCents]);
  const dueDateError = useMemo((): string | null => {
    if (dueDate.trim().length === 0) return "Vencimento é obrigatório";
    if (!isoDateRegex.test(dueDate) || !isRealIsoDate(dueDate)) return "Data inválida. Use o formato AAAA-MM-DD";
    return null;
  }, [dueDate]);

  const canSubmit = useMemo((): boolean => !nameError && !amountError && !dueDateError, [nameError, amountError, dueDateError]);

  const filteredBills = useMemo((): Bill[] => {
    const base = bills.filter((bill) => {
      if (filter === "pendentes") return bill.status === "PENDING";
      if (filter === "pagas") return bill.status === "PAID";
      return true;
    });
    return [...base].sort((a, b) => {
      if (a.status !== b.status) return a.status === "PAID" ? 1 : -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [bills, filter]);

  const handleCreate = async (): Promise<void> => {
    if (!canSubmit || amountCents === null || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await createBill({
        name: name.trim(), amountCents, dueDate, priority, status,
      });
      handleCancel();
    } catch (error: unknown) {
      Alert.alert("Erro ao criar conta", error instanceof Error ? error.message : "Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = (): void => {
    setName(""); setAmount(""); setDueDate(""); setPriority("MEDIUM"); setStatus("PENDING"); setShowForm(false);
  };

  const handleDelete = (bill: Bill): void => {
    Alert.alert("Excluir conta", "Tem certeza que deseja excluir esta conta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => {
          try { await deleteBill(bill.id); } 
          catch (error: unknown) { Alert.alert("Erro ao excluir conta", error instanceof Error ? error.message : "Tente novamente."); }
        },
      },
    ]);
  };

  const handleTogglePaid = async (bill: Bill): Promise<void> => {
    try { await togglePaid(bill.id); } 
    catch (error: unknown) { Alert.alert("Erro", error instanceof Error ? error.message : "Tente novamente."); }
  };

  if (isLoading) {
    return (
      <ThemedView className="flex-1 items-center justify-center bg-[#08090a]">
        <ActivityIndicator size="large" color="#f7f8f8" />
      </ThemedView>
    );
  }

  if (errorMessage) {
    return (
      <ThemedView className="flex-1 items-center justify-center bg-[#08090a]">
        <ThemedText className="text-[#ef4444] font-[590]">{errorMessage}</ThemedText>
      </ThemedView>
    );
  }

  const containerStyle = { maxWidth: isDesktop ? "100%" as const : 720 };

  const renderHeader = () => (
    <View className="flex col gap-5 mb-5">
      <View className="flex flex-row items-center justify-between gap-4">
        <View className="flex flex-col gap-1">
          <ThemedText type="title" className="text-2xl font-[590] text-[#f7f8f8] tracking-tight">Contas a pagar</ThemedText>
          <ThemedText className="text-[#d0d6e0] font-[400]">Acompanhe vencimentos e pagamentos.</ThemedText>
        </View>
        {isDesktop && !showForm ? (
          <TouchableOpacity onPress={() => setShowForm(true)} className="bg-[#5e6ad2] px-5 py-3 rounded-full border-[0.5px] border-[#5e6ad2]/80">
            <Text className="text-[#f7f8f8] font-[510]">Nova conta</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View className="flex flex-row gap-3">
        {["todas", "pendentes", "pagas"].map((value) => {
          const label = value === "todas" ? "Todas" : value === "pendentes" ? "Pendentes" : "Pagas";
          const active = filter === value;
          return (
            <TouchableOpacity
              key={value}
              onPress={() => setFilter(value as FilterStatus)}
              className={`flex-1 py-3 items-center rounded-full border-[0.5px] ${active ? "bg-white/10 border-white/20" : "border-white/5 bg-[#191a1b]"}`}
            >
              <Text className={`font-[510] ${active ? "text-[#f7f8f8]" : "text-[#d0d6e0]"}`}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {showForm && (
        <View className="bg-[#191a1b] border-[0.5px] border-white/10 rounded-2xl p-5 flex flex-col gap-4">
          <TextInput value={name} onChangeText={setName} placeholder="Nome da conta" placeholderTextColor="#d0d6e0" className="bg-white/5 border-[0.5px] border-white/10 text-[#f7f8f8] rounded-xl p-4 font-[400]" />
          {nameError && <ThemedText className="text-[#ef4444] text-xs font-[510]">{nameError}</ThemedText>}

          <TextInput value={amount} onChangeText={(value) => setAmount(formatAmountInput(value))} placeholder="Valor (R$)" placeholderTextColor="#d0d6e0" keyboardType="decimal-pad" className="bg-white/5 border-[0.5px] border-white/10 text-[#f7f8f8] rounded-xl p-4 font-[400]" />
          {amountError && <ThemedText className="text-[#ef4444] text-xs font-[510]">{amountError}</ThemedText>}

          <TextInput value={dueDate} onChangeText={(value) => setDueDate(formatDateInput(value))} placeholder="Vencimento (AAAA-MM-DD)" placeholderTextColor="#d0d6e0" autoCapitalize="none" autoCorrect={false} maxLength={10} keyboardType="numbers-and-punctuation" className="bg-white/5 border-[0.5px] border-white/10 text-[#f7f8f8] rounded-xl p-4 font-[400]" />
          {dueDateError && <ThemedText className="text-[#ef4444] text-xs font-[510]">{dueDateError}</ThemedText>}

          <View className="flex flex-row gap-3">
            {["HIGH", "MEDIUM", "LOW"].map((value) => {
              const label = value === "HIGH" ? "Alta" : value === "MEDIUM" ? "Média" : "Baixa";
              const active = priority === value;
              return (
                <TouchableOpacity
                  key={value}
                  onPress={() => setPriority(value as BillUrgency)}
                  className={`flex-1 py-3 items-center rounded-full border-[0.5px] ${active ? "bg-white/10 border-white/20" : "border-white/5"}`}
                >
                  <Text className={`font-[510] ${active ? "text-[#f7f8f8]" : "text-[#d0d6e0]"}`}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View className="flex flex-row items-center gap-3">
            <TouchableOpacity onPress={() => setStatus((c) => c === "PAID" ? "PENDING" : "PAID")} className={`w-6 h-6 items-center justify-center rounded-md border-[0.5px] ${status === "PAID" ? "bg-[#5e6ad2] border-[#5e6ad2]/80" : "border-white/20"}`}>
              {status === "PAID" && <Text className="text-[#f7f8f8] font-[590] text-xs">✓</Text>}
            </TouchableOpacity>
            <ThemedText className="font-[510] text-[#f7f8f8]">Pago</ThemedText>
          </View>

          <View className="flex flex-col gap-3 mt-3">
            <TouchableOpacity onPress={handleCreate} disabled={!canSubmit || isSubmitting} className={`items-center py-3 rounded-full border-[0.5px] border-[#5e6ad2]/80 bg-[#5e6ad2] ${(!canSubmit || isSubmitting) ? "opacity-50" : ""}`}>
              <Text className="text-[#f7f8f8] font-[510]">Adicionar conta</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCancel} className="items-center py-3 rounded-full border-[0.5px] border-white/10 bg-white/5">
              <Text className="text-[#f7f8f8] font-[510]">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <ThemedView className="flex-1 bg-[#08090a]">
      <View className="flex-1 w-full self-center px-6 pt-8 pb-12" style={containerStyle}>
        <FlatList
          data={filteredBills}
          keyExtractor={(b) => b.id}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View className="bg-[#191a1b] rounded-2xl px-4 py-8 border-[0.5px] border-white/10 items-center">
              <ThemedText className="text-center text-[#d0d6e0] font-[400]">Nenhuma conta cadastrada.</ThemedText>
            </View>
          }
          renderItem={({ item: bill, index }) => {
            const urgencyColorClass = bill.priority === "HIGH" ? "text-[#ef4444]" : bill.priority === "MEDIUM" ? "text-[#facc15]" : "text-[#10b981]";
            const urgencyBgClass = bill.priority === "HIGH" ? "bg-[#ef4444]/10 border-[#ef4444]/30" : bill.priority === "MEDIUM" ? "bg-[#facc15]/10 border-[#facc15]/30" : "bg-[#10b981]/10 border-[#10b981]/30";
            
            const translatedUrgency = bill.priority === "HIGH" ? "ALTA" : bill.priority === "MEDIUM" ? "MÉDIA" : "BAIXA";

            return (
              <View className={`bg-[#191a1b] px-4 flex flex-row items-center gap-4 py-4 border-x-[0.5px] border-white/10 ${index === 0 ? 'rounded-t-2xl border-t-[0.5px]' : ''} ${index === filteredBills.length - 1 ? 'rounded-b-2xl border-b-[0.5px]' : 'border-b-[0.5px]'}`}>
                <TouchableOpacity onPress={() => handleTogglePaid(bill)} className={`w-6 h-6 items-center justify-center rounded-md border-[0.5px] ${bill.status === "PAID" ? "bg-[#10b981] border-[#10b981]/80" : "border-white/20"}`}>
                  {bill.status === "PAID" && <Text className="text-[#f7f8f8] font-[590] text-xs">✓</Text>}
                </TouchableOpacity>

                <View className="flex-1 flex col gap-1">
                  <ThemedText className="font-[510] text-[#f7f8f8]">{bill.name}</ThemedText>
                  <ThemedText className="text-xs text-[#d0d6e0] font-[400]">Vence em {formatDateBR(bill.dueDate)}</ThemedText>
                  <View className={`self-start mt-1 border-[0.5px] px-2 py-1 rounded-full ${urgencyBgClass}`}>
                    <ThemedText type="monoLabel" className={`text-[10px] tracking-widest ${urgencyColorClass}`}>{translatedUrgency}</ThemedText>
                  </View>
                </View>

                <View className="items-end gap-2">
                  <ThemedText className="font-[590] tracking-tight text-[#f7f8f8]">{formatCurrencyBRL(bill.amountCents)}</ThemedText>
                  <ThemedText className="text-xs text-[#d0d6e0] font-[400]">{bill.status === "PAID" ? "Pago" : "Pendente"}</ThemedText>
                  <TouchableOpacity onPress={() => handleDelete(bill)} className="border-[0.5px] border-white/10 bg-white/5 rounded-full px-3 py-1">
                    <Text className="text-[#f7f8f8] text-[10px] font-[510]">Excluir</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      </View>

      {!isDesktop && !showForm && (
        <TouchableOpacity
          onPress={() => setShowForm(true)}
          className="absolute right-5 bg-[#5e6ad2] rounded-full px-5 py-3 border-[0.5px] border-[#5e6ad2]/80"
          style={{ bottom: 24 + insets.bottom }}
        >
          <Text className="text-[#f7f8f8] font-[510]">Nova conta</Text>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}
