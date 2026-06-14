import { Pencil, Trash2, UserCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ConnectRowActionsMenu } from '../connect/ConnectRowActionsMenu'
import { viewRowAction } from '../connect/connectViewActions'
import { GridPriorityBadge, GridTicketStatusBadge } from './GridBadges'
import { intlLocale, normalizeLocale } from '../../i18n'
import type { GridTicket } from '../../types/grid'

function formatDateTime(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function GridTicketCard({
  ticket,
  onView,
  onEdit,
  onAssign,
  onDelete,
}: {
  ticket: GridTicket
  onView: () => void
  onEdit: () => void
  onAssign: () => void
  onDelete: () => void
}) {
  const { t, i18n } = useTranslation()
  const dateLocale = intlLocale(normalizeLocale(i18n.language))

  return (
    <article className="glass-panel-solid overflow-hidden rounded-2xl border border-hub-border/50 shadow-sm transition-shadow hover:shadow-md">
      <div className="border-b border-hub-border/40 bg-gradient-to-r from-hub-navy/5 to-transparent px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-hub-red">{ticket.code}</p>
            <h3 className="mt-0.5 line-clamp-2 font-semibold text-hub-navy">{ticket.title}</h3>
          </div>
          <ConnectRowActionsMenu
            ariaLabel={t('gridComponents.ticketCard.actionsAria', { code: ticket.code })}
            actions={[
              viewRowAction(onView),
              { key: 'edit', label: t('gridComponents.ticketCard.edit'), icon: Pencil, onClick: onEdit },
              { key: 'assign', label: t('gridComponents.ticketCard.assign'), icon: UserCheck, onClick: onAssign },
              { key: 'delete', label: t('gridComponents.ticketCard.delete'), icon: Trash2, variant: 'danger', onClick: onDelete },
            ]}
          />
        </div>
      </div>
      <div className="space-y-3 px-4 py-3 text-sm">
        <div className="flex flex-wrap gap-2">
          <GridPriorityBadge priority={ticket.priority} />
          <GridTicketStatusBadge status={ticket.status} />
        </div>
        <dl className="grid grid-cols-1 gap-y-2 text-xs sm:grid-cols-2 sm:gap-x-3">
          <div>
            <dt className="text-hub-text-muted">{t('gridComponents.ticketCard.requester')}</dt>
            <dd className="font-medium text-hub-text">{ticket.requester}</dd>
          </div>
          <div>
            <dt className="text-hub-text-muted">{t('gridComponents.ticketCard.location')}</dt>
            <dd className="font-medium text-hub-text">
              {ticket.room} / {ticket.block}
            </dd>
          </div>
          <div>
            <dt className="text-hub-text-muted">{t('gridComponents.ticketCard.openedAt')}</dt>
            <dd className="font-medium text-hub-text">{formatDateTime(ticket.opened_at, dateLocale)}</dd>
          </div>
          <div>
            <dt className="text-hub-text-muted">{t('gridComponents.ticketCard.assignee')}</dt>
            <dd className="font-medium text-hub-text">{ticket.assignee || '—'}</dd>
          </div>
        </dl>
        {ticket.summary && (
          <p className="line-clamp-2 text-xs leading-relaxed text-hub-text-muted">{ticket.summary}</p>
        )}
      </div>
    </article>
  )
}
