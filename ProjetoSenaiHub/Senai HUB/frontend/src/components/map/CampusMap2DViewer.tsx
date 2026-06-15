import { MapPin } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CAMPUS_BLOCKS, type CampusBlockId } from '../../constants/campusBlocks'
import type { CampusPersonLocation } from '../../types/campusPeople'
import type { CampusTicketMarker } from '../../types/campusTickets'
import type { CampusBlockStats } from '../../utils/campusBlockStats'
import { groupPeopleByBlock } from '../../utils/campusPeopleSimulation'
import { groupTicketsByBlock } from '../../utils/campusTicketMarkers'
import { CampusMapBlockPanel } from './CampusMapBlockPanel'
import { CampusMapPeopleLegend, CampusMapPeoplePanel } from './CampusMapPeoplePanel'
import { CampusMapTicketsLegend, CampusMapTicketsPanel } from './CampusMapTicketsPanel'
import mapPlaceholder from '../../assets/map-placeholder.svg'

export interface CampusMap2DViewerProps {
  blockStats?: Record<CampusBlockId, CampusBlockStats>
  people?: CampusPersonLocation[]
  ticketMarkers?: CampusTicketMarker[]
  selectedBlockId?: CampusBlockId | null
  selectedPersonId?: string | null
  selectedTicketId?: string | null
  onSelectBlock?: (blockId: CampusBlockId | null) => void
  onSelectPerson?: (personId: string | null) => void
  onSelectTicket?: (ticketId: string | null) => void
  className?: string
  minHeight?: string
  compact?: boolean
  showPanel?: boolean
}

export function CampusMap2DViewer({
  blockStats,
  people,
  ticketMarkers,
  selectedBlockId = null,
  selectedPersonId = null,
  selectedTicketId = null,
  onSelectBlock,
  onSelectPerson,
  onSelectTicket,
  className = '',
  minHeight = '320px',
  compact = false,
  showPanel = true,
}: CampusMap2DViewerProps) {
  const { t } = useTranslation()
  const [internalSelected, setInternalSelected] = useState<CampusBlockId | null>(selectedBlockId)
  const activeBlockId = onSelectBlock ? selectedBlockId : internalSelected

  const peopleByBlock = useMemo(() => groupPeopleByBlock(people ?? []), [people])
  const ticketsByBlock = useMemo(() => groupTicketsByBlock(ticketMarkers ?? []), [ticketMarkers])

  const setSelectedBlock = (blockId: CampusBlockId | null) => {
    onSelectBlock?.(blockId)
    if (!onSelectBlock) setInternalSelected(blockId)
  }

  const markerCountForBlock = (blockId: CampusBlockId) => {
    if (people?.length) return peopleByBlock[blockId]?.length ?? 0
    if (ticketMarkers?.length) return ticketsByBlock[blockId]?.length ?? 0
    return blockStats?.[blockId]?.total ?? 0
  }

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl border border-hub-border/60 bg-[#e8edf5] ${className}`}
      style={{ height: minHeight, minHeight }}
    >
      <img
        src={mapPlaceholder}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35"
      />

      <div className="relative z-10 flex h-full flex-col p-3 sm:p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="rounded-lg bg-white/85 px-2.5 py-1.5 text-[11px] text-hub-text-muted shadow-sm">
            {t('map.viewer2d.hint')}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-2 sm:gap-3">
          {CAMPUS_BLOCKS.map((block) => {
            const count = markerCountForBlock(block.id)
            const isSelected = activeBlockId === block.id

            return (
              <button
                key={block.id}
                type="button"
                onClick={() => {
                  onSelectPerson?.(null)
                  onSelectTicket?.(null)
                  setSelectedBlock(isSelected ? null : block.id)
                }}
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 px-2 py-3 text-center transition ${
                  isSelected
                    ? 'border-hub-red bg-white/95 shadow-md'
                    : 'border-white/70 bg-white/75 hover:border-hub-red/40 hover:bg-white/90'
                }`}
              >
                <span className="text-lg font-bold text-hub-navy">{block.id}</span>
                <span className="text-xs font-medium text-hub-text-muted">{block.name}</span>
                {count > 0 && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-hub-red px-2 py-0.5 text-[10px] font-semibold text-white">
                    <MapPin className="h-3 w-3" />
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {showPanel && people && people.length > 0 && <CampusMapPeopleLegend compact={compact} />}
      {showPanel && ticketMarkers && ticketMarkers.length > 0 && (
        <CampusMapTicketsLegend compact={compact} />
      )}

      {showPanel && people && people.length > 0 ? (
        <CampusMapPeoplePanel
          people={people}
          selectedBlockId={activeBlockId ?? null}
          selectedPersonId={selectedPersonId}
          compact={compact}
        />
      ) : showPanel && ticketMarkers && ticketMarkers.length > 0 ? (
        <CampusMapTicketsPanel
          tickets={ticketMarkers}
          selectedBlockId={activeBlockId ?? null}
          selectedTicketId={selectedTicketId}
          compact={compact}
        />
      ) : showPanel && blockStats ? (
        <CampusMapBlockPanel stats={blockStats} selectedBlockId={activeBlockId ?? null} compact={compact} />
      ) : null}
    </div>
  )
}
