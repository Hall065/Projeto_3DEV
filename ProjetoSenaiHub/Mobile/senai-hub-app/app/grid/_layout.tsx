import { Stack, usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { SidebarDrawer } from '@/components/layout/SidebarDrawer';
import { NotificationsModal } from '@/components/notifications/NotificationsModal';
import { colors, gridTheme } from '@/constants/colors';
import { GRID_BOTTOM_NAV, GRID_DRAWER_ITEMS } from '@/constants/navigation';
import { canAccessGrid, canAccessGridRoute } from '@/lib/permissions';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuthStore } from '@/stores/auth.store';

export default function GridLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAuthStore((s) => s.session);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifications = useNotifications(session?.userId);

  useEffect(() => {
    if (!session) {
      router.replace('/login');
      return;
    }
    if (session.perfil && !canAccessGrid(session.perfil, session.aplicacoes)) {
      router.replace('/hub');
    }
    if (session.perfil && !canAccessGridRoute(session.perfil.tipo, pathname)) {
      router.replace('/grid/chamados');
    }
  }, [pathname, session, router]);

  const drawerItems = GRID_DRAWER_ITEMS.filter((item) =>
    canAccessGridRoute(session?.perfil?.tipo, item.route)
  );
  const bottomItems = GRID_BOTTOM_NAV.filter((item) =>
    canAccessGridRoute(session?.perfil?.tipo, item.route)
  );

  return (
    <View style={{ flex: 1 }}>
      <AppHeader
        title="SENAI Grid"
        accentColor={gridTheme.primary}
        notificationCount={notifications.unreadCount}
        onNotificationsPress={() => setNotificationsOpen(true)}
      />
      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade_from_bottom',
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </View>
      <BottomNav items={bottomItems} accentColor={gridTheme.accent} />
      <SidebarDrawer items={drawerItems} moduleTitle="SENAI Grid" accentColor={gridTheme.accent} />
      <NotificationsModal
        visible={notificationsOpen}
        notifications={notifications.notifications}
        loading={notifications.loading}
        onClose={() => setNotificationsOpen(false)}
        onMarkAsRead={notifications.markAsRead}
        onMarkAllAsRead={notifications.markAllAsRead}
      />
    </View>
  );
}
