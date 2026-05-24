import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { ChevronRight, LogOut } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useAppStore } from '@/stores/app.store';
import { useAuthStore } from '@/stores/auth.store';

export interface DrawerMenuItem {
  label: string;
  route: string;
}

interface SidebarDrawerProps {
  items: DrawerMenuItem[];
  moduleTitle: string;
}

export function SidebarDrawer({ items, moduleTitle }: SidebarDrawerProps) {
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const logout = useAuthStore((s) => s.logout);
  const session = useAuthStore((s) => s.session);
  const router = useRouter();
  const pathname = usePathname();

  const navigate = (route: string) => {
    setSidebarOpen(false);
    router.push(route as never);
  };

  return (
    <Modal visible={sidebarOpen} animationType="slide" transparent>
      <Pressable style={styles.overlay} onPress={() => setSidebarOpen(false)}>
        <Pressable style={styles.drawer} onPress={(event) => event.stopPropagation()}>
          <View style={styles.brandRow}>
            <View style={styles.senaiMark}>
              <Text style={styles.senaiText}>SENAI</Text>
            </View>
            <Text style={styles.moduleTitle}>{moduleTitle.replace('SENAI ', '')}</Text>
          </View>
          <Text style={styles.userName}>{session?.perfil?.nome ?? 'Usuário'}</Text>
          <ScrollView style={styles.menu} showsVerticalScrollIndicator={false}>
            {items.map((item) => {
              const active = pathname === item.route;
              return (
                <Pressable
                  key={item.route}
                  style={[styles.menuItem, active && styles.menuItemActive]}
                  onPress={() => navigate(item.route)}
                >
                  <Text style={[styles.menuText, active && styles.menuTextActive]}>
                    {item.label}
                  </Text>
                  <ChevronRight size={16} color={active ? colors.white : colors.mutedText} />
                </Pressable>
              );
            })}
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setSidebarOpen(false);
                router.push('/hub');
              }}
            >
              <Text style={styles.menuText}>Voltar ao Hub</Text>
              <ChevronRight size={16} color={colors.mutedText} />
            </Pressable>
          </ScrollView>
          <Pressable
            style={styles.logout}
            onPress={async () => {
              setSidebarOpen(false);
              await logout();
              router.replace('/login');
            }}
          >
            <LogOut size={18} color={colors.red} />
            <Text style={styles.logoutText}>Sair</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawer: {
    width: '78%',
    maxWidth: 320,
    backgroundColor: colors.navyDark,
    padding: 18,
    height: '100%',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  senaiMark: {
    height: 24,
    borderRadius: 3,
    backgroundColor: colors.red,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  senaiText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  moduleTitle: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
  userName: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 18,
  },
  menu: { flex: 1 },
  menuItem: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  menuItemActive: { backgroundColor: colors.red },
  menuText: { color: colors.mutedText, fontSize: 14, fontWeight: '700' },
  menuTextActive: { color: colors.white },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  logoutText: { color: colors.red, fontWeight: '700', fontSize: 16 },
});
