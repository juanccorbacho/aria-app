import { Slot, usePathname, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type NavItem = {
  label: string;
  href: '/dashboard' | '/transactions' | '/bills' | '/tasks' | '/profile';
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Início', href: '/dashboard' },
  { label: 'Transações', href: '/transactions' },
  { label: 'Contas', href: '/bills' },
  { label: 'Tarefas', href: '/tasks' },
  { label: 'Perfil', href: '/profile' },
];

const isActiveRoute = (pathname: string, href: NavItem['href']): boolean => {
  if (pathname === href) return true;
  if (href === '/dashboard') return pathname === '/';
  return pathname.startsWith(href);
};

export default function SidebarLayout(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <Text style={styles.brand}>Ária</Text>

        <View style={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const active: boolean = isActiveRoute(pathname, item.href);

            return (
              <TouchableOpacity
                key={item.href}
                onPress={() => router.push(item.href)}
                accessibilityRole="button"
                style={[styles.navItem, active ? styles.navItemActive : undefined]}>
                <Text style={[styles.navLabel, active ? styles.navLabelActive : undefined]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.content}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#0D0D0D',
  },
  sidebar: {
    width: 220,
    backgroundColor: '#121212',
    paddingTop: 22,
    paddingHorizontal: 14,
    borderRightWidth: 1,
    borderRightColor: '#222222',
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 18,
  },
  nav: {
    gap: 6,
  },
  navItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  navItemActive: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2B2B2B',
  },
  navLabel: {
    color: '#CFCFCF',
    fontSize: 14,
    fontWeight: '600',
  },
  navLabelActive: {
    color: '#2EEA8A',
  },
  content: {
    flex: 1,
  },
});

