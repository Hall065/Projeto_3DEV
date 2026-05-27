import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { SidebarDrawer } from '@/components/layout/SidebarDrawer';
import { colors, connectTheme } from '@/constants/colors';
import { CONNECT_BOTTOM_NAV, CONNECT_DRAWER_ITEMS } from '@/constants/navigation';
import { canAccessConnect } from '@/lib/permissions';
import { useAuthStore } from '@/stores/auth.store';

export default function ConnectLayout() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);

  useEffect(() => {
    if (!session) {
      router.replace('/login');
      return;
    }
    if (session.perfil && !canAccessConnect(session.perfil, session.aplicacoes)) {
      router.replace('/hub');
    }
  }, [session, router]);

  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="SENAI Connect" accentColor={connectTheme.primary} notificationCount={1} />
      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade_from_bottom',
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </View>
      <BottomNav items={CONNECT_BOTTOM_NAV} accentColor={connectTheme.accent} />
      <SidebarDrawer items={CONNECT_DRAWER_ITEMS} moduleTitle="SENAI Connect" accentColor={connectTheme.accent} />
    </View>
  );
}
