import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ConnectKpiSparkline } from './ConnectKpiSparkline'

export type KpiCardVariant = 'blue' | 'coral' | 'green' | 'violet' | 'senai' | 'amber'

const VARIANT_STYLES: Record<KpiCardVariant, string> = {
  /** Azul céu → índigo / roxo (cartão estilo dashboard) */
  blue: 'bg-gradient-to-br from-[#38bdf8] via-[#6366f1] to-[#4c1d95]',
  coral: 'bg-gradient-to-br from-[#ff5f7a] via-[#ff6b4a] to-[#ff9a44]',
  /** Lima → verde / teal */
  green: 'bg-gradient-to-br from-[#bef264] via-[#22c55e] to-[#0f766e]',
  violet: 'bg-gradient-to-br from-[#c026d3] via-[#e879f9] to-[#fb7185]',
  senai: 'bg-gradient-to-br from-[#021a3a] via-[#021a3a] to-[#e30613]',
  amber: 'bg-gradient-to-br from-[#f7b733] via-[#fc4a1a] to-[#e30613]',
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  variant = 'blue',
  sparkline = [],
  to,
}: {
  icon: LucideIcon
  label: string
  value: string | number
  variant?: KpiCardVariant
  /** Série semanal (últimas 8 semanas) vinda da API */
  sparkline?: number[]
  /** Rota ao clicar no ícone */
  to?: string
}) {
  return (
    <article
      className={`relative flex min-h-[148px] flex-col overflow-hidden rounded-xl p-4 shadow-lg ring-1 ring-black/10 sm:min-h-[152px] sm:p-5 ${VARIANT_STYLES[variant]}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,rgba(255,255,255,0.18),transparent_55%)]" />
      <div className="relative z-[1] flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]">{value}</p>
          <p className="mt-0.5 line-clamp-2 text-xs font-medium leading-snug text-white/85 sm:text-sm">{label}</p>
        </div>
        {to ? (
          <Link
            to={to}
            aria-label={`Ir para ${label}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm transition hover:bg-white/25 hover:ring-2 hover:ring-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Icon className="h-6 w-6 text-white" strokeWidth={1.75} />
          </Link>
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
            <Icon className="h-6 w-6 text-white" strokeWidth={1.75} />
          </div>
        )}
      </div>
      <div className="relative z-[1] mt-auto pt-3">
        <ConnectKpiSparkline data={sparkline} className="h-[52px] opacity-95" />
      </div>
    </article>
  )
}

export function KpiCardSkeleton() {
  return (
    <div className="relative min-h-[148px] animate-pulse overflow-hidden rounded-xl bg-gradient-to-br from-slate-300 to-slate-400 p-4 shadow-lg sm:min-h-[152px] sm:p-5">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="h-8 w-20 rounded bg-white/30" />
          <div className="h-3 w-32 rounded bg-white/25" />
        </div>
        <div className="h-11 w-11 rounded-xl bg-white/20" />
      </div>
      <div className="mt-auto flex h-[52px] items-end gap-1 pt-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex-1 rounded-t bg-white/25" style={{ height: `${30 + (i % 4) * 12}%` }} />
        ))}
      </div>
    </div>
  )
}
