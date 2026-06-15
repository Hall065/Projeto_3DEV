import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
import type { GridInventoryStatus, GridPriority, GridTicketStatus } from '../../types/grid'

const priorityStyles: Record<GridPriority, string> = {
  alta: 'border-red-200 bg-red-50 text-red-700',
  media: 'border-amber-200 bg-amber-50 text-amber-700',
  baixa: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

const ticketStatusStyles: Record<GridTicketStatus, string> = {
  aberto: 'border-hub-navy/25 bg-hub-navy/10 text-blue-700',
  pendente: 'border-orange-200 bg-orange-50 text-orange-700',
  em_atendimento: 'border-amber-200 bg-amber-50 text-amber-700',
  aguardando_aprovacao: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  avaliacao_pendente: 'border-violet-200 bg-violet-50 text-violet-700',
  concluido: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

const inventoryStatusStyles: Record<GridInventoryStatus, string> = {
  disponivel: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  baixo: 'border-red-200 bg-red-50 text-red-700',
  reservado: 'border-purple-200 bg-purple-50 text-purple-700',
}

export function getTicketStatusLabel(status: GridTicketStatus): string {
  return i18n.t(`grid.labels.ticketStatus.${status}`, { defaultValue: status })
}

export function getPriorityLabel(priority: GridPriority): string {
  return i18n.t(`grid.labels.priority.${priority}`, { defaultValue: priority })
}

export function getInventoryStatusLabel(status: GridInventoryStatus): string {
  return i18n.t(`grid.labels.inventoryStatus.${status}`, { defaultValue: status })
}

export function GridPriorityBadge({ priority }: { priority: GridPriority }) {
  const { t } = useTranslation()
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${priorityStyles[priority]}`}>
      {t(`grid.labels.priority.${priority}`, { defaultValue: priority })}
    </span>
  )
}

export function GridTicketStatusBadge({ status }: { status: GridTicketStatus }) {
  const { t } = useTranslation()
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ticketStatusStyles[status]}`}>
      {t(`grid.labels.ticketStatus.${status}`, { defaultValue: status })}
    </span>
  )
}

export function GridInventoryStatusBadge({ status }: { status: GridInventoryStatus }) {
  const { t } = useTranslation()
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${inventoryStatusStyles[status]}`}>
      {t(`grid.labels.inventoryStatus.${status}`, { defaultValue: status })}
    </span>
  )
}
