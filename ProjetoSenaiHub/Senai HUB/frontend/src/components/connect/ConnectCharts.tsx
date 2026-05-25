import { useEffect, useMemo, useState } from 'react'
import { ConnectCard, ConnectLoadingSpinner } from './ConnectShared'

const CHART_COLORS = {
  present: '#22c55e',
  justified: '#f59e0b',
  unjustified: '#ef4444',
}

const COURSE_COLORS = ['#e30613', '#021a3a', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981']

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

function ChartReveal({ children, delayMs = 0 }: { children: React.ReactNode; delayMs?: number }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), delayMs)
    return () => window.clearTimeout(timer)
  }, [delayMs])

  return (
    <div
      className={`w-full min-w-0 transition-all duration-500 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
      }`}
    >
      {children}
    </div>
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
  const [animated, setAnimated] = useState(false)
  const size = 140
  const stroke = 16
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  const segments = useMemo(() => {
    const total = present + justified + unjustified || 1
    return [
      { key: 'present', value: (present / total) * 100, color: CHART_COLORS.present, label: 'Presentes' },
      { key: 'justified', value: (justified / total) * 100, color: CHART_COLORS.justified, label: 'Faltas justificadas' },
      { key: 'unjustified', value: (unjustified / total) * 100, color: CHART_COLORS.unjustified, label: 'Faltas injustificadas' },
    ]
  }, [present, justified, unjustified])

  useEffect(() => {
    if (loading) {
      setAnimated(false)
      return
    }
    const t = window.setTimeout(() => setAnimated(true), 100)
    return () => window.clearTimeout(t)
  }, [loading, present, justified, unjustified])

  if (loading) return <ConnectLoadingSpinner label="Calculando frequencia..." />

  if (rate === 0 && present + justified + unjustified <= 1) {
    return <p className="py-10 text-center text-sm text-hub-text-muted">Sem registros de frequencia ainda.</p>
  }

  let offset = 0
  const rings = segments.map((seg) => {
    const length = (seg.value / 100) * circumference
    const dasharray = `${animated ? length : 0} ${circumference - length}`
    const dashoffset = -offset
    offset += length
    return { ...seg, dasharray, dashoffset }
  })

  return (
    <ChartReveal delayMs={50}>
      <div className="flex w-full min-w-0 flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-center lg:gap-12">
        <div className="relative shrink-0">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
            {rings.map((ring) => (
              <circle
                key={ring.key}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={ring.color}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={ring.dasharray}
                strokeDashoffset={ring.dashoffset}
                className="transition-all duration-1000 ease-out"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-hub-navy">{rate}%</span>
            <span className="text-[11px] uppercase tracking-wider text-hub-text-muted">presenca</span>
          </div>
        </div>
        <ul className="w-full max-w-md space-y-3 sm:space-y-4">
          {segments.map((seg) => (
            <li
              key={seg.key}
              className="flex items-center justify-between gap-4 rounded-xl bg-white/80 px-4 py-3 shadow-sm ring-1 ring-hub-border/30"
            >
              <span className="flex min-w-0 items-center gap-3 text-sm text-hub-text-muted">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: seg.color }} />
                <span className="truncate">{seg.label}</span>
              </span>
              <span className="shrink-0 text-sm font-bold tabular-nums text-hub-navy">{seg.value.toFixed(1)}%</span>
            </li>
          ))}
        </ul>
      </div>
    </ChartReveal>
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
                  className="h-full rounded-full bg-gradient-to-r from-hub-red to-[#ff4d58] transition-all duration-700 ease-out"
                  style={{
                    width: animated ? `${Math.max(widthPct, 8)}%` : '0%',
                    transitionDelay: `${index * 60}ms`,
                  }}
                />
              </div>
            </li>
          )
        })}
      </ul>

      {/* Desktop: colunas com scroll se necessario */}
      <div className="hidden w-full min-w-0 md:block">
        <div className="-mx-1 overflow-x-auto pb-2">
          <div
            className="flex h-52 min-w-full items-end justify-center gap-4 px-2 sm:gap-6"
            style={{ minWidth: `${Math.max(items.length * 72, 280)}px` }}
          >
            {items.map((item, index) => {
              const heightPct = (item.sessions / max) * 100
              return (
                <div
                  key={item.name}
                  className="flex w-14 shrink-0 flex-col items-center gap-2 sm:w-16"
                  title={`${item.name}: ${item.sessions} aula(s)`}
                >
                  <span className="text-xs font-bold tabular-nums text-hub-navy">{item.sessions}</span>
                  <div className="flex h-36 w-full items-end justify-center">
                    <div
                      className="w-10 rounded-t-lg bg-gradient-to-t from-hub-red to-[#ff4d58] shadow-sm transition-all duration-700 ease-out sm:w-12"
                      style={{
                        height: animated ? `${Math.max(heightPct, 12)}%` : '0%',
                        transitionDelay: `${index * 70}ms`,
                      }}
                    />
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
          const color = COURSE_COLORS[index % COURSE_COLORS.length]

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
              <div className="h-3 overflow-hidden rounded-full bg-hub-bg sm:h-3.5">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: animated ? `${Math.max(widthPct, 4)}%` : '0%',
                    backgroundColor: color,
                    transitionDelay: `${index * 60}ms`,
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
        <ChartPanel title="Frequencia Geral" subtitle="Distribuicao do mes atual">
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
