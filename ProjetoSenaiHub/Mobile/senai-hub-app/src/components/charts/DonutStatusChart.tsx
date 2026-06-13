import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/designTokens';
import { useThemeColors } from '@/hooks/useThemeColors';
import { notifySelection } from '@/utils/feedback';
import { ChartLegend } from './ChartLegend';
import type { ChartDatum } from './types';

interface DonutStatusChartProps {
  data: ChartDatum[];
  size?: number;
  formatValue?: (value: number) => string;
  tone?: 'light' | 'dark';
}

export function DonutStatusChart({ data, size = 176, formatValue = (value) => String(value), tone = 'light' }: DonutStatusChartProps) {
  const theme = useThemeColors();
  const dark = tone === 'dark' || theme.isDark;
  const visibleData = data.filter((item) => item.value > 0);
  const total = useMemo(() => visibleData.reduce((sum, item) => sum + item.value, 0), [visibleData]);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const selected = visibleData.find((item) => item.label === selectedLabel) ?? visibleData[0];
  const strokeWidth = 18;
  const center = size / 2;
  const radiusValue = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusValue;
  let consumed = 0;

  if (!visibleData.length) {
    return <Text style={[styles.empty, { color: theme.textMuted }]}>Nenhum dado para exibir.</Text>;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.donutArea}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle
            cx={center}
            cy={center}
            r={radiusValue}
            stroke={dark ? theme.surfaceSoft : colors.panelSoft}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {visibleData.map((item) => {
            const segment = total ? (item.value / total) * circumference : 0;
            const dashOffset = -consumed;
            consumed += segment;

            return (
              <Circle
                key={item.label}
                cx={center}
                cy={center}
                r={radiusValue}
                stroke={item.color ?? colors.red}
                strokeWidth={selected?.label === item.label ? strokeWidth + 2 : strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${segment} ${circumference}`}
                strokeDashoffset={dashOffset}
                transform={`rotate(-90 ${center} ${center})`}
                onPress={() => {
                  setSelectedLabel(item.label);
                  void notifySelection();
                }}
              />
            );
          })}
        </Svg>
        <View pointerEvents="none" style={styles.centerText}>
          <Text style={[styles.centerValue, { color: theme.text }]}>{formatValue(selected?.value ?? total)}</Text>
          <Text numberOfLines={2} style={[styles.centerLabel, { color: theme.textMuted }]}>
            {selected?.label ?? 'Total'}
          </Text>
        </View>
      </View>

      <View style={styles.selectedBox}>
        {visibleData.map((item) => {
          const active = selected?.label === item.label;
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
              style={[
                styles.statusRow,
                {
                  borderColor: active ? item.color ?? colors.red : theme.line,
                  backgroundColor: active ? (dark ? theme.surfaceSoft : colors.panelSoft) : 'transparent',
                },
              ]}
            >
              <View style={[styles.dot, { backgroundColor: item.color ?? colors.red }]} />
              <Text numberOfLines={1} style={[styles.statusLabel, { color: theme.text }]}>
                {item.label}
              </Text>
              <Text style={[styles.statusValue, { color: item.color ?? colors.red }]}>{percent}%</Text>
            </Pressable>
          );
        })}
      </View>
      <ChartLegend data={visibleData} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  donutArea: {
    width: 176,
    height: 176,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 96,
  },
  centerValue: {
    fontSize: 23,
    fontWeight: '900',
  },
  centerLabel: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  selectedBox: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  statusRow: {
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: radius.pill,
  },
  statusLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
  },
  statusValue: {
    fontSize: 12,
    fontWeight: '900',
  },
  empty: {
    fontSize: 12,
    fontWeight: '700',
  },
});
