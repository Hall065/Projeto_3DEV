import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';
import { AnimatedPressable } from './VisualPrimitives';
import { StatusBadge } from './StatusBadge';

interface DataCardProps {
  title: string;
  subtitle?: string;
  statusLabel?: string;
  onPress?: () => void;
}

export function DataCard({ title, subtitle, statusLabel, onPress }: DataCardProps) {
  return (
    <AnimatedPressable style={styles.card} onPress={onPress}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {title
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase()}
        </Text>
      </View>
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {statusLabel ? <StatusBadge label={statusLabel} variant="success" /> : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE7E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.red, fontSize: 12, fontWeight: '900' },
  content: { flex: 1, minWidth: 0 },
  title: { fontSize: 14, fontWeight: '800', color: colors.navy },
  subtitle: { marginTop: 3, fontSize: 11, color: colors.grayText },
});
