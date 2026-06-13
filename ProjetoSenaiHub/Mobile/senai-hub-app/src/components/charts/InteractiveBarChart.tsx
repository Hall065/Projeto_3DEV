import { useMemo, useState } from 'react';
import type { DimensionValue } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/designTokens';
import { useThemeColors } from '@/hooks/useThemeColors';
import { notifySelection } from '@/utils/feedback';
import type { ChartDatum } from './types';

interface InteractiveBarChartProps {
  data: ChartDatum[];
  formatValue?: (value: number) => string;
  tone?: 'light' | 'dark';
}

export function InteractiveBarChart({ data, formatValue = (value) => String(value), tone = 'light' }: InteractiveBarChartProps) {
  const theme = useThemeColors();
  const dark = tone === 'dark' || theme.isDark;
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const maxValue = useMemo(() => Math.max(1, ...data.map((item) => item.value)), [data]);
  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);
  const selected = data.find((item) => item.label === selectedLabel) ?? data[0];

  return (
    <View accessibilityRole="text" style={styles.wrap}>
      <View style={styles.rows}>
        {data.map((item) => {
          const isSelected = selected?.label === item.label;
          const width = `${Math.max(4, Math.round((item.value / maxValue) * 100))}%` as DimensionValue;
          const percent = total ? Math.round((item.value / total) * 100) : 0;

          return (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              accessibilityLabel={`${item.label}: ${formatValue(item.value)}, ${percent}%`}
              onPress={() => {
                setSelectedLabel(item.label);
                void notifySelection();
              }}
              style={({ pressed }) => [
                styles.row,
                {
                  borderColor: isSelected ? item.color ?? colors.red : theme.line,
                  backgroundColor: dark ? theme.surfaceSoft : colors.white,
                  opacity: pressed ? 0.82 : 1,
                },
              ]}
            >
              <View style={styles.rowHeader}>
                <Text numberOfLines={1} style={[styles.label, { color: theme.text }]}>
                  {item.label}
                </Text>
                <Text style={[styles.value, { color: item.color ?? colors.red }]}>{formatValue(item.value)}</Text>
              </View>
              <View style={[styles.track, { backgroundColor: dark ? theme.surface : colors.panelSoft }]}>
                <View style={[styles.fill, { width, backgroundColor: item.color ?? colors.red }]} />
              </View>
              {isSelected ? (
                <Text style={[styles.meta, { color: theme.textMuted }]}>
                  {item.meta ?? `${percent}% do total analisado`}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  rows: {
    gap: spacing.sm,
  },
  row: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 74,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  label: {
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
  },
  value: {
    fontSize: 12,
    fontWeight: '900',
  },
  track: {
    height: 9,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  meta: {
    marginTop: spacing.sm,
    fontSize: 11,
    fontWeight: '700',
  },
});
