export type ChartPeriod = '7d' | '30d' | 'month' | 'semester' | 'year';

export interface ChartDatum {
  label: string;
  value: number;
  color?: string;
  meta?: string;
}

export interface TimeSeriesDatum {
  label: string;
  value: number;
  color?: string;
  meta?: string;
}
