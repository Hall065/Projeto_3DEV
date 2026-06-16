import { useEffect, useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CHART_PALETTE_5,
  CHART_PALETTE_GRADIENTS,
  chartColorByIndex,
  resolveChartGradient,
  sanitizeChartSegmentKey,
} from '../../constants/chartPalette'
import { useAppearance } from '../../contexts/AppearanceContext'
import { ConnectCard, ConnectLoadingSpinner } from './ConnectShared'

/** Frequência — 3 tons da paleta harmônica de 5 */
const INFO_GRADIENTS = {
  present: CHART_PALETTE_GRADIENTS[2],
  justified: CHART_PALETTE_GRADIENTS[3],
  unjustified: CHART_PALETTE_GRADIENTS[1],
}

function ellipsePoint(cx: number, cy: number, rx: number, ry: number, t: number) {
  return {
    x: cx + rx * Math.cos(t),
    y: cy + ry * Math.sin(t),
  }
}

/** Fatia de coroa elíptica (donut “deitado” — leitura isométrica) */
function annulusSectorPath(
  cx: number,
  cy: number,
  rxo: number,
  ryo: number,
  rxi: number,
  ryi: number,
  a0: number,
  a1: number,
): string {
  const p0o = ellipsePoint(cx, cy, rxo, ryo, a0)
  const p1o = ellipsePoint(cx, cy, rxo, ryo, a1)
  const p1i = ellipsePoint(cx, cy, rxi, ryi, a1)
  const p0i = ellipsePoint(cx, cy, rxi, ryi, a0)
  const delta = a1 - a0
  const large = Math.abs(delta) > Math.PI ? 1 : 0
  return [
    `M ${p0o.x.toFixed(2)} ${p0o.y.toFixed(2)}`,
    `A ${rxo} ${ryo} 0 ${large} 1 ${p1o.x.toFixed(2)} ${p1o.y.toFixed(2)}`,
    `L ${p1i.x.toFixed(2)} ${p1i.y.toFixed(2)}`,
    `A ${rxi} ${ryi} 0 ${large} 0 ${p0i.x.toFixed(2)} ${p0i.y.toFixed(2)}`,
    'Z',
  ].join(' ')
}

const SEGMENT_COLORS = {
  present: CHART_PALETTE_5[2],
  justified: CHART_PALETTE_5[3],
  unjustified: CHART_PALETTE_5[1],
} as const

/** Geometria do donut (viewBox) — centralizado para callouts */
const DONUT = {
  viewW: 520,
  viewH: 240,
  cx: 260,
  cy: 108,
  rxo: 118,
  ryo: 46,
  rxi: 62,
  ryi: 24,
} as const

/** Pontos para callout: borda externa da fatia → cotovelo → rótulo */
function segmentCallout(
  cx: number,
  cy: number,
  rxo: number,
  ryo: number,
  midAngle: number,
  opts: { radial?: number; horizontal?: number; labelYOffset?: number } = {},
) {
  const radial = opts.radial ?? 28
  const horizontal = opts.horizontal ?? 54
  const labelYOffset = opts.labelYOffset ?? 0
  const anchor = ellipsePoint(cx, cy, rxo, ryo, midAngle)
  const nx = Math.cos(midAngle)
  const ny = Math.sin(midAngle)
  const elbow = {
    x: anchor.x + nx * radial,
    y: anchor.y + ny * radial * 0.82,
  }
  const toRight = nx >= 0
  const label = {
    x: elbow.x + (toRight ? horizontal : -horizontal),
    y: elbow.y + labelYOffset,
  }
  return { anchor, elbow, label, toRight }
}

function layoutDonutCallouts(
  arcList: { a0: number; a1: number }[],
  donut: typeof DONUT,
) {
  const { cx, cy, rxo, ryo, viewW, viewH } = donut
  const count = arcList.length
  const smallThreshold = Math.PI / 16

  const smallIndices = arcList
    .map((seg, i) => ((seg.a1 - seg.a0) < smallThreshold ? i : -1))
    .filter((i) => i >= 0)

  const raw = arcList.map((seg, i) => {
    const mid = (seg.a0 + seg.a1) / 2
    const span = seg.a1 - seg.a0
    const isSmall = span < smallThreshold
    const smallOrder = smallIndices.indexOf(i)

    const radial = isSmall
      ? 30 + smallOrder * 10
      : 22 + Math.min(18, span * 36) + (count > 4 ? (i % 3) * 4 : 0)
    const horizontal = isSmall
      ? 58 + smallOrder * 14
      : Math.max(40, Math.min(76, 36 + span * 90))

    let labelYOffset = 0
    if (isSmall && smallIndices.length > 1) {
      labelYOffset = (smallOrder - (smallIndices.length - 1) / 2) * 26
    } else if (count > 3) {
      labelYOffset = Math.sin(mid) * (i % 2 === 0 ? -10 : 10)
    }

    const callout = segmentCallout(cx, cy, rxo, ryo, mid, { radial, horizontal, labelYOffset })

    // Fatias pequenas vizinhas: alterna lado esquerdo/direito para abrir espaço.
    if (isSmall && smallOrder % 2 === 1) {
      const dx = callout.label.x - cx
      if (Math.abs(dx) > 1) {
        callout.label.x = cx - dx
        callout.elbow.x = cx - (callout.elbow.x - cx)
      }
    }

    return callout
  })

  return resolveCalloutOverlaps(raw, viewW, viewH)
}

/** Cards dos rótulos no SVG — largura suficiente para abreviações de status */
const CALLOUT_BOX = { w: 112, h: 38 } as const

function calloutLabelBox(labelX: number, labelY: number, viewW: number) {
  const { w, h } = CALLOUT_BOX
  let boxX = labelX - w / 2
  boxX = Math.max(10, Math.min(viewW - w - 10, boxX))
  const boxY = labelY - h / 2
  return { boxX, boxY, boxW: w, boxH: h, textX: boxX + w / 2 }
}

type CalloutLayout = ReturnType<typeof segmentCallout>

function boxesOverlap(
  a: { boxX: number; boxY: number; boxW: number; boxH: number },
  b: { boxX: number; boxY: number; boxW: number; boxH: number },
  gap: number,
): boolean {
  return (
    a.boxX < b.boxX + b.boxW + gap &&
    a.boxX + a.boxW + gap > b.boxX &&
    a.boxY < b.boxY + b.boxH + gap &&
    a.boxY + a.boxH + gap > b.boxY
  )
}

/** Evita cards de rótulo sobrepostos quando fatias pequenas ficam próximas no donut. */
function resolveCalloutOverlaps(
  callouts: CalloutLayout[],
  viewW: number,
  viewH: number,
  gap = 6,
): CalloutLayout[] {
  if (callouts.length <= 1) return callouts

  const adjusted = callouts.map((c) => ({
    ...c,
    anchor: { ...c.anchor },
    elbow: { ...c.elbow },
    label: { ...c.label },
  }))

  const rebox = () => adjusted.map((c) => calloutLabelBox(c.label.x, c.label.y, viewW))

  const clampToView = (boxes: ReturnType<typeof calloutLabelBox>[]) => {
    const pad = 4
    for (let i = 0; i < adjusted.length; i++) {
      const b = boxes[i]
      if (b.boxY < pad) {
        adjusted[i].label.y += pad - b.boxY
      } else if (b.boxY + b.boxH > viewH - pad) {
        adjusted[i].label.y -= b.boxY + b.boxH - (viewH - pad)
      }
    }
  }

  let boxes = rebox()

  for (let pass = 0; pass < 16; pass++) {
    let changed = false
    for (let i = 0; i < adjusted.length; i++) {
      for (let j = i + 1; j < adjusted.length; j++) {
        if (!boxesOverlap(boxes[i], boxes[j], gap)) continue

        const centerI = boxes[i].boxY + boxes[i].boxH / 2
        const centerJ = boxes[j].boxY + boxes[j].boxH / 2
        const push = boxes[i].boxH + gap

        if (centerJ >= centerI) {
          adjusted[j].label.y += push
        } else {
          adjusted[i].label.y -= push
        }

        changed = true
      }
    }

    boxes = rebox()
    clampToView(boxes)
    boxes = rebox()

    if (!changed) break
  }

  return adjusted
}

/** Ponto na borda do card voltado para o gráfico (a linha não fica sob o retângulo) */
function lineEndAtBoxEdge(
  toward: { x: number; y: number },
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
) {
  const cx = boxX + boxW / 2
  const cy = boxY + boxH / 2
  const dx = toward.x - cx
  const dy = toward.y - cy
  if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
    return { x: cx, y: cy }
  }
  const scale = Math.min(boxW / 2 / Math.abs(dx), boxH / 2 / Math.abs(dy))
  return { x: cx + dx * scale, y: cy + dy * scale }
}

function ChartPanel({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <section className="chart-panel flex min-w-0 w-full flex-col rounded-2xl border border-hub-border/50 p-4 sm:p-5">
      <header className="mb-4 shrink-0 border-b border-hub-border/30 pb-3">
        <h3 className="text-base font-semibold text-hub-navy sm:text-lg">{title}</h3>
        <p className="mt-0.5 text-xs text-hub-text-muted sm:text-sm">{subtitle}</p>
      </header>
      <div className="min-h-[180px] min-w-0 w-full flex-1">{children}</div>
    </section>
  )
}

const CHART_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const CHART_REVEAL_MS = 620

function ChartReveal({ children, delayMs = 0 }: { children: React.ReactNode; delayMs?: number }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), delayMs)
    return () => window.clearTimeout(timer)
  }, [delayMs])

  return (
    <div
      className={`isolate w-full min-w-0 transition-[opacity,transform] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
      style={{ transitionDuration: `${CHART_REVEAL_MS}ms` }}
    >
      {children}
    </div>
  )
}

function lightenColor(hex: string, factor = 1.28): string {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return hex
  const clamp = (n: number) => Math.min(255, Math.max(0, n))
  const r = clamp(Math.round(parseInt(clean.slice(0, 2), 16) * factor))
  const g = clamp(Math.round(parseInt(clean.slice(2, 4), 16) * factor))
  const b = clamp(Math.round(parseInt(clean.slice(4, 6), 16) * factor))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export function gradientFromColor(color: string): { from: string; to: string } {
  return { from: color, to: lightenColor(color) }
}

export type IsometricDonutSegmentInput = {
  key: string
  label: string
  short?: string
  pct: number
  color: string
  gradient?: { from: string; to: string }
  legendHint?: string
  count?: number
}

/** Donut isométrico com callouts — mesmo visual do dashboard Connect */
export function IsometricDistributionDonut({
  segments,
  centerValue,
  centerLabel,
  centerSubtitle,
  loading,
  loadingLabel,
  emptyMessage,
  ariaLabel,
}: {
  segments: IsometricDonutSegmentInput[]
  centerValue: React.ReactNode
  centerLabel: string
  centerSubtitle?: string
  loading?: boolean
  loadingLabel?: string
  emptyMessage?: string
  ariaLabel?: string
}) {
  const { t } = useTranslation()
  const resolvedLoadingLabel = loadingLabel ?? t('gridComponents.charts.loadingChart')
  const resolvedEmptyMessage = emptyMessage ?? t('gridComponents.charts.emptyData')
  const { wallpaperTone } = useAppearance()
  const isDark = wallpaperTone === 'dark'
  const gid = useId().replace(/:/g, '')
  const [animated, setAnimated] = useState(false)

  const visibleSegments = useMemo(
    () => segments.filter((seg) => seg.pct > 0.05),
    [segments],
  )

  const { arcs, callouts, showCallouts } = useMemo(() => {
    const segs = visibleSegments.map((seg, index) => {
      const color = seg.color?.trim() ? seg.color : chartColorByIndex(index)
      return {
        ...seg,
        short: seg.short ?? seg.label,
        color,
        gradientId: sanitizeChartSegmentKey(seg.key, index),
        gradient: seg.gradient ?? resolveChartGradient(color, index),
      }
    })
    let angle = -Math.PI / 2
    const arcList = segs.map((seg) => {
      const sweep = (seg.pct / 100) * 2 * Math.PI
      const a0 = angle
      const a1 = angle + sweep
      angle = a1
      return { ...seg, a0, a1, sweep }
    })
    const calloutList = layoutDonutCallouts(arcList, DONUT)
    return { arcs: arcList, callouts: calloutList, showCallouts: arcList.length > 0 && arcList.length <= 8 }
  }, [visibleSegments])

  useEffect(() => {
    if (loading) {
      setAnimated(false)
      return
    }
    const timer = window.setTimeout(() => setAnimated(true), 80)
    return () => window.clearTimeout(timer)
  }, [loading, visibleSegments])

  if (loading) return <ConnectLoadingSpinner label={resolvedLoadingLabel} />

  if (visibleSegments.length === 0) {
    return <p className="py-10 text-center text-sm text-hub-text-muted">{resolvedEmptyMessage}</p>
  }

  const { viewW, viewH, cx, cy, rxo, ryo, rxi, ryi } = DONUT
  const depthDy = 12
  const opacity = animated ? 1 : 0
  /** Legenda em linha única no mobile/tablet; mais colunas só em telas grandes */
  const legendCols = 'grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3'

  return (
    <ChartReveal delayMs={50}>
      <div className="surface-inset flex w-full min-w-0 flex-col gap-4 rounded-2xl border border-hub-border/50 p-3 shadow-sm sm:gap-5 sm:p-5">
        <div className="mx-auto w-full min-w-0 max-w-2xl">
          <div
            className="relative aspect-[520/240] w-full overflow-visible transition-opacity duration-700 motion-reduce:transition-none"
            style={{ opacity }}
          >
            <svg
              viewBox={`0 0 ${viewW} ${viewH}`}
              className="h-full w-full drop-shadow-[0_12px_28px_rgba(2,26,58,0.08)]"
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label={ariaLabel ?? t('gridComponents.charts.distributionAria', { label: centerLabel })}
            >
              <defs>
                <radialGradient id={`${gid}-floorGlow`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={arcs[0]?.color ?? '#e30613'} stopOpacity={isDark ? 0.2 : 0.12} />
                  <stop offset="70%" stopColor={isDark ? '#0f172a' : '#f8fafc'} stopOpacity={0} />
                </radialGradient>
                {arcs.map((a) => (
                  <linearGradient
                    key={`g-${a.gradientId}`}
                    id={`${gid}-grad-${a.gradientId}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor={a.gradient.from} />
                    <stop offset="100%" stopColor={a.gradient.to} />
                  </linearGradient>
                ))}
                {arcs.map((a) => (
                  <linearGradient
                    key={`gd-${a.gradientId}`}
                    id={`${gid}-dark-${a.gradientId}`}
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor={a.gradient.from} stopOpacity={isDark ? 0.45 : 0.55} />
                    <stop offset="100%" stopColor={isDark ? '#1e293b' : '#94a3b8'} stopOpacity={isDark ? 0.85 : 0.75} />
                  </linearGradient>
                ))}
              </defs>

              <ellipse cx={cx} cy={cy + 52} rx={140} ry={28} fill={`url(#${gid}-floorGlow)`} />

              <g opacity={0.92}>
                {arcs.map((a) => (
                  <path
                    key={`depth-${a.gradientId}`}
                    d={annulusSectorPath(cx, cy + depthDy, rxo, ryo, rxi, ryi, a.a0, a.a1)}
                    fill={`url(#${gid}-dark-${a.gradientId})`}
                  />
                ))}
              </g>

              {arcs.map((a) => (
                <path
                  key={`top-${a.gradientId}`}
                  d={annulusSectorPath(cx, cy, rxo, ryo, rxi, ryi, a.a0, a.a1)}
                  fill={`url(#${gid}-grad-${a.gradientId})`}
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth={0.75}
                />
              ))}

              {showCallouts &&
                arcs.map((a, i) => {
                  const c = callouts[i]
                  const color = a.color
                  const { boxX, boxY, boxW, boxH, textX } = calloutLabelBox(c.label.x, c.label.y, viewW)
                  const lineEnd = lineEndAtBoxEdge(c.anchor, boxX, boxY, boxW, boxH)
                  const pathD = `M ${c.anchor.x.toFixed(1)} ${c.anchor.y.toFixed(1)} L ${c.elbow.x.toFixed(1)} ${c.elbow.y.toFixed(1)} L ${lineEnd.x.toFixed(1)} ${lineEnd.y.toFixed(1)}`
                  const fade = {
                    opacity,
                    transition: 'opacity 0.6s ease',
                    transitionDelay: `${140 + i * 80}ms`,
                  }
                  return (
                    <g key={`callout-${a.key}`}>
                      <g style={fade}>
                        <path
                          d={pathD}
                          fill="none"
                          stroke={color}
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle cx={c.anchor.x} cy={c.anchor.y} r={3.5} fill={color} stroke="#fff" strokeWidth={1.5} />
                      </g>
                      <g style={{ ...fade, transitionDelay: `${180 + i * 80}ms` }}>
                        <rect
                          x={boxX}
                          y={boxY}
                          width={boxW}
                          height={boxH}
                          rx={7}
                          fill={isDark ? 'rgba(15, 23, 42, 0.94)' : '#ffffff'}
                          stroke={color}
                          strokeWidth={1.5}
                        />
                        <text
                          x={textX}
                          y={boxY + 15}
                          textAnchor="middle"
                          fill={color}
                          fontSize={13}
                          fontWeight={700}
                          className="tabular-nums"
                        >
                          {a.pct.toFixed(1)}%
                        </text>
                        <text
                          x={textX}
                          y={boxY + 29}
                          textAnchor="middle"
                          fill={isDark ? 'rgba(226, 232, 240, 0.82)' : '#475569'}
                          fontSize={10}
                          fontWeight={500}
                        >
                          {a.short}
                        </text>
                      </g>
                    </g>
                  )
                })}
            </svg>
          </div>

          <div
            className="-mt-1 border-t border-hub-border/40 pt-4 text-center transition-all duration-700 motion-reduce:transition-none sm:pt-5"
            style={{ opacity, transform: animated ? 'translateY(0)' : 'translateY(6px)' }}
          >
            <p className="text-3xl font-bold tabular-nums tracking-tight text-hub-navy sm:text-4xl 2xl:text-5xl">{centerValue}</p>
            <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-hub-text-muted">{centerLabel}</p>
            {centerSubtitle ? <p className="mt-0.5 text-xs text-hub-text-muted">{centerSubtitle}</p> : null}
          </div>
        </div>

        <div className={`grid grid-cols-1 gap-3 ${legendCols}`}>
          {arcs.map((a, i) => (
            <div
              key={`legend-${a.key}`}
              className="surface-inset overflow-hidden rounded-xl border border-hub-border/50 shadow-sm transition-all duration-500 motion-reduce:transition-none"
              style={{
                opacity,
                transform: animated ? 'translateY(0)' : 'translateY(8px)',
                transitionDelay: `${200 + i * 70}ms`,
              }}
            >
              <div
                className="px-3 py-2 text-[11px] font-bold leading-snug text-white sm:text-xs"
                style={{
                  background: `linear-gradient(135deg, ${a.gradient.from}, ${a.gradient.to})`,
                }}
              >
                <span className="line-clamp-2">{a.label}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2.5">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white/25"
                  style={{ backgroundColor: a.color }}
                  aria-hidden
                />
                <p className="min-w-0 text-sm font-semibold tabular-nums text-hub-navy">
                  {a.count != null ? `${a.count.toLocaleString('pt-BR')} · ` : ''}
                  {a.pct.toFixed(1)}%
                </p>
              </div>
              {a.legendHint ? (
                <p className="border-t border-hub-border/30 px-3 py-2 text-xs leading-relaxed text-hub-text-muted">
                  {a.legendHint}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </ChartReveal>
  )
}

export function AttendanceDonutChart({
  present,
  justified,
  unjustified,
  rate,
  totalRecords,
  loading,
}: {
  present: number
  justified: number
  unjustified: number
  rate: number
  totalRecords?: number
  loading?: boolean
}) {
  const { t } = useTranslation()
  const total = present + justified + unjustified
  const recordCount = Math.round(totalRecords ?? total)

  if (!loading && rate === 0 && recordCount <= 0) {
    return <p className="py-10 text-center text-sm text-hub-text-muted">{t('connectComponents.charts.noAttendanceRecords')}</p>
  }

  const tTotal = total || 1
  const segments: IsometricDonutSegmentInput[] = [
    {
      key: 'present',
      pct: (present / tTotal) * 100,
      label: t('connectComponents.charts.present'),
      short: t('connectComponents.charts.presentShort'),
      color: SEGMENT_COLORS.present,
      gradient: INFO_GRADIENTS.present,
      legendHint: t('connectComponents.charts.presentHint'),
    },
    {
      key: 'justified',
      pct: (justified / tTotal) * 100,
      label: t('connectComponents.charts.justified'),
      short: t('connectComponents.charts.justifiedShort'),
      color: SEGMENT_COLORS.justified,
      gradient: INFO_GRADIENTS.justified,
      legendHint: t('connectComponents.charts.justifiedHint'),
    },
    {
      key: 'unjustified',
      pct: (unjustified / tTotal) * 100,
      label: t('connectComponents.charts.unjustified'),
      short: t('connectComponents.charts.unjustifiedShort'),
      color: SEGMENT_COLORS.unjustified,
      gradient: INFO_GRADIENTS.unjustified,
      legendHint: t('connectComponents.charts.unjustifiedHint'),
    },
  ]

  return (
    <IsometricDistributionDonut
      segments={segments}
      centerValue={`${rate.toFixed(1)}%`}
      centerLabel={t('connectComponents.charts.generalPresence')}
      centerSubtitle={t('connectComponents.charts.recordsInPeriod', { count: recordCount })}
      loading={loading}
      loadingLabel={t('connectComponents.charts.calculatingAttendance')}
      ariaLabel={t('connectComponents.charts.attendanceDistributionAria', { rate })}
    />
  )
}

export function TeacherSessionsBarChart({
  items,
  loading,
}: {
  items: { name: string; sessions: number }[]
  loading?: boolean
}) {
  const { t } = useTranslation()
  const { wallpaperTone } = useAppearance()
  const isDark = wallpaperTone === 'dark'
  const [animated, setAnimated] = useState(false)
  const max = Math.max(...items.map((i) => i.sessions), 1)

  useEffect(() => {
    if (loading) {
      setAnimated(false)
      return
    }
    const timer = window.setTimeout(() => setAnimated(true), 150)
    return () => window.clearTimeout(timer)
  }, [loading, items])

  if (loading) return <ConnectLoadingSpinner label={t('connectComponents.charts.loadingWeeklySessions')} />

  if (items.length === 0) {
    return <p className="py-10 text-center text-sm text-hub-text-muted">{t('connect.shared.noWeeklyLessons')}</p>
  }

  return (
    <ChartReveal delayMs={100}>
      {/* Mobile / tablet: barras horizontais (legivel) */}
      <ul className="flex w-full min-w-0 flex-col gap-4 md:hidden">
        {items.map((item, index) => {
          const widthPct = (item.sessions / max) * 100
          return (
            <li key={item.name} className="min-w-0">
              <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                <span className="truncate font-medium text-hub-text" title={item.name}>
                  {item.name}
                </span>
                <span className="shrink-0 font-bold tabular-nums text-hub-red">{item.sessions}</span>
              </div>
              <div className="chart-bar-track h-3 overflow-hidden rounded-full">
                <div
                  className={`h-full origin-left rounded-full motion-reduce:transition-none ${isDark ? 'bg-gradient-to-r from-[#ff6b6b] to-[#ff8f96]' : 'bg-gradient-to-r from-hub-red to-[#ff4d58]'}`}
                  style={{
                    width: `${Math.max(widthPct, 8)}%`,
                    transform: animated ? 'scaleX(1)' : 'scaleX(0)',
                    transition: `transform 0.68s ${CHART_EASE}`,
                    transitionDelay: `${index * 55}ms`,
                  }}
                />
              </div>
            </li>
          )
        })}
      </ul>

      {/* Desktop: colunas com scroll se necessario */}
      <div className="hidden w-full min-w-0 md:block">
        <div className="scrollbar-minimal-x -mx-1 overflow-x-auto pb-2">
          <div
            className="flex h-52 min-w-full items-end justify-center gap-4 px-2 sm:gap-6"
            style={{ minWidth: `${Math.max(items.length * 72, 280)}px` }}
          >
            {items.map((item, index) => {
              const heightPct = Math.max((item.sessions / max) * 100, 12)
              return (
                <div
                  key={item.name}
                  className="flex w-14 shrink-0 flex-col items-center gap-2 sm:w-16"
                  title={t('connectComponents.charts.sessionsTooltip', { name: item.name, count: item.sessions })}
                >
                  <div className="relative flex h-36 w-full items-end justify-center">
                    <div
                      className="relative w-10 sm:w-12"
                      style={{ height: `${heightPct}%` }}
                    >
                      <span className="absolute -top-5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-xs font-bold tabular-nums text-hub-text">
                        {item.sessions}
                      </span>
                      <div
                        className="h-full w-full origin-bottom overflow-hidden rounded-t-lg motion-reduce:transition-none"
                        style={{
                          transform: animated ? 'scaleY(1)' : 'scaleY(0)',
                          transition: `transform 0.72s ${CHART_EASE}`,
                          transitionDelay: `${index * 60}ms`,
                        }}
                      >
                        <div
                          className={`h-full w-full shadow-sm ${isDark ? 'bg-gradient-to-t from-[#ff6b6b] to-[#ff9aa0]' : 'bg-gradient-to-t from-hub-red to-[#ff4d58]'}`}
                        />
                      </div>
                    </div>
                  </div>
                  <span className="line-clamp-2 w-full text-center text-[11px] font-medium leading-tight text-hub-text">
                    {item.name.split(' ')[0]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </ChartReveal>
  )
}

export function StudentsByCourseChart({
  items,
  loading,
}: {
  items: { name: string; count: number }[]
  loading?: boolean
}) {
  const { t } = useTranslation()
  const { wallpaperTone } = useAppearance()
  const isDark = wallpaperTone === 'dark'
  const [animated, setAnimated] = useState(false)
  const max = Math.max(...items.map((i) => i.count), 1)

  useEffect(() => {
    if (loading) {
      setAnimated(false)
      return
    }
    const timer = window.setTimeout(() => setAnimated(true), 200)
    return () => window.clearTimeout(timer)
  }, [loading, items])

  if (loading) return <ConnectLoadingSpinner label={t('connectComponents.charts.distributingStudents')} />

  if (items.length === 0) {
    return <p className="py-10 text-center text-sm text-hub-text-muted">{t('connectComponents.charts.noStudentsInCourses')}</p>
  }

  return (
    <ChartReveal delayMs={150}>
      <ul className="flex w-full min-w-0 flex-col gap-3 sm:gap-3.5">
        {items.map((course, index) => {
          const widthPct = (course.count / max) * 100
          const color = chartColorByIndex(index, isDark)

          return (
            <li key={course.name} className="min-w-0">
              <div className="mb-2 flex items-start justify-between gap-3">
                <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-hub-text" title={course.name}>
                  {course.name}
                </span>
                <span className="chart-stat-badge shrink-0 rounded-lg px-2.5 py-1 text-sm font-bold tabular-nums">
                  {course.count}
                </span>
              </div>
              <div className="chart-bar-track relative h-3 overflow-hidden rounded-full sm:h-3.5">
                <div
                  className="absolute inset-y-0 left-0 origin-left rounded-full motion-reduce:transition-none"
                  style={{
                    width: `${Math.max(widthPct, 4)}%`,
                    backgroundColor: color,
                    transform: animated ? 'scaleX(1)' : 'scaleX(0)',
                    transition: `transform 0.68s ${CHART_EASE}`,
                    transitionDelay: `${index * 55}ms`,
                  }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </ChartReveal>
  )
}

export function QuickReportsSection({
  loading,
  attendance,
  teachers,
  courses,
}: {
  loading: boolean
  attendance: { present: number; justified: number; unjustified: number; rate: number; total_records?: number }
  teachers: { name: string; sessions: number }[]
  courses: { name: string; count: number }[]
}) {
  const { t } = useTranslation()
  return (
    <ConnectCard className="min-w-0 p-4 sm:p-6 lg:col-span-2 lg:p-8">
      <h2 className="mb-6 text-lg font-semibold text-hub-navy sm:mb-8 sm:text-xl">
        {t('connectComponents.charts.quickReports')}
      </h2>
      <div className="flex w-full min-w-0 flex-col gap-6 sm:gap-8">
        <ChartPanel
          title={t('connectComponents.charts.attendanceTitle')}
          subtitle={t('connectComponents.charts.attendanceSubtitle')}
        >
          <AttendanceDonutChart {...attendance} totalRecords={attendance.total_records} loading={loading} />
        </ChartPanel>
        <ChartPanel
          title={t('connectComponents.charts.teacherSessionsTitle')}
          subtitle={t('connectComponents.charts.teacherSessionsSubtitle')}
        >
          <TeacherSessionsBarChart items={teachers} loading={loading} />
        </ChartPanel>
        <ChartPanel
          title={t('connectComponents.charts.studentsByCourseTitle')}
          subtitle={t('connectComponents.charts.studentsByCourseSubtitle')}
        >
          <StudentsByCourseChart items={courses} loading={loading} />
        </ChartPanel>
      </div>
    </ConnectCard>
  )
}
