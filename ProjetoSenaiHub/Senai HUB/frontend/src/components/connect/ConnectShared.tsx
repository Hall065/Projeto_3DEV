import type { LucideIcon } from 'lucide-react'
import { ChevronLeft, ChevronRight, Minus, TrendingDown, TrendingUp } from 'lucide-react'

export const EMPTY = '-'

export interface KpiTrend {
  direction: 'up' | 'down' | 'neutral'
  value: string
  label: string
}

export function ConnectPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex w-full min-w-0 flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-hub-navy sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-hub-text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">{actions}</div>}
    </div>
  )
}

/** Envolve tabelas para scroll horizontal em telas pequenas */
export function ConnectTableScroll({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-w-0 overflow-x-auto">
      <div className="inline-block min-w-full align-middle">{children}</div>
    </div>
  )
}

/** Spinner duplo (mesmo visual dos Relatórios Rápidos) */
export function ConnectLoadingSpinner({
  label = 'Carregando dados...',
  className = '',
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      className={`flex min-h-[200px] w-full flex-col items-center justify-center gap-4 py-8 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative h-12 w-12 sm:h-14 sm:w-14">
        <div className="absolute inset-0 animate-chart-spin rounded-full border-[3px] border-hub-border/40 border-t-hub-red" />
        <div
          className="absolute inset-2 animate-chart-spin rounded-full border-2 border-transparent border-b-hub-navy/30"
          style={{ animationDirection: 'reverse', animationDuration: '1.2s' }}
        />
      </div>
      <p className="max-w-[220px] text-center text-xs font-medium text-hub-text-muted sm:text-sm">{label}</p>
    </div>
  )
}

export function ConnectCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-hub-border/60 bg-white shadow-sm ${className}`}>{children}</div>
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  const active = ['active', 'ativa', 'ativo', 'open', 'calculated', 'presente', 'inside'].some((s) => normalized.includes(s))
  const warning = ['justified', 'pending', 'inactive'].some((s) => normalized.includes(s))

  const classes = active
    ? 'bg-emerald-50 text-emerald-700'
    : warning
      ? 'bg-amber-50 text-amber-700'
      : 'bg-gray-100 text-gray-600'

  const labelMap: Record<string, string> = {
    active: 'Ativo',
    inactive: 'Inativo',
    calculated: 'Calculado',
    inside: 'Presente',
    outside: 'Ausente',
  }

  const label = labelMap[normalized] ?? status

  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}>{label}</span>
}

function TrendIndicator({ trend }: { trend: KpiTrend }) {
  const Icon = trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus
  const color =
    trend.direction === 'up' ? 'text-emerald-600' : trend.direction === 'down' ? 'text-red-600' : 'text-hub-text-muted'

  return (
    <p className={`mt-2 flex items-center gap-1 text-xs font-medium ${color}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>
        {trend.value} {trend.label}
      </span>
    </p>
  )
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  trend,
}: {
  icon: LucideIcon
  label: string
  value: string | number
  trend?: KpiTrend
}) {
  return (
    <ConnectCard className="p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-hub-bg text-hub-navy">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm text-hub-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-hub-navy">{value}</p>
      {trend && <TrendIndicator trend={trend} />}
    </ConnectCard>
  )
}

export function ConnectPagination({
  meta,
  onPageChange,
}: {
  meta?: { current_page: number; last_page: number; total: number; from: number | null; to: number | null }
  onPageChange: (page: number) => void
}) {
  if (!meta || meta.last_page <= 1) return null

  return (
    <div className="flex flex-col gap-3 border-t border-hub-border/60 px-4 py-3 text-sm text-hub-text-muted sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <p>
        Mostrando {meta.from ?? 0} a {meta.to ?? 0} de {meta.total} registros
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={meta.current_page <= 1}
          onClick={() => onPageChange(meta.current_page - 1)}
          className="rounded-lg border border-hub-border p-2 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {Array.from({ length: Math.min(meta.last_page, 5) }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`min-w-[36px] rounded-lg px-3 py-1.5 ${
              page === meta.current_page ? 'bg-hub-red text-white' : 'border border-hub-border hover:bg-hub-bg'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          disabled={meta.current_page >= meta.last_page}
          onClick={() => onPageChange(meta.current_page + 1)}
          className="rounded-lg border border-hub-border p-2 disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function FormField({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-hub-text">
        {label}
        {required && <span className="text-hub-red"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-hub-text-muted">{hint}</span>}
    </label>
  )
}

export const inputClass =
  'h-11 w-full rounded-xl border border-hub-border bg-white px-3 text-sm text-hub-text placeholder:text-hub-text-muted/70 outline-none transition focus:border-hub-red focus:ring-2 focus:ring-hub-red/15'

export const selectClass = inputClass

export function PrimaryButton({
  children,
  onClick,
  type = 'button',
  disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-hub-red px-5 text-sm font-semibold text-white transition hover:bg-hub-red-hover disabled:opacity-60"
    >
      {children}
    </button>
  )
}

export function OutlineButton({
  children,
  onClick,
  type = 'button',
  disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-hub-border bg-white px-5 text-sm font-medium text-hub-text transition hover:bg-hub-bg disabled:opacity-60"
    >
      {children}
    </button>
  )
}

export function SimpleDonut({
  present,
  justified,
  unjustified,
  rate,
}: {
  present: number
  justified: number
  unjustified: number
  rate: number
}) {
  const total = present + justified + unjustified || 1
  const p = (present / total) * 100
  const j = (justified / total) * 100

  if (total <= 1 && rate === 0) {
    return <p className="text-sm text-hub-text-muted">Sem registros de frequencia ainda.</p>
  }

  return (
    <div className="flex items-center gap-6">
      <div
        className="relative h-28 w-28 rounded-full"
        style={{
          background: `conic-gradient(#22c55e 0 ${p}%, #f59e0b ${p}% ${p + j}%, #ef4444 ${p + j}% 100%)`,
        }}
      >
        <div className="absolute inset-3 flex items-center justify-center rounded-full bg-white text-center">
          <span className="text-lg font-bold text-hub-navy">{rate}%</span>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-500" /> Presentes ({present}%)
        </li>
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-amber-500" /> Faltas justificadas ({justified}%)
        </li>
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500" /> Faltas injustificadas ({unjustified}%)
        </li>
      </ul>
    </div>
  )
}

export function SimpleBarChart({ items }: { items: { name: string; sessions: number }[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-hub-text-muted">Nenhuma aula registrada na semana.</p>
  }

  const max = Math.max(...items.map((i) => i.sessions), 1)

  return (
    <div className="flex h-40 items-end gap-3">
      {items.map((item) => (
        <div key={item.name} className="flex flex-1 flex-col items-center gap-2">
          <span className="text-[10px] font-semibold text-hub-navy">{item.sessions}</span>
          <div
            className="w-full rounded-t-lg bg-hub-red"
            style={{ height: `${(item.sessions / max) * 100}%`, minHeight: 8 }}
          />
          <span className="max-w-[72px] truncate text-center text-[10px] text-hub-text-muted" title={item.name}>
            {item.name.split(' ')[0]}
          </span>
        </div>
      ))}
    </div>
  )
}

export function formatDate(value?: string) {
  if (!value) return EMPTY
  return new Date(value).toLocaleDateString('pt-BR')
}

export function formatDateTime(value?: string) {
  if (!value) return EMPTY
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatShift(shift?: string) {
  if (!shift) return EMPTY
  const map: Record<string, string> = { manha: 'Manha', tarde: 'Tarde', noite: 'Noite' }
  return map[shift] ?? shift
}

