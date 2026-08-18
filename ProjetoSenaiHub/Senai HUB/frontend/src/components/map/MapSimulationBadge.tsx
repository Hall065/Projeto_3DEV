import { FlaskConical } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function MapSimulationBadge({ className = '' }: { className?: string }) {
  const { t } = useTranslation()

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900 ${className}`}
      role="status"
    >
      <FlaskConical className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {t('mapComponents.simulationBadge')}
    </div>
  )
}
