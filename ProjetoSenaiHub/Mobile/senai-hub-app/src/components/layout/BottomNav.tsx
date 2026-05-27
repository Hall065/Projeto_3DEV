import { cloneElement, isValidElement, type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useRouter } from 'expo-router';
import { AnimatedPressable } from '@/components/common/VisualPrimitives';
import { colors } from '@/constants/colors';

export interface NavItem {
  label: string;
  route: string;
  icon: ReactElement<{ color?: string; size?: number }>;
}

interface BottomNavProps {
  items: NavItem[];
  accentColor?: string;
}

export function BottomNav({ items, accentColor = colors.navy }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const activeBg =
    accentColor === colors.red ? '#FFE7E9' : accentColor === colors.green ? '#E6F8EE' : colors.panelSoft;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 8 }]}>
      {items.map((item) => {
        const active = pathname === item.route || pathname.startsWith(item.route + '/');
        const iconColor = active ? accentColor : colors.grayText;
        const icon = isValidElement(item.icon)
          ? cloneElement(item.icon, { color: iconColor, size: active ? 22 : 20 })
          : item.icon;
        return (
          <AnimatedPressable
            key={item.route}
            wrapperStyle={styles.itemWrap}
            style={[styles.item, active && { backgroundColor: activeBg }]}
            onPress={() => router.push(item.route as never)}
          >
            {active ? <View style={[styles.activeBar, { backgroundColor: accentColor }]} /> : null}
            {icon}
            <Text style={[styles.label, active && { color: accentColor, fontWeight: '700' }]}>
              {item.label}
            </Text>
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 7,
    paddingHorizontal: 8,
    shadowColor: colors.black,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
    elevation: 8,
  },
  itemWrap: { flex: 1 },
  item: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  activeBar: {
    position: 'absolute',
    top: 0,
    width: 28,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  label: { fontSize: 10, color: colors.grayText, fontWeight: '700' },
});
