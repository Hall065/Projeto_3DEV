import { Activity, AlertCircle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface HealthStatusBadgeProps {
  loading: boolean
  error: string | null
  status?: string
}

export function HealthStatusBadge({ loading, error, status }: HealthStatusBadgeProps) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {t('health.checking')}
      </span>
    )
  }

  if (error) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
        <AlertCircle className="h-3.5 w-3.5" />
        {t('health.offline')}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
      <Activity className="h-3.5 w-3.5" />
      {t('health.online', { status: status ?? 'ok' })}
    </span>
  )
}
