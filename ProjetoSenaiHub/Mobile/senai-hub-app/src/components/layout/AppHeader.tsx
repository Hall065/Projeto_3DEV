import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Menu } from 'lucide-react-native';
import { AnimatedPressable } from '@/components/common/VisualPrimitives';
import { colors } from '@/constants/colors';
import { useAppStore } from '@/stores/app.store';
import { useAuthStore } from '@/stores/auth.store';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showMenu?: boolean;
  notificationCount?: number;
  onNotificationsPress?: () => void;
  accentColor?: string;
}

export function AppHeader({
  title,
  subtitle,
  showMenu = true,
  notificationCount = 0,
  onNotificationsPress,
  accentColor = colors.navy,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const session = useAuthStore((s) => s.session);
  const moduleName = title.replace('SENAI ', '');
  const profileName = session?.perfil?.nome?.split(' ')[0] ?? 'Usuário';
  const initials = session?.perfil?.nome
    ?.split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() ?? 'SH';
  const moduleSubtitle =
    subtitle ??
    (title.includes('Grid')
      ? 'Gestão de manutenção e infraestrutura'
      : title.includes('Connect')
        ? 'Ensino conectado e gestão acadêmica'
        : 'Hub Unificado de Infraestrutura e Serviços');

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8, backgroundColor: accentColor }]}>
      <View style={styles.row}>
        {showMenu ? (
          <AnimatedPressable
            accessibilityLabel="Abrir menu"
            style={styles.iconButton}
            onPress={toggleSidebar}
            hitSlop={8}
          >
            <Menu color={colors.white} size={21} />
          </AnimatedPressable>
        ) : (
          <View style={styles.spacer} />
        )}
        <View style={styles.brandWrap}>
          <View style={styles.senaiMark}>
            <Text style={styles.senaiText}>SENAI</Text>
          </View>
          <View style={styles.brandDivider} />
          <View style={styles.titleWrap}>
            <Text style={styles.title}>{moduleName}</Text>
            <Text numberOfLines={1} style={styles.subtitle}>
              {moduleSubtitle}
            </Text>
          </View>
        </View>
        <AnimatedPressable
          accessibilityLabel="Abrir notificações"
          style={styles.iconButton}
          onPress={onNotificationsPress}
          hitSlop={8}
        >
          <Bell color={colors.white} size={22} />
          {notificationCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {notificationCount > 9 ? '9+' : notificationCount}
              </Text>
            </View>
          ) : null}
        </AnimatedPressable>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text numberOfLines={1} style={styles.profileName}>
            {profileName}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingBottom: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    shadowColor: colors.black,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  spacer: { width: 36 },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  brandWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
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
  brandDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.35)' },
  titleWrap: { flex: 1, minWidth: 0 },
  title: { fontSize: 13, fontWeight: '900', color: colors.white },
  subtitle: { fontSize: 9, color: 'rgba(255,255,255,0.72)', marginTop: 1 },
  badge: {
    position: 'absolute',
    top: 3,
    right: 4,
    backgroundColor: colors.red,
    borderRadius: 5,
    minWidth: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontSize: 7, fontWeight: '900' },
  profile: {
    maxWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  avatar: {
    width: 31,
    height: 31,
    borderRadius: 8,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.navy, fontSize: 10, fontWeight: '900' },
  profileName: { color: colors.white, fontSize: 9, fontWeight: '700' },
});
