import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { SidebarDrawer } from '@/components/layout/SidebarDrawer';
import { colors, gridTheme } from '@/constants/colors';
import { GRID_BOTTOM_NAV, GRID_DRAWER_ITEMS } from '@/constants/navigation';
import { canAccessGrid } from '@/lib/permissions';
import { useAuthStore } from '@/stores/auth.store';

export default function GridLayout() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);

  useEffect(() => {
    if (!session) {
      router.replace('/login');
      return;
    }
    if (session.perfil && !canAccessGrid(session.perfil, session.aplicacoes)) {
      router.replace('/hub');
    }
  }, [session, router]);

  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="SENAI Grid" accentColor={gridTheme.primary} notificationCount={2} />
      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade_from_bottom',
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </View>
      <BottomNav items={GRID_BOTTOM_NAV} accentColor={gridTheme.accent} />
      <SidebarDrawer items={GRID_DRAWER_ITEMS} moduleTitle="SENAI Grid" accentColor={gridTheme.accent} />
    </View>
  );
}
