import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, Alert, ScrollView, View, TouchableOpacity, Text } from "react-native";

import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { formatCurrencyBRL } from "@/utils/currency";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

import type { BillUrgency, TransactionType } from "@/types/models";

type DueItem = {
  id: string;
  name: string;
  amountCents: number;
  dueDateISO: string;
  urgency: BillUrgency;
};

type TransactionItem = {
  id: string;
  description: string | null;
  amountCents: number;
  type: TransactionType;
  occurredAt: string;
};

const formatDateBR = (isoDate: string): string => {
  const [year, month, day] = isoDate.split("-").map((chunk) => Number(chunk));
  if (!year || !month || !day) return isoDate;
  const date: Date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
};

const getGreeting = (now: Date): string => {
  const hours: number = now.getHours();
  if (hours >= 5 && hours <= 11) return "Bom dia";
  if (hours >= 12 && hours <= 17) return "Boa tarde";
  return "Boa noite";
};

export default function DashboardScreen(): React.JSX.Element {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const { logout, isLoading: isAuthLoading } = useAuth();
  const {
    profile, saldoMesCents, totalPendentesCents, urgentBills, pendingTasksCount, recentTransactions,
    isLoading: isDashboardLoading, errorMessage,
  } = useDashboard();

  const name: string = profile?.fullName ?? "—";
  const greeting: string = useMemo(() => getGreeting(new Date()), []);

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      router.replace("/(auth)/login");
    } catch (error) {
      Alert.alert("Erro ao sair", error instanceof Error ? error.message : "Não foi possível sair agora.");
    }
  };

  if (isDashboardLoading) {
    return (
      <ThemedView className="flex-1 items-center justify-center bg-[#08090a]">
        <ActivityIndicator size="large" color="#f7f8f8" />
      </ThemedView>
    );
  }

  if (errorMessage) {
    return (
      <ThemedView className="flex-1 items-center justify-center bg-[#08090a]">
        <ThemedText className="text-[#ef4444] text-center font-[590]">{errorMessage}</ThemedText>
      </ThemedView>
    );
  }

  const contasUrgentes: DueItem[] = urgentBills.map((bill) => ({
    id: bill.id, name: bill.name, amountCents: bill.amountCents,
    dueDateISO: bill.dueDate, urgency: bill.priority,
  }));

  const ultimasTransacoes: TransactionItem[] = recentTransactions.map((t) => ({
    id: t.id, description: t.description, amountCents: t.amountCents,
    type: t.type, occurredAt: t.occurredAt,
  }));

  const containerStyle = { maxWidth: isDesktop ? "100%" as const : 720 };

  return (
    <ThemedView className="flex-1 bg-[#08090a]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 48 }}>
        <View className="w-full self-center flex flex-col gap-8" style={containerStyle}>
          
          {/* Header */}
          <View className="flex flex-row justify-between items-center">
            <View className="flex flex-col gap-1">
              <ThemedText type="subtitle" className="font-[400] text-[#d0d6e0]">{greeting},</ThemedText>
              <ThemedText type="title" className="text-3xl font-[590] text-[#f7f8f8] tracking-tight">{name}</ThemedText>
            </View>

            <TouchableOpacity
              onPress={handleLogout}
              disabled={isAuthLoading}
              className="bg-white/5 border-[0.5px] border-white/10 rounded-full px-5 py-3"
            >
              <Text className="text-[#f7f8f8] font-[510]">{isAuthLoading ? "..." : "Sair"}</Text>
            </TouchableOpacity>
          </View>

          {/* Cards Grid */}
          <View className={`flex gap-4 ${isDesktop ? 'flex-row flex-wrap' : 'flex-col'}`}>
            <View className="flex-1 min-w-[200px] bg-[#191a1b] rounded-2xl p-5 border-[0.5px] border-white/10">
              <ThemedText className="text-[#d0d6e0] mb-3 font-[510]">Saldo do mês</ThemedText>
              <ThemedText className="text-4xl font-[590] tracking-tight text-[#f7f8f8]">{saldoMesCents > 0 ? "+" : ""}{formatCurrencyBRL(saldoMesCents)}</ThemedText>
              <ThemedText className="text-xs text-[#d0d6e0]/60 mt-3 font-[400]">Mês atual</ThemedText>
            </View>

            <View className="flex-1 min-w-[200px] bg-[#191a1b] rounded-2xl p-5 border-[0.5px] border-white/10">
              <ThemedText className="text-[#d0d6e0] mb-3 font-[510]">Contas pendentes</ThemedText>
              <ThemedText className="text-4xl font-[590] tracking-tight text-[#f7f8f8]">{formatCurrencyBRL(totalPendentesCents)}</ThemedText>
              <ThemedText className="text-xs text-[#d0d6e0]/60 mt-3 font-[400]">Em aberto</ThemedText>
            </View>

            <View className="flex-1 min-w-[200px] bg-[#191a1b] rounded-2xl p-5 border-[0.5px] border-white/10">
              <ThemedText className="text-[#d0d6e0] mb-3 font-[510]">Tarefas pendentes</ThemedText>
              <ThemedText className="text-4xl font-[590] tracking-tight text-[#f7f8f8]">{pendingTasksCount}</ThemedText>
              <ThemedText className="text-xs text-[#d0d6e0]/60 mt-3 font-[400]">Para concluir</ThemedText>
            </View>
          </View>

          {/* Sections List Grid */}
          <View className={`flex gap-4 ${isDesktop ? 'flex-row flex-wrap' : 'flex-col'}`}>
            
            {/* Transactions Section */}
            <View className="flex-1 min-w-[300px] flex col gap-3">
              <ThemedText type="subtitle" className="text-xl font-[590] text-[#f7f8f8]">Últimas transações</ThemedText>
              <View className="bg-[#191a1b] rounded-2xl px-4 py-2 border-[0.5px] border-white/10 flex flex-col gap-1">
                {ultimasTransacoes.length === 0 ? (
                  <ThemedText className="text-center py-5 text-[#d0d6e0] font-[400]">Nenhuma transação recente.</ThemedText>
                ) : (
                  ultimasTransacoes.map((t, index) => {
                    const isIncome = t.type === "INCOME";
                    return (
                      <View key={t.id} className={`flex flex-row items-center justify-between py-3 ${index === ultimasTransacoes.length - 1 ? '' : 'border-b-[0.5px] border-white/10'}`}>
                        <View className="flex-1 pr-3 flex col gap-1">
                          <ThemedText className="font-[510] text-[#f7f8f8]">{t.description ?? "Sem descrição"}</ThemedText>
                          <ThemedText className="text-xs text-[#d0d6e0] font-[400]">{formatDateBR(t.occurredAt)} · {isIncome ? "Receita" : "Despesa"}</ThemedText>
                        </View>
                        <View className="items-end gap-1">
                          <ThemedText className={`font-[590] ${isIncome ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>{isIncome ? "+" : "-"}{formatCurrencyBRL(Math.abs(t.amountCents))}</ThemedText>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </View>

            {/* Urgent Bills Section */}
            <View className="flex-1 min-w-[300px] flex col gap-3">
              <ThemedText type="subtitle" className="text-xl font-[590] text-[#f7f8f8]">Contas urgentes</ThemedText>
              <View className="bg-[#191a1b] rounded-2xl px-4 py-2 border-[0.5px] border-white/10 flex flex-col gap-1">
                {contasUrgentes.length === 0 ? (
                  <ThemedText className="text-center py-5 text-[#d0d6e0] font-[400]">Nenhuma conta urgente.</ThemedText>
                ) : (
                  contasUrgentes.map((item, index) => (
                    <View key={item.id} className={`flex flex-row items-center justify-between py-3 ${index === contasUrgentes.length - 1 ? '' : 'border-b-[0.5px] border-white/10'}`}>
                      <View className="flex-1 pr-3 flex col gap-1">
                        <ThemedText className="font-[510] text-[#f7f8f8]">{item.name}</ThemedText>
                        <ThemedText className="text-xs text-[#d0d6e0] font-[400]">Vence em {formatDateBR(item.dueDateISO)}</ThemedText>
                      </View>

                      <View className="items-end gap-2">
                        <ThemedText className="font-[590] text-[#f7f8f8]">{formatCurrencyBRL(item.amountCents)}</ThemedText>
                        <View className="bg-[#facc15]/10 border-[0.5px] border-[#facc15]/30 px-2 py-1 rounded-full">
                          <ThemedText type="monoLabel" className="text-[#facc15] text-[10px] leading-[10px] tracking-widest">URGENTE</ThemedText>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>

          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}
