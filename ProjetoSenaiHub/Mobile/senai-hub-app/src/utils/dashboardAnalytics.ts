import { colors } from '@/constants/colors';
import type { ChartDatum, TimeSeriesDatum } from '@/components/charts';

export function countByStatus<T extends { status?: string | null }>(
  items: T[],
  config: { label: string; status: string | string[]; color: string }[]
): ChartDatum[] {
  return config.map((entry) => {
    const statuses = Array.isArray(entry.status) ? entry.status : [entry.status];
    return {
      label: entry.label,
      value: items.filter((item) => item.status && statuses.includes(item.status)).length,
      color: entry.color,
    };
  });
}

export function buildDateTrend<T extends object>(
  items: T[],
  dateKeys: string[],
  options?: { limit?: number; labelPrefix?: string }
): TimeSeriesDatum[] {
  const limit = options?.limit ?? 6;
  const buckets = new Map<string, number>();

  items.forEach((item) => {
    const record = item as Record<string, unknown>;
    const rawDate = dateKeys.map((key) => record[key]).find((value): value is string => typeof value === 'string' && value.length > 0);
    const dateKey = normalizeDateKey(rawDate);
    if (!dateKey) return;
    buckets.set(dateKey, (buckets.get(dateKey) ?? 0) + 1);
  });

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-limit)
    .map(([date, value]) => ({
      label: `${options?.labelPrefix ?? ''}${formatShortDate(date)}`,
      value,
      color: colors.blue,
    }));
}

export function buildMonthTotals<T extends object>(
  items: T[],
  dateKeys: string[],
  valueSelector: (item: T) => number,
  options?: { limit?: number }
): ChartDatum[] {
  const limit = options?.limit ?? 5;
  const buckets = new Map<string, number>();

  items.forEach((item) => {
    const record = item as Record<string, unknown>;
    const rawDate = dateKeys.map((key) => record[key]).find((value): value is string => typeof value === 'string' && value.length > 0);
    const monthKey = normalizeMonthKey(rawDate);
    if (!monthKey) return;
    buckets.set(monthKey, (buckets.get(monthKey) ?? 0) + valueSelector(item));
  });

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-limit)
    .map(([month, value], index) => ({
      label: formatShortMonth(month),
      value: Math.round(value),
      color: chartColors[index % chartColors.length],
    }));
}

export function topGroups<T>(
  items: T[],
  keySelector: (item: T) => string | null | undefined,
  options?: { limit?: number; fallbackLabel?: string }
): ChartDatum[] {
  const limit = options?.limit ?? 5;
  const fallbackLabel = options?.fallbackLabel ?? 'Sem grupo';
  const buckets = new Map<string, number>();

  items.forEach((item) => {
    const key = keySelector(item) || fallbackLabel;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  });

  return Array.from(buckets.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([label, value], index) => ({
      label,
      value,
      color: chartColors[index % chartColors.length],
    }));
}

export function percent(part: number, total: number) {
  return total ? Math.round((part / total) * 100) : 0;
}

function normalizeDateKey(value?: string | null) {
  if (!value) return null;
  const normalized = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : null;
}

function normalizeMonthKey(value?: string | null) {
  if (!value) return null;
  const normalized = value.slice(0, 7);
  return /^\d{4}-\d{2}$/.test(normalized) ? normalized : normalizeDateKey(value)?.slice(0, 7) ?? null;
}

function formatShortDate(value: string) {
  const [, month, day] = value.split('-');
  return `${day}/${month}`;
}

function formatShortMonth(value: string) {
  const [, month] = value.split('-');
  return `M${month}`;
}

const chartColors = [colors.red, colors.blue, colors.green, colors.orange, colors.purple, colors.cyan];
