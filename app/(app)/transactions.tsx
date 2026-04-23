import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, View, TouchableOpacity, TextInput, Text, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useTransactions } from "@/hooks/useTransactions";
import type { Transaction, TransactionType } from "@/types/models";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

const formatCurrencyBRL = (valueCents: number): string => {
  const value: number = valueCents / 100;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

const formatDateBR = (isoDate: string): string => {
  const [year, month, day] = isoDate.split("-").map((chunk) => Number(chunk));
  if (!year || !month || !day) return isoDate;
  const date: Date = new Date(year, month - 1, day);
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

export default function TransactionsScreen(): React.JSX.Element {
  const isDesktop = useIsDesktop();
  const insets = useSafeAreaInsets();
  const { transactions, isLoading, errorMessage, createTransaction, deleteTransaction } = useTransactions();

  const [showForm, setShowForm] = useState<boolean>(false);
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [type, setType] = useState<TransactionType>("entrada");
  const [category, setCategory] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const orderedTransactions = useMemo((): Transaction[] => {
    return [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions]);

  const descriptionError = useMemo((): string | null => description.trim().length === 0 ? "Descrição é obrigatória" : null, [description]);
  const amountCents = useMemo(() => parseAmountToCents(amount), [amount]);
  const amountError = useMemo((): string | null => (amountCents === null || amountCents <= 0) ? "Valor deve ser maior que zero" : null, [amountCents]);
  
  const dateError = useMemo((): string | null => {
    if (date.trim().length === 0) return "Data é obrigatória";
    if (!isoDateRegex.test(date) || !isRealIsoDate(date)) return "Data inválida. Use o formato AAAA-MM-DD";
    return null;
  }, [date]);

  const canSubmit = useMemo((): boolean => !descriptionError && !amountError && !dateError, [descriptionError, amountError, dateError]);

  const handleCreate = async (): Promise<void> => {
    if (!canSubmit || amountCents === null || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await createTransaction({
        description: description.trim(), amountCents, type, date,
        category: category.trim().length > 0 ? category.trim() : null,
      });
      handleCancel();
    } catch (error: unknown) {
      Alert.alert("Erro ao criar transação", error instanceof Error ? error.message : "Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = (): void => {
    setDescription(""); setAmount(""); setCategory(""); setDate(""); setType("entrada"); setShowForm(false);
  };

  const handleDelete = (transaction: Transaction): void => {
    Alert.alert("Excluir transação", "Tem certeza que deseja excluir esta transação?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => {
          try { await deleteTransaction(transaction.id); } 
          catch (error: unknown) { Alert.alert("Erro", error instanceof Error ? error.message : "Tente novamente."); }
        },
      },
    ]);
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
          <ThemedText type="title" className="text-2xl font-[590] text-[#f7f8f8] tracking-tight">Transações</ThemedText>
          <ThemedText className="text-[#d0d6e0] font-[400]">Acompanhe entradas e saídas do mês.</ThemedText>
        </View>
        {isDesktop && !showForm ? (
          <TouchableOpacity onPress={() => setShowForm(true)} className="bg-[#5e6ad2] px-5 py-3 rounded-full border-[0.5px] border-[#5e6ad2]/80">
            <Text className="text-white font-[510]">Nova transação</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {showForm && (
        <View className="bg-[#191a1b] border-[0.5px] border-white/10 rounded-2xl p-5 flex flex-col gap-4">
          <TextInput value={description} onChangeText={setDescription} placeholderTextColor="#d0d6e0" placeholder="Descrição" className="bg-white/5 border-[0.5px] border-white/10 text-[#f7f8f8] rounded-xl p-4 font-[400]" />
          {descriptionError && <ThemedText className="text-[#ef4444] text-xs font-[510]">{descriptionError}</ThemedText>}

          <TextInput value={amount} onChangeText={(value) => setAmount(formatAmountInput(value))} placeholderTextColor="#d0d6e0" placeholder="Valor (R$)" keyboardType="decimal-pad" className="bg-white/5 border-[0.5px] border-white/10 text-[#f7f8f8] rounded-xl p-4 font-[400]" />
          {amountError && <ThemedText className="text-[#ef4444] text-xs font-[510]">{amountError}</ThemedText>}

          <View className="flex flex-row gap-3">
            <TouchableOpacity onPress={() => setType("entrada")} className={`flex-1 items-center py-3 rounded-full border-[0.5px] ${type === "entrada" ? "bg-white/10 border-white/20" : "border-white/5"}`}>
              <Text className={`font-[510] ${type === "entrada" ? "text-[#10b981]" : "text-[#d0d6e0]"}`}>Entrada</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setType("saida")} className={`flex-1 items-center py-3 rounded-full border-[0.5px] ${type === "saida" ? "bg-white/10 border-white/20" : "border-white/5"}`}>
              <Text className={`font-[510] ${type === "saida" ? "text-[#ef4444]" : "text-[#d0d6e0]"}`}>Saída</Text>
            </TouchableOpacity>
          </View>

          <TextInput value={category} onChangeText={setCategory} placeholder="Categoria (opcional)" placeholderTextColor="#d0d6e0" className="bg-white/5 border-[0.5px] border-white/10 text-[#f7f8f8] rounded-xl p-4 font-[400]" />
          <TextInput value={date} onChangeText={(value) => setDate(formatDateInput(value))} placeholder="Data (AAAA-MM-DD)" placeholderTextColor="#d0d6e0" autoCapitalize="none" autoCorrect={false} maxLength={10} keyboardType="numbers-and-punctuation" className="bg-white/5 border-[0.5px] border-white/10 text-[#f7f8f8] rounded-xl p-4 font-[400]" />
          {dateError && <ThemedText className="text-[#ef4444] text-xs font-[510]">{dateError}</ThemedText>}

          <View className="flex flex-col gap-3 mt-3">
            <TouchableOpacity onPress={handleCreate} disabled={!canSubmit || isSubmitting} className={`items-center py-3 rounded-full border-[0.5px] border-[#5e6ad2]/80 bg-[#5e6ad2] ${(!canSubmit || isSubmitting) ? "opacity-50" : ""}`}>
              <Text className="text-[#f7f8f8] font-[510]">Adicionar transação</Text>
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
          data={orderedTransactions}
          keyExtractor={(t) => t.id}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View className="bg-[#191a1b] rounded-2xl px-4 py-8 border-[0.5px] border-white/10 items-center">
              <ThemedText className="text-center text-[#d0d6e0] font-[400]">Nenhuma transação cadastrada.</ThemedText>
            </View>
          }
          renderItem={({ item: transaction, index }) => {
            const isIncome = transaction.type === "entrada";
            return (
              <View className={`bg-[#191a1b] px-4 flex flex-row items-center gap-4 py-4 border-x-[0.5px] border-white/10 ${index === 0 ? 'rounded-t-2xl border-t-[0.5px]' : ''} ${index === orderedTransactions.length - 1 ? 'rounded-b-2xl border-b-[0.5px]' : 'border-b-[0.5px]'}`}>
                <View className="flex-1 flex col gap-1">
                  <ThemedText className="font-[510] text-[#f7f8f8]">{transaction.description}</ThemedText>
                  <ThemedText className="text-xs text-[#d0d6e0] font-[400]">{transaction.category ?? "Sem categoria"} · {formatDateBR(transaction.date)}</ThemedText>
                </View>

                <View className="items-end gap-1">
                  <ThemedText className={`font-[590] tracking-tight ${isIncome ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>{isIncome ? "+" : "-"}{formatCurrencyBRL(Math.abs(transaction.amountCents))}</ThemedText>
                  <ThemedText className="text-xs text-[#d0d6e0] font-[400]">{isIncome ? "Entrada" : "Saída"}</ThemedText>
                  <TouchableOpacity onPress={() => handleDelete(transaction)} className="border-[0.5px] border-white/10 bg-white/5 rounded-full px-3 py-1">
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
          <Text className="text-[#f7f8f8] font-[510]">Nova transação</Text>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}
