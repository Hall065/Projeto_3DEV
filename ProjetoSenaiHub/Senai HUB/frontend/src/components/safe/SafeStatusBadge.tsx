import type { SafeAuthorizationStatus } from '../../types/safe'

const STATUS_CLASSES: Record<SafeAuthorizationStatus, string> = {
  pendente_aqv: 'bg-slate-100 text-slate-700',
  aguardando_professor: 'bg-amber-50 text-amber-700',
  liberado_portaria: 'bg-sky-50 text-sky-700',
  finalizado: 'bg-emerald-50 text-emerald-700',
  negado: 'bg-red-50 text-red-700',
}

export function SafeStatusBadge({ status, label }: { status: SafeAuthorizationStatus; label?: string }) {
  const classes = STATUS_CLASSES[status] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}>
      {label ?? status}
    </span>
  )
}
