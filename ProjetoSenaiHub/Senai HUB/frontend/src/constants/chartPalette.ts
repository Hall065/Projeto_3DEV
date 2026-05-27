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

export const CHART_PALETTE_GRADIENTS: { from: string; to: string }[] = [
  { from: '#1A3A5C', to: '#4A6B8C' },
  { from: '#4A7BA7', to: '#7BAED4' },
  { from: '#D95757', to: '#F08A7A' },
  { from: '#8B74B5', to: '#B09CC8' },
  { from: '#3D9B78', to: '#5FC49A' },
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

export function chartColorByIndex(index: number): string {
  return CHART_PALETTE_5[index % CHART_PALETTE_5.length]
}

export function chartGradientByIndex(index: number): { from: string; to: string } {
  return CHART_PALETTE_GRADIENTS[index % CHART_PALETTE_GRADIENTS.length]
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

export function chartGradientForColor(color: string): { from: string; to: string } | undefined {
  const idx = CHART_PALETTE_5.indexOf(color as (typeof CHART_PALETTE_5)[number])
  if (idx >= 0) return CHART_PALETTE_GRADIENTS[idx]
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return { from: color, to: lightenHex(color) }
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

export function resolveChartGradient(color: string, index: number): { from: string; to: string } {
  return chartGradientForColor(color) ?? chartGradientByIndex(index)
}
