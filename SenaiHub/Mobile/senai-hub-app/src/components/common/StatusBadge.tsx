import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  success: { bg: '#E6F8EE', text: colors.green, border: '#B9EBD0' },
  warning: { bg: '#FFF6DB', text: colors.orange, border: '#FFE7A3' },
  danger: { bg: '#FFE7E9', text: colors.red, border: '#FFC7CC' },
  info: { bg: '#E8F1FF', text: colors.blue, border: '#C7DAFF' },
  neutral: { bg: '#F1F5F9', text: colors.grayText, border: colors.border },
};

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function StatusBadge({ label, variant = 'neutral' }: StatusBadgeProps) {
  const style = variantStyles[variant];

  return (
    <View style={[styles.badge, { backgroundColor: style.bg, borderColor: style.border }]}>
      <Text style={[styles.text, { color: style.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
  },
});
