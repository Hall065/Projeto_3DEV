import { Pencil, Trash2, UserCheck } from 'lucide-react'
import { ConnectRowActionsMenu } from '../connect/ConnectRowActionsMenu'
import { viewRowAction } from '../connect/connectViewActions'
import { GridPriorityBadge, GridTicketStatusBadge } from './GridBadges'
import type { GridTicket } from '../../types/grid'

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
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
  return (
    <article className="glass-panel-solid overflow-hidden rounded-2xl border border-hub-border/50 shadow-sm transition-shadow hover:shadow-md">
      <div className="border-b border-hub-border/40 bg-gradient-to-r from-hub-navy/5 to-transparent px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-hub-red">{ticket.code}</p>
            <h3 className="mt-0.5 line-clamp-2 font-semibold text-hub-navy">{ticket.title}</h3>
          </div>
          <ConnectRowActionsMenu
            ariaLabel={`Ações do chamado ${ticket.code}`}
            actions={[
              viewRowAction(onView),
              { key: 'edit', label: 'Editar', icon: Pencil, onClick: onEdit },
              { key: 'assign', label: 'Atribuir técnico', icon: UserCheck, onClick: onAssign },
              { key: 'delete', label: 'Excluir', icon: Trash2, variant: 'danger', onClick: onDelete },
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
            <dt className="text-hub-text-muted">Solicitante</dt>
            <dd className="font-medium text-hub-text">{ticket.requester}</dd>
          </div>
          <div>
            <dt className="text-hub-text-muted">Local</dt>
            <dd className="font-medium text-hub-text">
              {ticket.room} / {ticket.block}
            </dd>
          </div>
          <div>
            <dt className="text-hub-text-muted">Abertura</dt>
            <dd className="font-medium text-hub-text">{formatDateTime(ticket.opened_at)}</dd>
          </div>
          <div>
            <dt className="text-hub-text-muted">Responsável</dt>
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
