import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/designTokens';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ChartDatum } from './types';

interface ChartLegendProps {
  data: ChartDatum[];
}

export function ChartLegend({ data }: ChartLegendProps) {
  const theme = useThemeColors();

  return (
    <View style={styles.legend}>
      {data.map((item) => (
        <View key={item.label} style={[styles.item, { borderColor: theme.line, backgroundColor: theme.surfaceSoft }]}>
          <View style={[styles.swatch, { backgroundColor: item.color ?? colors.red }]} />
          <Text numberOfLines={1} style={[styles.label, { color: theme.textMuted }]}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  item: {
    minHeight: 30,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  swatch: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  label: {
    maxWidth: 120,
    fontSize: 11,
    fontWeight: '800',
  },
});
