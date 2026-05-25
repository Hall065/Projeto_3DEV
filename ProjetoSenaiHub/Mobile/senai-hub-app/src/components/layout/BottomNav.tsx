import { cloneElement, isValidElement, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useRouter } from 'expo-router';
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

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 8 }]}>
      {items.map((item) => {
        const active = pathname === item.route || pathname.startsWith(item.route + '/');
        const iconColor = active ? accentColor : colors.grayText;
        const icon = isValidElement(item.icon)
          ? cloneElement(item.icon, { color: iconColor, size: active ? 22 : 20 })
          : item.icon;
        return (
          <Pressable
            key={item.route}
            style={[styles.item, active && styles.itemActive]}
            onPress={() => router.push(item.route as never)}
          >
            {icon}
            <Text style={[styles.label, active && { color: accentColor, fontWeight: '700' }]}>
              {item.label}
            </Text>
          </Pressable>
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
  item: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: 8,
  },
  itemActive: { backgroundColor: colors.panelSoft },
  label: { fontSize: 10, color: colors.grayText },
});
