import { GripVertical, Lock, Pencil, Trash2, UserCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { intlLocale, normalizeLocale } from '../../i18n'
import { GridPriorityBadge, GridTicketStatusBadge } from './GridBadges'
import type { GridTicket, GridTicketStatus } from '../../types/grid'

function formatDateTime(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function GridTicketKanbanCard({
  ticket,
  isDragging,
  onEdit,
  onAssign,
  onEvaluate,
  onApprove,
  onDelete,
}: {
  ticket: GridTicket
  isDragging?: boolean
  onEdit: () => void
  onAssign: () => void
  onEvaluate?: () => void
  onApprove?: () => void
  onDelete: () => void
}) {
  const { t, i18n } = useTranslation()
  const dateLocale = intlLocale(normalizeLocale(i18n.language))
  const locked = ticket.workflow_locked || ticket.status === 'em_atendimento'

  return (
    <article
      className={`glass-panel-solid min-w-0 overflow-hidden rounded-xl border border-hub-border/50 shadow-sm transition-all duration-300 ${
        isDragging ? 'scale-[1.02] shadow-xl ring-2 ring-hub-red/20' : 'hover:shadow-md'
      }`}
    >
      <div className="border-b border-hub-border/40 bg-gradient-to-r from-hub-navy/5 to-transparent px-3 py-2.5">
        <div className="flex items-start gap-2">
          <span
            className={`mt-0.5 shrink-0 text-hub-text-muted ${locked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
            data-cursor={locked ? 'not-allowed' : 'grab'}
            aria-hidden
          >
            {locked ? <Lock className="h-4 w-4 text-amber-600" /> : <GripVertical className="h-4 w-4" />}
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-hub-red">{ticket.code}</p>
            <h3 className="mt-0.5 line-clamp-2 break-words text-sm font-semibold leading-snug text-hub-navy">{ticket.title}</h3>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-1" onPointerDown={(e) => e.stopPropagation()}>
          <button type="button" className="rounded p-1.5 hover:bg-white/50" onClick={onEdit} aria-label={t('gridComponents.ticketKanbanCard.edit')}>
            <Pencil className="h-3.5 w-3.5 text-hub-text-muted" />
          </button>
          <button type="button" className="rounded p-1.5 hover:bg-white/50" onClick={onAssign} aria-label={t('gridComponents.ticketKanbanCard.assign')}>
            <UserCheck className="h-3.5 w-3.5 text-hub-text-muted" />
          </button>

          {ticket.status === 'aguardando_aprovacao' && onApprove && (
            <button
              type="button"
              className="rounded px-2 py-1 text-[10px] font-semibold text-yellow-800 hover:bg-yellow-50"
              onClick={onApprove}
            >
              {t('gridComponents.ticketKanbanCard.approve')}
            </button>
          )}

          {ticket.status === 'avaliacao_pendente' && onEvaluate && (
            <button
              type="button"
              className="rounded px-2 py-1 text-[10px] font-semibold text-violet-700 hover:bg-violet-50"
              onClick={onEvaluate}
            >
              {t('gridComponents.ticketKanbanCard.evaluate')}
            </button>
          )}

          <button type="button" className="rounded p-1.5 hover:bg-white/50" onClick={onDelete} aria-label={t('gridComponents.ticketKanbanCard.delete')}>
            <Trash2 className="h-3.5 w-3.5 text-hub-red" />
          </button>
        </div>
      </div>

      <div className="space-y-2 px-3 py-2.5 text-sm">
        <div className="flex flex-wrap gap-1.5">
          <GridPriorityBadge priority={ticket.priority} />
          <GridTicketStatusBadge status={ticket.status} />
        </div>

        <p className="break-words text-xs leading-relaxed text-hub-text-muted">
          <span className="font-medium text-hub-text">{ticket.requester}</span>
          <span className="mx-1 text-hub-border">·</span>
          <span>
            {ticket.room}/{ticket.block}
          </span>
        </p>

        <p className="text-[11px] text-hub-text-muted">{formatDateTime(ticket.opened_at, dateLocale)}</p>

        {ticket.assignee ? (
          <p className="truncate text-xs text-hub-text-muted">
            <span className="font-medium text-hub-text">{t('gridComponents.ticketKanbanCard.technician')}</span> {ticket.assignee}
          </p>
        ) : null}

        {ticket.summary ? <p className="line-clamp-3 break-words text-xs text-hub-text-muted">{ticket.summary}</p> : null}

        {locked ? (
          <p className="text-[11px] font-medium text-amber-700">{t('gridComponents.ticketKanbanCard.lockedHint')}</p>
        ) : null}
      </div>
    </article>
  )
}

export function applyTicketStatus(ticket: GridTicket, status: GridTicketStatus): GridTicket {
  return { ...ticket, status }
}
