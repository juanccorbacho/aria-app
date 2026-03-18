import { useMemo } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';

type DueUrgency = 'alto' | 'medio';

type DueItem = {
  id: string;
  name: string;
  amountCents: number;
  dueDateISO: string; // YYYY-MM-DD
  urgency: DueUrgency;
};

type TransactionType = 'entrada' | 'saida';

type TransactionItem = {
  id: string;
  title: string;
  category: string;
  amountCents: number;
  type: TransactionType;
};

const formatCurrencyBRL = (valueCents: number): string => {
  const value: number = valueCents / 100;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDateBR = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-').map((chunk) => Number(chunk));
  if (!year || !month || !day) return isoDate;
  const date: Date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);
};

const getGreeting = (now: Date): string => {
  const hours: number = now.getHours();
  if (hours >= 5 && hours <= 11) return 'Bom dia';
  if (hours >= 12 && hours <= 17) return 'Boa tarde';
  return 'Boa noite';
};

export default function DashboardScreen(): React.JSX.Element {
  const router = useRouter();
  const { logout, isLoading: isAuthLoading } = useAuth();
  const { profile, transactions, bills, saldoAtualCents, totalAPagarCents, isLoading: isDashboardLoading, errorMessage } =
    useDashboard();

  const name: string = profile?.fullName ?? '—';
  const greeting: string = useMemo(() => getGreeting(new Date()), []);

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      Alert.alert('Erro ao sair', error instanceof Error ? error.message : 'Não foi possível sair agora.');
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
        <Text style={{ color: '#FF4D4F', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>{errorMessage}</Text>
      </View>
    );
  }

  const proximosVencimentos: DueItem[] = bills.slice(0, 3).map((b) => ({
    id: b.id,
    name: b.name,
    amountCents: b.amountCents,
    dueDateISO: b.dueDate,
    urgency: b.urgency,
  }));

  const ultimasTransacoes: TransactionItem[] = transactions.slice(0, 4).map((t) => ({
    id: t.id,
    title: t.title,
    category: t.category ?? '',
    amountCents: t.amountCents,
    type: t.type,
  }));

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.name}>{name}</Text>
          </View>

          <TouchableOpacity
            onPress={handleLogout}
            disabled={isAuthLoading}
            accessibilityRole="button"
            style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>{isAuthLoading ? '...' : 'Sair'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cardsRow}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Saldo atual</Text>
            <Text style={[styles.bigNumber, styles.positive]}>{formatCurrencyBRL(saldoAtualCents)}</Text>
            <Text style={styles.cardHint}>Hoje</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Total a pagar</Text>
            <Text style={[styles.bigNumber, styles.negative]}>{formatCurrencyBRL(totalAPagarCents)}</Text>
            <Text style={styles.cardHint}>Próximos 30 dias</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximos vencimentos</Text>

          <View style={styles.listCard}>
            {proximosVencimentos.map((item) => {
              const urgencyLabel: string = item.urgency === 'alto' ? 'Urgente' : 'Em breve';
              const tagStyle = item.urgency === 'alto' ? styles.tagRed : styles.tagYellow;

              return (
                <View key={item.id} style={styles.row}>
                  <View style={styles.rowLeft}>
                    <Text style={styles.rowTitle}>{item.name}</Text>
                    <Text style={styles.rowSubtitle}>{formatDateBR(item.dueDateISO)}</Text>
                  </View>

                  <View style={styles.rowRight}>
                    <Text style={styles.rowAmount}>{formatCurrencyBRL(item.amountCents)}</Text>
                    <View style={[styles.tag, tagStyle]}>
                      <Text style={styles.tagText}>{urgencyLabel}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Últimas transações</Text>

          <View style={styles.listCard}>
            {ultimasTransacoes.map((t) => {
              const isIncome: boolean = t.type === 'entrada';
              const signal: string = isIncome ? '+' : '-';

              return (
                <View key={t.id} style={styles.row}>
                  <View style={styles.rowLeft}>
                    <Text style={styles.rowTitle}>{t.title}</Text>
                    <Text style={styles.rowSubtitle}>{t.category}</Text>
                  </View>

                  <View style={styles.rowRight}>
                    <Text style={[styles.rowAmount, isIncome ? styles.positive : styles.negative]}>
                      {signal}
                      {formatCurrencyBRL(t.amountCents)}
                    </Text>
                    <Text style={styles.rowMeta}>{isIncome ? 'Entrada' : 'Saída'}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 28,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    gap: 2,
  },
  greeting: {
    color: '#B3B3B3',
    fontSize: 14,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  logoutButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2B2B2B',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2B2B2B',
  },
  cardTitle: {
    color: '#B3B3B3',
    fontSize: 13,
    marginBottom: 10,
  },
  bigNumber: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  cardHint: {
    marginTop: 10,
    color: '#7A7A7A',
    fontSize: 12,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  listCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2B2B2B',
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2B2B2B',
  },
  rowLeft: {
    flex: 1,
    paddingRight: 10,
    gap: 2,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  rowTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  rowSubtitle: {
    color: '#8F8F8F',
    fontSize: 12,
  },
  rowAmount: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  rowMeta: {
    color: '#8F8F8F',
    fontSize: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagText: {
    color: '#0D0D0D',
    fontSize: 12,
    fontWeight: '800',
  },
  tagYellow: {
    backgroundColor: '#FFD54A',
  },
  tagRed: {
    backgroundColor: '#FF4D4F',
  },
  positive: {
    color: '#2EEA8A',
  },
  negative: {
    color: '#FF4D4F',
  },
});

