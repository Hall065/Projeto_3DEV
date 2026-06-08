import type { CampusBlockId } from '../constants/campusBlocks'
import { CAMPUS_BLOCKS } from '../constants/campusBlocks'
import type {
  CampusTicketMarker,
  CampusTicketMarkerKind,
  CampusTicketMarkerStatus,
} from '../types/campusTickets'
import { CAMPUS_TICKET_STATUS_COLORS } from '../types/campusTickets'
import type { GridTaskCard, GridTicket, GridTicketStatus } from '../types/grid'
import { normalizeCampusBlockId } from './campusBlockStats'

const BLOCK_IDS = CAMPUS_BLOCKS.map((block) => block.id)

function ticketStatus(status: GridTicketStatus): CampusTicketMarkerStatus {
  if (status === 'concluido') return 'completed'
  if (status === 'em_atendimento' || status === 'aguardando_aprovacao' || status === 'avaliacao_pendente') {
    return 'in_progress'
  }
  return 'open'
}

function taskStatus(column: GridTaskCard['column']): CampusTicketMarkerStatus {
  if (column === 'concluidas') return 'completed'
  if (column === 'em_andamento') return 'in_progress'
  return 'open'
}

export function buildCampusTicketMarkers(
  tasks: GridTaskCard[],
  tickets: GridTicket[],
): CampusTicketMarker[] {
  const markers: CampusTicketMarker[] = []
  const seen = new Set<string>()

  for (const ticket of tickets) {
    const blockId = normalizeCampusBlockId(ticket.block)
    if (!blockId) continue
    const id = `ticket-${ticket.id}`
    if (seen.has(id)) continue
    seen.add(id)
    markers.push({
      id,
      kind: 'ticket',
      code: ticket.code,
      title: ticket.title,
      blockId,
      room: ticket.room || undefined,
      priority: ticket.priority,
      status: ticketStatus(ticket.status),
      statusLabel: ticket.status.replace(/_/g, ' '),
      assignee: ticket.assignee || undefined,
    })
  }

  for (const task of tasks) {
    const blockId = normalizeCampusBlockId(task.block)
    if (!blockId) continue
    const id = `task-${task.id}`
    if (seen.has(id)) continue
    seen.add(id)
    markers.push({
      id,
      kind: 'task',
      code: task.code,
      title: task.title,
      blockId,
      room: task.room || undefined,
      priority: task.priority,
      status: taskStatus(task.column),
      statusLabel: task.status_label,
      assignee: task.assignee || undefined,
    })
  }

  return markers
}

export function groupTicketsByBlock(
  markers: CampusTicketMarker[],
): Record<CampusBlockId, CampusTicketMarker[]> {
  return BLOCK_IDS.reduce(
    (acc, blockId) => {
      acc[blockId] = markers.filter((marker) => marker.blockId === blockId)
      return acc
    },
    {} as Record<CampusBlockId, CampusTicketMarker[]>,
  )
}

export function countTicketsByStatus(markers: CampusTicketMarker[]): Record<CampusTicketMarkerStatus, number> {
  return markers.reduce(
    (acc, marker) => {
      acc[marker.status] += 1
      return acc
    },
    { open: 0, in_progress: 0, completed: 0 },
  )
}

export function countTicketsByKind(markers: CampusTicketMarker[]): Record<CampusTicketMarkerKind, number> {
  return markers.reduce(
    (acc, marker) => {
      acc[marker.kind] += 1
      return acc
    },
    { ticket: 0, task: 0 },
  )
}

export function ticketMarkerColor(marker: CampusTicketMarker): string {
  if (marker.priority === 'alta' && marker.status === 'open') return '#b91c1c'
  if (marker.priority === 'alta' && marker.status === 'in_progress') return '#1d4ed8'
  return CAMPUS_TICKET_STATUS_COLORS[marker.status]
}
