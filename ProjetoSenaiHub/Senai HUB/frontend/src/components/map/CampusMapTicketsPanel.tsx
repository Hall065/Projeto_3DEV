import { ClipboardList, Wrench } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { CampusBlockId } from '../../constants/campusBlocks'
import { CAMPUS_BLOCK_BY_ID } from '../../constants/campusBlocks'
import type { CampusTicketMarker, CampusTicketMarkerStatus } from '../../types/campusTickets'
import { CAMPUS_TICKET_STATUS_COLORS } from '../../types/campusTickets'
import {
  countTicketsByKind,
  countTicketsByStatus,
  groupTicketsByBlock,
} from '../../utils/campusTicketMarkers'

interface CampusMapTicketsPanelProps {
  tickets: CampusTicketMarker[]
  selectedBlockId: CampusBlockId | null
  selectedTicketId?: string | null
  compact?: boolean
}

function StatusBadge({ status }: { status: CampusTicketMarkerStatus }) {
  const { t } = useTranslation()
  return (
    <span
      className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
      style={{ backgroundColor: CAMPUS_TICKET_STATUS_COLORS[status] }}
    >
      {t(`mapComponents.ticketsPanel.markerStatus.${status}`)}
    </span>
  )
}

function KindIcon({ kind }: { kind: CampusTicketMarker['kind'] }) {
  const Icon = kind === 'ticket' ? ClipboardList : Wrench
  return <Icon className="h-3 w-3 shrink-0 text-hub-text-muted" />
}

export function CampusMapTicketsPanel({
  tickets,
  selectedBlockId,
  selectedTicketId = null,
  compact = false,
}: CampusMapTicketsPanelProps) {
  const { t } = useTranslation()
  const byBlock = groupTicketsByBlock(tickets)
  const statusTotals = countTicketsByStatus(tickets)
  const kindTotals = countTicketsByKind(tickets)
  const blockTickets = selectedBlockId ? byBlock[selectedBlockId] : []
  const blockName = selectedBlockId ? CAMPUS_BLOCK_BY_ID[selectedBlockId].name : null
  const selected = selectedTicketId ? tickets.find((item) => item.id === selectedTicketId) : null

  return (
    <div
      className={`pointer-events-none absolute z-10 ${compact ? 'bottom-2 left-2 right-2' : 'bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm'}`}
    >
      {selected ? (
        <div className="glass-panel-solid pointer-events-auto rounded-xl border border-hub-border/60 p-3 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-hub-red">
            {t('mapComponents.ticketsPanel.selectedKind', {
              kind: t(`mapComponents.ticketsPanel.markerKind.${selected.kind}`),
            })}
          </p>
          <p className="mt-1 text-xs font-semibold text-hub-red">{selected.code}</p>
          <p className="font-semibold text-hub-navy">{selected.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={selected.status} />
            <span className="text-xs text-hub-text-muted">{CAMPUS_BLOCK_BY_ID[selected.blockId].name}</span>
          </div>
          {selected.room && (
            <p className="mt-2 text-xs text-hub-text-muted">{t('mapComponents.ticketsPanel.room', { room: selected.room })}</p>
          )}
          {selected.assignee && (
            <p className="text-xs text-hub-text-muted">{t('mapComponents.ticketsPanel.assignee', { assignee: selected.assignee })}</p>
          )}
          <p className="text-xs text-hub-text-muted capitalize">
            {t('mapComponents.ticketsPanel.priority', { priority: selected.priority })}
          </p>
        </div>
      ) : selectedBlockId && blockTickets.length > 0 ? (
        <div className="glass-panel-solid pointer-events-auto rounded-xl border border-hub-border/60 p-3 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-hub-red">{blockName}</p>
          <p className="mb-2 text-[11px] text-hub-text-muted">
            {t('mapComponents.ticketsPanel.blockCount', { count: blockTickets.length })}
          </p>
          <ul className={`scrollbar-glass-inset space-y-2 overflow-y-auto pr-1 ${compact ? 'max-h-28' : 'max-h-40'}`}>
            {blockTickets.map((item) => (
              <li key={item.id} className="flex items-start gap-2 text-xs">
                <KindIcon kind={item.kind} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-hub-navy">
                    {item.code} · {item.title}
                  </p>
                  <p className="truncate text-hub-text-muted">
                    {item.room ? t('mapComponents.ticketsPanel.room', { room: item.room }) : item.statusLabel}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </li>
            ))}
          </ul>
        </div>
      ) : selectedBlockId ? (
        <div className="glass-panel-solid pointer-events-auto rounded-xl border border-hub-border/60 px-3 py-2 text-xs text-hub-text-muted shadow-lg">
          {t('mapComponents.ticketsPanel.emptyBlock', { block: blockName })}
        </div>
      ) : (
        <div className="glass-panel-solid pointer-events-auto rounded-xl border border-hub-border/60 p-3 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-hub-red">{t('mapComponents.ticketsPanel.campusTitle')}</p>
          <p className="mt-1 text-[11px] text-hub-text-muted">{t('mapComponents.ticketsPanel.campusHint')}</p>
          <dl className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div>
              <dt className="text-[10px] text-hub-text-muted">{t('mapComponents.ticketsPanel.open')}</dt>
              <dd className="text-base font-bold text-red-600">{statusTotals.open}</dd>
            </div>
            <div>
              <dt className="text-[10px] text-hub-text-muted">{t('mapComponents.ticketsPanel.inProgress')}</dt>
              <dd className="text-base font-bold text-blue-600">{statusTotals.in_progress}</dd>
            </div>
            <div>
              <dt className="text-[10px] text-hub-text-muted">{t('mapComponents.ticketsPanel.completed')}</dt>
              <dd className="text-base font-bold text-emerald-600">{statusTotals.completed}</dd>
            </div>
          </dl>
          <p className="mt-2 text-center text-[10px] text-hub-text-muted">
            {t('mapComponents.ticketsPanel.kindTotals', {
              tickets: kindTotals.ticket,
              tasks: kindTotals.task,
            })}
          </p>
        </div>
      )}
    </div>
  )
}

export function CampusMapTicketsLegend({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation()
  const statuses: CampusTicketMarkerStatus[] = ['open', 'in_progress', 'completed']
  return (
    <div
      className={`pointer-events-none absolute z-10 flex flex-wrap gap-2 ${compact ? 'right-2 top-2' : 'right-3 top-12'}`}
    >
      {statuses.map((status) => (
        <span
          key={status}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-medium text-hub-navy shadow-sm"
        >
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CAMPUS_TICKET_STATUS_COLORS[status] }} />
          {t(`mapComponents.ticketsPanel.markerStatus.${status}`)}
        </span>
      ))}
    </div>
  )
}
