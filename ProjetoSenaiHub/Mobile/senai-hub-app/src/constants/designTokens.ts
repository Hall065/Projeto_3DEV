import { colors } from './colors';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  pill: 999,
} as const;

export const fontSize = {
  caption: 10,
  small: 11,
  body: 13,
  bodyLarge: 15,
  title: 18,
  metric: 24,
} as const;

export const chartPalette = [
  colors.red,
  colors.blue,
  colors.green,
  colors.orange,
  colors.purple,
  colors.cyan,
] as const;

export const motion = {
  fast: 140,
  base: 220,
  slow: 320,
} as const;

export const touchTarget = {
  min: 44,
} as const;
