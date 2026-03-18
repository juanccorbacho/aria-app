import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { Colors } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { useIsDesktop } from "@/hooks/useIsDesktop";

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
      <View style={styles.screen}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.screen}>
        <Text
          style={{
            color: "#FF4D4F",
            fontSize: 16,
            fontWeight: "600",
            textAlign: "center",
          }}
        >
          {errorMessage}
        </Text>
      </View>
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
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>{greeting},</Text>
              <Text style={styles.name}>{name}</Text>
            </View>

            <TouchableOpacity
              onPress={handleLogout}
              disabled={isAuthLoading}
              accessibilityRole="button"
              style={styles.logoutButton}
            >
              <Text style={styles.logoutButtonText}>
                {isAuthLoading ? "..." : "Sair"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.cardsGrid, !isDesktop && styles.cardsStack]}>
            <View
              style={[
                styles.card,
                isDesktop ? styles.cardHalf : styles.cardFull,
              ]}
            >
              <Text style={styles.cardTitle}>Saldo do mês</Text>
              <Text
                style={[
                  styles.bigNumber,
                  saldoMesCents >= 0 ? styles.positive : styles.negative,
                ]}
              >
                {formatCurrencyBRL(saldoMesCents)}
              </Text>
              <Text style={styles.cardHint}>Mês atual</Text>
            </View>

            <View
              style={[
                styles.card,
                isDesktop ? styles.cardHalf : styles.cardFull,
              ]}
            >
              <Text style={styles.cardTitle}>Contas pendentes</Text>
              <Text style={[styles.bigNumber, styles.negative]}>
                {formatCurrencyBRL(totalPendentesCents)}
              </Text>
              <Text style={styles.cardHint}>Em aberto</Text>
            </View>

            <View
              style={[
                styles.card,
                isDesktop ? styles.cardHalf : styles.cardFull,
              ]}
            >
              <Text style={styles.cardTitle}>Tarefas pendentes</Text>
              <Text style={styles.bigNumber}>{pendingTasksCount}</Text>
              <Text style={styles.cardHint}>Para concluir</Text>
            </View>
          </View>

          <View
            style={[styles.sectionGrid, !isDesktop && styles.sectionGridStack]}
          >
            <View
              style={[
                styles.section,
                isDesktop ? styles.sectionHalf : styles.sectionFull,
              ]}
            >
              <Text style={styles.sectionTitle}>Últimas transações</Text>

              <View style={styles.listCard}>
                {ultimasTransacoes.length === 0 ? (
                  <Text style={styles.emptyText}>
                    Nenhuma transação recente.
                  </Text>
                ) : (
                  ultimasTransacoes.map((t) => {
                    const isIncome: boolean = t.type === "entrada";
                    return (
                      <View key={t.id} style={styles.row}>
                        <View style={styles.rowLeft}>
                          <Text style={styles.rowTitle}>{t.description}</Text>
                          <Text style={styles.rowSubtitle}>
                            {formatDateBR(t.date)} ·{" "}
                            {isIncome ? "Entrada" : "Saída"}
                          </Text>
                        </View>

                        <View style={styles.rowRight}>
                          <Text
                            style={[
                              styles.rowAmount,
                              isIncome ? styles.positive : styles.negative,
                            ]}
                          >
                            {formatCurrencyBRL(t.amountCents)}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </View>

            <View
              style={[
                styles.section,
                isDesktop ? styles.sectionHalf : styles.sectionFull,
              ]}
            >
              <Text style={styles.sectionTitle}>Contas urgentes</Text>

              <View style={styles.listCard}>
                {contasUrgentes.length === 0 ? (
                  <Text style={styles.emptyText}>Nenhuma conta urgente.</Text>
                ) : (
                  contasUrgentes.map((item) => (
                    <View key={item.id} style={styles.row}>
                      <View style={styles.rowLeft}>
                        <Text style={styles.rowTitle}>{item.name}</Text>
                        <Text style={styles.rowSubtitle}>
                          Vence em {formatDateBR(item.dueDateISO)}
                        </Text>
                      </View>

                      <View style={styles.rowRight}>
                        <Text style={styles.rowAmount}>
                          {formatCurrencyBRL(item.amountCents)}
                        </Text>
                        <View style={[styles.tag, styles.tagRed]}>
                          <Text style={styles.tagText}>Urgente</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0D0D0D",
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
    gap: 18,
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    gap: 2,
  },
  greeting: {
    color: "#B3B3B3",
    fontSize: 14,
  },
  name: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  logoutButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2B2B2B",
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  cardsStack: {
    flexDirection: "column",
  },
  card: {
    flexGrow: 1,
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2B2B2B",
  },
  cardHalf: {
    width: "48%",
  },
  cardFull: {
    width: "100%",
  },
  cardTitle: {
    color: "#B3B3B3",
    fontSize: 13,
    marginBottom: 10,
  },
  bigNumber: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  cardHint: {
    marginTop: 10,
    color: "#7A7A7A",
    fontSize: 12,
  },
  section: {
    gap: 10,
  },
  sectionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  sectionGridStack: {
    flexDirection: "column",
  },
  sectionHalf: {
    width: "48%",
  },
  sectionFull: {
    width: "100%",
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
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
  emptyText: {
    color: "#8F8F8F",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 16,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagText: {
    color: "#0D0D0D",
    fontSize: 12,
    fontWeight: "800",
  },
  tagYellow: {
    backgroundColor: "#FFD54A",
  },
  tagGreen: {
    backgroundColor: "#2EEA8A",
  },
  tagRed: {
    backgroundColor: "#FF4D4F",
  },
  positive: {
    color: Colors.light.success,
  },
  negative: {
    color: Colors.light.danger,
  },
});
