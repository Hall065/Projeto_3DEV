import { useTranslation } from 'react-i18next'
import type { CampusBlockId } from '../../constants/campusBlocks'
import type { CampusBlockStats } from '../../utils/campusBlockStats'

interface CampusMapBlockPanelProps {
  stats: Record<CampusBlockId, CampusBlockStats>
  selectedBlockId: CampusBlockId | null
  compact?: boolean
}

export function CampusMapBlockPanel({ stats, selectedBlockId, compact = false }: CampusMapBlockPanelProps) {
  const { t } = useTranslation()
  const selected = selectedBlockId ? stats[selectedBlockId] : null

  return (
    <div
      className={`pointer-events-none absolute z-10 ${compact ? 'bottom-2 left-2 right-2' : 'bottom-3 left-3 right-3 sm:right-auto sm:max-w-xs'}`}
    >
      {selected ? (
        <div className="glass-panel-solid pointer-events-auto rounded-xl border border-hub-border/60 p-3 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-hub-red">{selected.name}</p>
          <dl className={`mt-2 grid gap-2 ${compact ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-3'}`}>
            <div>
              <dt className="text-[11px] text-hub-text-muted">{t('mapComponents.blockPanel.tickets')}</dt>
              <dd className="text-lg font-bold text-hub-navy">{selected.total}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-hub-text-muted">{t('mapComponents.blockPanel.open')}</dt>
              <dd className="text-lg font-bold text-amber-600">{selected.open}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-hub-text-muted">{t('mapComponents.blockPanel.completed')}</dt>
              <dd className="text-lg font-bold text-emerald-600">{selected.completed}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <div className="glass-panel-solid pointer-events-auto rounded-xl border border-hub-border/60 px-3 py-2 text-xs text-hub-text-muted shadow-lg">
          {t('mapComponents.blockPanel.selectBlockHint')}
        </div>
      )}
    </div>
  )
}
