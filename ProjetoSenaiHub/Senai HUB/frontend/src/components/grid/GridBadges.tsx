import type { GridInventoryStatus, GridPriority, GridTicketStatus } from '../../types/grid'

const priorityStyles: Record<GridPriority, string> = {
  alta: 'border-red-200 bg-red-50 text-red-700',
  media: 'border-amber-200 bg-amber-50 text-amber-700',
  baixa: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

const priorityLabels: Record<GridPriority, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
}

const ticketStatusStyles: Record<GridTicketStatus, string> = {
  aberto: 'border-hub-navy/25 bg-hub-navy/10 text-blue-700',
  em_andamento: 'border-amber-200 bg-amber-50 text-amber-700',
  concluido: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  pendente: 'border-orange-200 bg-orange-50 text-orange-700',
}

const ticketStatusLabels: Record<GridTicketStatus, string> = {
  aberto: 'Aberto',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
  pendente: 'Pendente',
}

export function GridPriorityBadge({ priority }: { priority: GridPriority }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${priorityStyles[priority]}`}>
      {priorityLabels[priority]}
    </span>
  )
}

export function GridTicketStatusBadge({ status }: { status: GridTicketStatus }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ticketStatusStyles[status]}`}>
      {ticketStatusLabels[status]}
    </span>
  )
}

export function GridInventoryStatusBadge({ status }: { status: GridInventoryStatus }) {
  const map: Record<GridInventoryStatus, string> = {
    disponivel: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    baixo: 'border-red-200 bg-red-50 text-red-700',
    reservado: 'border-purple-200 bg-purple-50 text-purple-700',
  }
  const labels: Record<GridInventoryStatus, string> = {
    disponivel: 'Disponível',
    baixo: 'Estoque baixo',
    reservado: 'Reservado',
  }
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${map[status]}`}>
      {labels[status]}
    </span>
  )
}
