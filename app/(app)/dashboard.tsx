import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
} from "react-native";
import { XStack, YStack, Button, Circle, Card, SizableText } from "tamagui";

import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

type DueUrgency = "alto" | "medio" | "baixo";

type DueItem = {
  id: string;
  name: string;
  amountCents: number;
  dueDateISO: string; // YYYY-MM-DD
  urgency: DueUrgency;
};

type TransactionType = "entrada" | "saida";

type TransactionItem = {
  id: string;
  description: string;
  amountCents: number;
  type: TransactionType;
  date: string;
};

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
    profile,
    saldoMesCents,
    totalPendentesCents,
    urgentBills,
    pendingTasksCount,
    recentTransactions,
    isLoading: isDashboardLoading,
    errorMessage,
  } = useDashboard();

  const name: string = profile?.fullName ?? "—";
  const greeting: string = useMemo(() => getGreeting(new Date()), []);

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      router.replace("/(auth)/login");
    } catch (error) {
      Alert.alert(
        "Erro ao sair",
        error instanceof Error ? error.message : "Não foi possível sair agora.",
      );
    }
  };

  if (isDashboardLoading) {
    return (
      <ThemedView f={1} ai="center" jc="center">
        <ActivityIndicator size="large" color="#000000" />
      </ThemedView>
    );
  }

  if (errorMessage) {
    return (
      <ThemedView f={1} ai="center" jc="center">
        <ThemedText color="$danger" type="defaultSemiBold" ta="center">
          {errorMessage}
        </ThemedText>
      </ThemedView>
    );
  }

  const contasUrgentes: DueItem[] = urgentBills.map((bill) => ({
    id: bill.id,
    name: bill.description,
    amountCents: bill.amountCents,
    dueDateISO: bill.dueDate,
    urgency: bill.urgency,
  }));

  const ultimasTransacoes: TransactionItem[] = recentTransactions.map((t) => ({
    id: t.id,
    description: t.description,
    amountCents: t.amountCents,
    type: t.type,
    date: t.date,
  }));

  return (
    <ThemedView f={1}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 48 }}
      >
        <YStack gap="$6" w="100%" maxWidth={isDesktop ? "100%" : 720} als="center">
          
          {/* Header */}
          <XStack jc="space-between" ai="center">
            <YStack gap="$1">
              <ThemedText type="subtitle" fontWeight="$3">{greeting},</ThemedText>
              <ThemedText type="title" fontSize="$7">{name}</ThemedText>
            </YStack>

            <Button
              onPress={handleLogout}
              disabled={isAuthLoading}
              bg="$buttonBg"
              br="$pill"
              color="$buttonColor"
              px="$5"
              py="$3"
            >
              {isAuthLoading ? "..." : "Sair"}
            </Button>
          </XStack>

          {/* Cards Grid */}
          <XStack fw="wrap" gap="$4" fd={isDesktop ? "row" : "column"}>
            <Card
              f={1} minWidth={200} bg="$cardBackground" br="$comfortable" p="$5" bw={1} bc="$cardBorder"
            >
              <ThemedText type="default" color="$color" o={0.7} mb="$3">Saldo do mês</ThemedText>
              <ThemedText type="title" fontSize="$8" color={saldoMesCents >= 0 ? "$success" : "$danger"}>
                {formatCurrencyBRL(saldoMesCents)}
              </ThemedText>
              <ThemedText type="default" fontSize="$2" color="$color" o={0.5} mt="$3">Mês atual</ThemedText>
            </Card>

            <Card
              f={1} minWidth={200} bg="$cardBackground" br="$comfortable" p="$5" bw={1} bc="$cardBorder"
            >
              <ThemedText type="default" color="$color" o={0.7} mb="$3">Contas pendentes</ThemedText>
              <ThemedText type="title" fontSize="$8" color="$danger">
                {formatCurrencyBRL(totalPendentesCents)}
              </ThemedText>
              <ThemedText type="default" fontSize="$2" color="$color" o={0.5} mt="$3">Em aberto</ThemedText>
            </Card>

            <Card
              f={1} minWidth={200} bg="$cardBackground" br="$comfortable" p="$5" bw={1} bc="$cardBorder"
            >
              <ThemedText type="default" color="$color" o={0.7} mb="$3">Tarefas pendentes</ThemedText>
              <ThemedText type="title" fontSize="$8">{pendingTasksCount}</ThemedText>
              <ThemedText type="default" fontSize="$2" color="$color" o={0.5} mt="$3">Para concluir</ThemedText>
            </Card>
          </XStack>

          {/* Sections List Grid */}
          <XStack fw="wrap" gap="$4" fd={isDesktop ? "row" : "column"}>
            
            {/* Transactions Section */}
            <YStack f={1} minWidth={300} gap="$3">
              <ThemedText type="subtitle" fontSize="$5">Últimas transações</ThemedText>
              <Card bg="$cardBackground" br="$comfortable" px="$4" py="$2" bw={1} bc="$cardBorder" gap="$1">
                {ultimasTransacoes.length === 0 ? (
                  <ThemedText type="default" ta="center" py="$5" o={0.6}>
                    Nenhuma transação recente.
                  </ThemedText>
                ) : (
                  ultimasTransacoes.map((t, index) => {
                    const isIncome = t.type === "entrada";
                    return (
                      <XStack key={t.id} ai="center" jc="space-between" py="$3" borderBottomWidth={index === ultimasTransacoes.length - 1 ? 0 : 1} borderBottomColor="$cardBorder">
                        <YStack f={1} pr="$3" gap="$1">
                          <ThemedText type="defaultSemiBold">{t.description}</ThemedText>
                          <ThemedText type="default" fontSize="$1" o={0.6}>
                            {formatDateBR(t.date)} · {isIncome ? "Entrada" : "Saída"}
                          </ThemedText>
                        </YStack>
                        <YStack ai="flex-end" gap="$1">
                          <ThemedText type="defaultSemiBold" color={isIncome ? "$success" : "$danger"}>
                            {formatCurrencyBRL(t.amountCents)}
                          </ThemedText>
                        </YStack>
                      </XStack>
                    );
                  })
                )}
              </Card>
            </YStack>

            {/* Urgent Bills Section */}
            <YStack f={1} minWidth={300} gap="$3">
              <ThemedText type="subtitle" fontSize="$5">Contas urgentes</ThemedText>
              <Card bg="$cardBackground" br="$comfortable" px="$4" py="$2" bw={1} bc="$cardBorder" gap="$1">
                {contasUrgentes.length === 0 ? (
                  <ThemedText type="default" ta="center" py="$5" o={0.6}>Nenhuma conta urgente.</ThemedText>
                ) : (
                  contasUrgentes.map((item, index) => (
                    <XStack key={item.id} ai="center" jc="space-between" py="$3" borderBottomWidth={index === contasUrgentes.length - 1 ? 0 : 1} borderBottomColor="$cardBorder">
                      <YStack f={1} pr="$3" gap="$1">
                        <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                        <ThemedText type="default" fontSize="$1" o={0.6}>
                          Vence em {formatDateBR(item.dueDateISO)}
                        </ThemedText>
                      </YStack>

                      <YStack ai="flex-end" gap="$2">
                        <ThemedText type="defaultSemiBold">
                          {formatCurrencyBRL(item.amountCents)}
                        </ThemedText>
                        <XStack bg="$danger" px="$2" py="$1" br="$pill">
                          <ThemedText type="monoLabel" color="$color" fontSize={10} lh={10} ls={0.6}>Urgente</ThemedText>
                        </XStack>
                      </YStack>
                    </XStack>
                  ))
                )}
              </Card>
            </YStack>

          </XStack>
        </YStack>
      </ScrollView>
    </ThemedView>
  );
}
