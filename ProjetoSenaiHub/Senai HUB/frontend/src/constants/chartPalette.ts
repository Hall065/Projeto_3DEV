/**
 * Paleta harmônica de 5 cores para gráficos (Grid e barras compartilhadas).
 * Tons derivados do navy SENAI + acentos suaves em análogo/complementar.
 */
export const CHART_PALETTE_5 = [
  '#1A3A5C', // navy profundo
  '#4A7BA7', // azul médio
  '#D95757', // coral (acento SENAI suavizado)
  '#8B74B5', // lavanda
  '#3D9B78', // verde sálvia
] as const

/** Mesma ordem da paleta clara — tons mais claros para fundos escuros */
export const CHART_PALETTE_5_DARK = [
  '#6BA3E0',
  '#8EC5F0',
  '#FF8A7A',
  '#C4ABE0',
  '#6FD4A8',
] as const

export const CHART_PALETTE_GRADIENTS: { from: string; to: string }[] = [
  { from: '#1A3A5C', to: '#4A6B8C' },
  { from: '#4A7BA7', to: '#7BAED4' },
  { from: '#D95757', to: '#F08A7A' },
  { from: '#8B74B5', to: '#B09CC8' },
  { from: '#3D9B78', to: '#5FC49A' },
]

export const CHART_PALETTE_GRADIENTS_DARK: { from: string; to: string }[] = [
  { from: '#6BA3E0', to: '#9BC4EF' },
  { from: '#8EC5F0', to: '#B8D9F5' },
  { from: '#FF8A7A', to: '#FFB0A6' },
  { from: '#C4ABE0', to: '#DBC9EE' },
  { from: '#6FD4A8', to: '#9BE6C4' },
]

/** Status dos chamados */
export const GRID_STATUS_COLORS: Record<string, string> = {
  aberto: CHART_PALETTE_5[0],
  pendente: CHART_PALETTE_5[1],
  em_atendimento: CHART_PALETTE_5[2],
  aguardando_aprovacao: '#E8A838',
  avaliacao_pendente: CHART_PALETTE_5[3],
  concluido: CHART_PALETTE_5[4],
}

/** Prioridade (3 níveis — subconjunto da paleta) */
export const GRID_PRIORITY_COLORS: Record<string, string> = {
  alta: CHART_PALETTE_5[2],
  media: CHART_PALETTE_5[3],
  baixa: CHART_PALETTE_5[4],
}

/** Cores semânticas extras (fora da paleta de 5) */
const GRID_EXTRA_LIGHT_COLORS: Record<string, string> = {
  '#e8a838': '#F5C15A',
}

const GRID_EXTRA_GRADIENTS: Record<string, { light: { from: string; to: string }; dark: { from: string; to: string } }> = {
  '#e8a838': {
    light: { from: '#E8A838', to: '#F0BC5C' },
    dark: { from: '#F5C15A', to: '#FFD98A' },
  },
}

function normalizeHex(hex: string): string {
  return hex.trim().toLowerCase()
}

/** Cor de exibição no tema atual — preserva significado semântico (status/prioridade). */
export function chartColorForTheme(color: string | undefined, index: number, dark = false): string {
  const light = color?.trim() ? color : chartColorByIndex(index, false)
  if (!dark) return light

  const key = normalizeHex(light)
  const paletteIdx = CHART_PALETTE_5.findIndex((c) => normalizeHex(c) === key)
  if (paletteIdx >= 0) return CHART_PALETTE_5_DARK[paletteIdx]

  return GRID_EXTRA_LIGHT_COLORS[key] ?? chartColorByIndex(index, true)
}

export function chartColorByIndex(index: number, dark = false): string {
  const palette = dark ? CHART_PALETTE_5_DARK : CHART_PALETTE_5
  return palette[index % palette.length]
}

export function chartGradientByIndex(index: number, dark = false): { from: string; to: string } {
  const gradients = dark ? CHART_PALETTE_GRADIENTS_DARK : CHART_PALETTE_GRADIENTS
  return gradients[index % gradients.length]
}

function lightenHex(hex: string, factor = 1.28): string {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return hex
  const clamp = (n: number) => Math.min(255, Math.max(0, n))
  const r = clamp(Math.round(parseInt(clean.slice(0, 2), 16) * factor))
  const g = clamp(Math.round(parseInt(clean.slice(2, 4), 16) * factor))
  const b = clamp(Math.round(parseInt(clean.slice(4, 6), 16) * factor))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export function chartGradientForColor(color: string, dark = false): { from: string; to: string } | undefined {
  const key = normalizeHex(color)
  const extra = GRID_EXTRA_GRADIENTS[key]
  if (extra) return dark ? extra.dark : extra.light

  const idx = CHART_PALETTE_5.findIndex((c) => normalizeHex(c) === key)
  if (idx >= 0) return chartGradientByIndex(idx, dark)

  if (/^#[0-9a-f]{6}$/.test(key)) {
    const darkIdx = CHART_PALETTE_5_DARK.findIndex((c) => normalizeHex(c) === key)
    if (darkIdx >= 0) return chartGradientByIndex(darkIdx, true)
    return { from: color, to: lightenHex(color, dark ? 1.15 : 1.28) }
  }
  return undefined
}

/** Chave segura para ids de gradiente SVG (sem espaços/acentos). */
export function sanitizeChartSegmentKey(raw: string, index: number): string {
  const slug = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return slug ? `${slug}-${index}` : `seg-${index}`
}

export function resolveChartGradient(color: string, index: number, dark = false): { from: string; to: string } {
  return chartGradientForColor(color, dark) ?? chartGradientByIndex(index, dark)
}
