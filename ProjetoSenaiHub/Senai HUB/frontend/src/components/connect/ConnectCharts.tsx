import { useEffect, useId, useMemo, useState } from 'react'
import {
  CHART_PALETTE_5,
  CHART_PALETTE_GRADIENTS,
  chartColorByIndex,
  resolveChartGradient,
  sanitizeChartSegmentKey,
} from '../../constants/chartPalette'
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
  const { cx, cy, rxo, ryo } = donut
  const count = arcList.length

  return arcList.map((seg, i) => {
    const mid = (seg.a0 + seg.a1) / 2
    const span = seg.a1 - seg.a0
    const radial = 22 + Math.min(18, span * 36) + (count > 4 ? (i % 3) * 4 : 0)
    const horizontal = Math.max(40, Math.min(76, 36 + span * 90))
    const labelYOffset = count > 3 ? Math.sin(mid) * (i % 2 === 0 ? -10 : 10) : 0
    return segmentCallout(cx, cy, rxo, ryo, mid, { radial, horizontal, labelYOffset })
  })
}

/** Cards dos rótulos: mais estreitos; altura/fonte preservam leitura */
const CALLOUT_BOX = { w: 100, h: 38 } as const

function calloutLabelBox(labelX: number, labelY: number, viewW: number) {
  const { w, h } = CALLOUT_BOX
  let boxX = labelX - w / 2
  boxX = Math.max(10, Math.min(viewW - w - 10, boxX))
  const boxY = labelY - h / 2
  return { boxX, boxY, boxW: w, boxH: h, textX: boxX + w / 2 }
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
    <section className="flex min-w-0 w-full flex-col rounded-2xl border border-hub-border/50 bg-gradient-to-b from-white to-hub-bg/40 p-5 sm:p-6">
      <header className="mb-5 shrink-0 border-b border-hub-border/40 pb-4">
        <h3 className="text-base font-semibold text-hub-navy sm:text-lg">{title}</h3>
        <p className="mt-1 text-xs text-hub-text-muted sm:text-sm">{subtitle}</p>
      </header>
      <div className="min-h-[200px] min-w-0 w-full flex-1">{children}</div>
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
  loadingLabel = 'Carregando gráfico...',
  emptyMessage = 'Sem dados para exibir.',
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

  if (loading) return <ConnectLoadingSpinner label={loadingLabel} />

  if (visibleSegments.length === 0) {
    return <p className="py-10 text-center text-sm text-hub-text-muted">{emptyMessage}</p>
  }

  const { viewW, viewH, cx, cy, rxo, ryo, rxi, ryi } = DONUT
  const depthDy = 12
  const opacity = animated ? 1 : 0
  /** Legenda em linha única no mobile/tablet; mais colunas só em telas grandes */
  const legendCols = 'grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3'

  return (
    <ChartReveal delayMs={50}>
      <div className="flex w-full min-w-0 flex-col gap-4 rounded-2xl border border-hub-border/50 bg-white p-3 shadow-sm sm:gap-5 sm:p-5">
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
              aria-label={ariaLabel ?? `Distribuição: ${centerLabel}`}
            >
              <defs>
                <radialGradient id={`${gid}-floorGlow`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={arcs[0]?.color ?? '#e30613'} stopOpacity={0.12} />
                  <stop offset="70%" stopColor="#f8fafc" stopOpacity={0} />
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
                    <stop offset="0%" stopColor={a.gradient.from} stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.75} />
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
                          fill="#ffffff"
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
                          fill="#475569"
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
              className="overflow-hidden rounded-xl border border-hub-border/50 bg-white shadow-sm transition-all duration-500 motion-reduce:transition-none"
              style={{
                opacity,
                transform: animated ? 'translateY(0)' : 'translateY(8px)',
                transitionDelay: `${200 + i * 70}ms`,
              }}
            >
              <div
                className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-white sm:text-xs"
                style={{
                  background: `linear-gradient(135deg, ${a.gradient.from}, ${a.gradient.to})`,
                }}
              >
                {a.short}
              </div>
              <div className="space-y-1 px-3 py-2.5 text-xs leading-relaxed text-hub-text-muted">
                {a.legendHint ? <p>{a.legendHint}</p> : null}
                <p className="text-sm font-semibold tabular-nums text-hub-navy">
                  {a.count != null ? `${a.count.toLocaleString('pt-BR')} · ` : ''}
                  {a.pct.toFixed(1)}%
                </p>
              </div>
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
  loading,
}: {
  present: number
  justified: number
  unjustified: number
  rate: number
  loading?: boolean
}) {
  const total = present + justified + unjustified

  if (!loading && rate === 0 && total <= 1) {
    return <p className="py-10 text-center text-sm text-hub-text-muted">Sem registros de frequencia ainda.</p>
  }

  const t = total || 1
  const segments: IsometricDonutSegmentInput[] = [
    {
      key: 'present',
      pct: (present / t) * 100,
      label: 'Presentes',
      short: 'Presentes',
      color: SEGMENT_COLORS.present,
      gradient: INFO_GRADIENTS.present,
      legendHint: 'Alunos com registro de presença no período.',
    },
    {
      key: 'justified',
      pct: (justified / t) * 100,
      label: 'Faltas justificadas',
      short: 'Faltas justif.',
      color: SEGMENT_COLORS.justified,
      gradient: INFO_GRADIENTS.justified,
      legendHint: 'Ausências com justificativa aceita.',
    },
    {
      key: 'unjustified',
      pct: (unjustified / t) * 100,
      label: 'Faltas injustificadas',
      short: 'Faltas injustif.',
      color: SEGMENT_COLORS.unjustified,
      gradient: INFO_GRADIENTS.unjustified,
      legendHint: 'Ausências sem justificativa ou pendentes.',
    },
  ]

  return (
    <IsometricDistributionDonut
      segments={segments}
      centerValue={`${rate.toFixed(1)}%`}
      centerLabel="Presença geral"
      centerSubtitle={`${t.toLocaleString('pt-BR')} registros no período`}
      loading={loading}
      loadingLabel="Calculando frequencia..."
      ariaLabel={`Distribuição de frequência: ${rate}% de presença`}
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
  const [animated, setAnimated] = useState(false)
  const max = Math.max(...items.map((i) => i.sessions), 1)

  useEffect(() => {
    if (loading) {
      setAnimated(false)
      return
    }
    const t = window.setTimeout(() => setAnimated(true), 150)
    return () => window.clearTimeout(t)
  }, [loading, items])

  if (loading) return <ConnectLoadingSpinner label="Buscando aulas da semana..." />

  if (items.length === 0) {
    return <p className="py-10 text-center text-sm text-hub-text-muted">Nenhuma aula registrada na semana.</p>
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
              <div className="h-3 overflow-hidden rounded-full bg-hub-bg">
                <div
                  className="h-full origin-left rounded-full bg-gradient-to-r from-hub-red to-[#ff4d58] motion-reduce:transition-none"
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
                  title={`${item.name}: ${item.sessions} aula(s)`}
                >
                  <div className="relative flex h-36 w-full items-end justify-center">
                    <div
                      className="relative w-10 sm:w-12"
                      style={{ height: `${heightPct}%` }}
                    >
                      <span className="absolute -top-5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-xs font-bold tabular-nums text-hub-navy">
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
                        <div className="h-full w-full bg-gradient-to-t from-hub-red to-[#ff4d58] shadow-sm" />
                      </div>
                    </div>
                  </div>
                  <span className="line-clamp-2 w-full text-center text-[11px] leading-tight text-hub-text-muted">
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
  const [animated, setAnimated] = useState(false)
  const max = Math.max(...items.map((i) => i.count), 1)

  useEffect(() => {
    if (loading) {
      setAnimated(false)
      return
    }
    const t = window.setTimeout(() => setAnimated(true), 200)
    return () => window.clearTimeout(t)
  }, [loading, items])

  if (loading) return <ConnectLoadingSpinner label="Distribuindo alunos..." />

  if (items.length === 0) {
    return <p className="py-10 text-center text-sm text-hub-text-muted">Nenhum aluno vinculado a cursos.</p>
  }

  return (
    <ChartReveal delayMs={150}>
      <ul className="flex w-full min-w-0 flex-col gap-4 sm:gap-5">
        {items.map((course, index) => {
          const widthPct = (course.count / max) * 100
          const color = chartColorByIndex(index)

          return (
            <li key={course.name} className="min-w-0">
              <div className="mb-2 flex items-start justify-between gap-3">
                <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-hub-text" title={course.name}>
                  {course.name}
                </span>
                <span className="shrink-0 rounded-lg bg-hub-bg px-2.5 py-1 text-sm font-bold tabular-nums text-hub-navy">
                  {course.count}
                </span>
              </div>
              <div className="relative h-3 overflow-hidden rounded-full bg-hub-bg sm:h-3.5">
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
  attendance: { present: number; justified: number; unjustified: number; rate: number }
  teachers: { name: string; sessions: number }[]
  courses: { name: string; count: number }[]
}) {
  return (
    <ConnectCard className="min-w-0 p-4 sm:p-6 lg:col-span-2 lg:p-8">
      <h2 className="mb-6 text-lg font-semibold text-hub-navy sm:mb-8 sm:text-xl">Relatorios Rapidos</h2>
      <div className="flex w-full min-w-0 flex-col gap-6 sm:gap-8">
        <ChartPanel title="Frequencia Geral" subtitle="Mes atual — presenca, faltas justificadas e injustificadas">
          <AttendanceDonutChart {...attendance} loading={loading} />
        </ChartPanel>
        <ChartPanel title="Aulas na semana" subtitle="Por professor (ultimos 7 dias)">
          <TeacherSessionsBarChart items={teachers} loading={loading} />
        </ChartPanel>
        <ChartPanel title="Alunos por curso" subtitle="Matriculas ativas por curso">
          <StudentsByCourseChart items={courses} loading={loading} />
        </ChartPanel>
      </div>
    </ConnectCard>
  )
}
