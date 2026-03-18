import { Tabs } from 'expo-router';

export default function TabsLayout(): React.JSX.Element {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="dashboard" options={{ title: 'Início' }} />
      <Tabs.Screen name="transactions" options={{ title: 'Transações' }} />
      <Tabs.Screen name="bills" options={{ title: 'Contas' }} />
      <Tabs.Screen name="tasks" options={{ title: 'Tarefas' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}

