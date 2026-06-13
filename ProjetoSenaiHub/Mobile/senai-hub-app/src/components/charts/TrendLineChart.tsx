import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/designTokens';
import { useThemeColors } from '@/hooks/useThemeColors';
import { notifySelection } from '@/utils/feedback';
import type { TimeSeriesDatum } from './types';

interface TrendLineChartProps {
  data: TimeSeriesDatum[];
  color?: string;
  formatValue?: (value: number) => string;
  tone?: 'light' | 'dark';
}

export function TrendLineChart({ data, color = colors.blue, formatValue = (value) => String(value), tone = 'light' }: TrendLineChartProps) {
  const theme = useThemeColors();
  const dark = tone === 'dark' || theme.isDark;
  const [selectedIndex, setSelectedIndex] = useState(Math.max(0, data.length - 1));
  const chart = useMemo(() => {
    const width = 320;
    const height = 154;
    const padding = 22;
    const max = Math.max(1, ...data.map((item) => item.value));
    const min = Math.min(0, ...data.map((item) => item.value));
    const range = Math.max(1, max - min);
    const points = data.map((item, index) => {
      const x = padding + (index * (width - padding * 2)) / Math.max(1, data.length - 1);
      const y = height - padding - ((item.value - min) / range) * (height - padding * 2);
      return { ...item, x, y };
    });

    return {
      width,
      height,
      points,
      value: points.map((point) => `${point.x},${point.y}`).join(' '),
    };
  }, [data]);

  if (!data.length) {
    return <Text style={[styles.empty, { color: theme.textMuted }]}>Nenhum dado para exibir.</Text>;
  }

  const selected = chart.points[selectedIndex] ?? chart.points[chart.points.length - 1];

  return (
    <View style={styles.wrap}>
      <Svg width="100%" height={chart.height} viewBox={`0 0 ${chart.width} ${chart.height}`}>
        <Line x1={22} x2={chart.width - 22} y1={chart.height - 22} y2={chart.height - 22} stroke={dark ? theme.line : colors.border} strokeWidth={1} />
        <Line x1={22} x2={22} y1={18} y2={chart.height - 22} stroke={dark ? theme.line : colors.border} strokeWidth={1} />
        <Polyline points={chart.value} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        {chart.points.map((point, index) => (
          <Circle
            key={`${point.label}-${index}`}
            cx={point.x}
            cy={point.y}
            r={index === selectedIndex ? 7 : 5}
            fill={index === selectedIndex ? color : theme.surface}
            stroke={color}
            strokeWidth={3}
            onPress={() => {
              setSelectedIndex(index);
              void notifySelection();
            }}
          />
        ))}
      </Svg>
      <View style={[styles.tooltip, { backgroundColor: theme.surfaceSoft, borderColor: theme.line }]}>
        <Text style={[styles.tooltipLabel, { color: theme.textMuted }]}>{selected.label}</Text>
        <Text style={[styles.tooltipValue, { color }]}>{formatValue(selected.value)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  tooltip: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  tooltipLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
  },
  tooltipValue: {
    fontSize: 13,
    fontWeight: '900',
  },
  empty: {
    fontSize: 12,
    fontWeight: '700',
  },
});
