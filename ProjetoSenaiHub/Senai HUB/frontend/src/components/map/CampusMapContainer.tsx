import { Maximize2, Minimize2, X } from 'lucide-react'
import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import type { CampusBlockId } from '../../constants/campusBlocks'
import type { CampusPersonLocation } from '../../types/campusPeople'
import type { CampusTicketMarker } from '../../types/campusTickets'
import type { CampusBlockStats } from '../../utils/campusBlockStats'
import { campusModelsAvailable } from '../../utils/campusMapAssets'
import { CampusMap2DViewer } from './CampusMap2DViewer'
import type { CampusMap3DViewerProps } from './CampusMap3DViewer'

const LazyCampusMap3DViewer = lazy(() =>
  import('./CampusMap3DViewer').then((module) => ({ default: module.CampusMap3DViewer })),
)

export interface CampusMapContainerProps {
  blockStats?: Record<CampusBlockId, CampusBlockStats>
  people?: CampusPersonLocation[]
  ticketMarkers?: CampusTicketMarker[]
  highlightPersonId?: string | null
  className?: string
  minHeight?: string
  compact?: boolean
}

export function CampusMapContainer({
  blockStats,
  people,
  ticketMarkers,
  highlightPersonId = null,
  className = '',
  minHeight = '360px',
  compact = false,
}: CampusMapContainerProps) {
  const { t } = useTranslation()
  const [selectedBlockId, setSelectedBlockId] = useState<CampusBlockId | null>(null)
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [use3d, setUse3d] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    campusModelsAvailable().then((available) => {
      if (!cancelled) setUse3d(available)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!highlightPersonId || !people?.length) return
    const person = people.find((entry) => entry.id === highlightPersonId)
    if (!person) return
    setSelectedPersonId(person.id)
    setSelectedBlockId(person.blockId)
  }, [highlightPersonId, people])

  useEffect(() => {
    if (!fullscreen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFullscreen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [fullscreen])

  const viewerProps: CampusMap3DViewerProps = {
    blockStats,
    people,
    ticketMarkers,
    selectedBlockId,
    selectedPersonId,
    selectedTicketId,
    onSelectBlock: setSelectedBlockId,
    onSelectPerson: setSelectedPersonId,
    onSelectTicket: setSelectedTicketId,
    minHeight: '100%',
    compact,
    className: fullscreen ? 'h-full rounded-none border-0' : 'h-full',
  }

  const Viewer: ComponentType<CampusMap3DViewerProps> = use3d ? LazyCampusMap3DViewer : CampusMap2DViewer

  const viewer = (
    <Suspense
      fallback={
        <div
          className="flex h-full min-h-[280px] items-center justify-center rounded-xl border border-hub-border/60 bg-[#e8edf5] text-sm text-hub-text-muted"
          style={{ minHeight }}
        >
          {t('mapComponents.container.loading')}
        </div>
      }
    >
      {use3d === null ? (
        <div
          className="flex h-full min-h-[280px] items-center justify-center rounded-xl border border-hub-border/60 bg-[#e8edf5] text-sm text-hub-text-muted"
          style={{ minHeight }}
        >
          {t('mapComponents.container.loading')}
        </div>
      ) : (
        <Viewer {...viewerProps} />
      )}
    </Suspense>
  )

  return (
    <>
      <div className={`relative w-full ${className}`} style={{ height: minHeight, minHeight }}>
        {!fullscreen && (
          <>
            {viewer}
            <button
              type="button"
              onClick={() => setFullscreen(true)}
              className="absolute bottom-3 right-3 z-30 inline-flex items-center gap-1.5 rounded-lg bg-hub-navy px-3 py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-hub-navy/90"
              title={t('mapComponents.container.maximizeTitle')}
            >
              <Maximize2 className="h-4 w-4" />
              {t('mapComponents.container.maximize')}
            </button>
          </>
        )}
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-hub-bg">
          <div className="flex items-center justify-between border-b border-hub-border/60 px-4 py-3">
            <div>
              <h2 className="text-lg font-bold text-hub-navy">{t('mapComponents.container.fullscreenTitle')}</h2>
              <p className="text-sm text-hub-text-muted">
                {use3d ? t('mapComponents.container.view3d') : t('mapComponents.container.view2d')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              className="inline-flex items-center gap-2 rounded-lg border border-hub-border/60 px-3 py-2 text-sm font-medium text-hub-navy transition hover:border-hub-red/40 hover:text-hub-red"
            >
              <Minimize2 className="h-4 w-4" />
              {t('mapComponents.container.close')}
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="relative min-h-0 flex-1 p-3 sm:p-4">{viewer}</div>
        </div>
      )}
    </>
  )
}
