import type { CampusBlockId } from '../constants/campusBlocks'
import type { GridPriority } from './grid'

export type CampusTicketMarkerKind = 'ticket' | 'task'
export type CampusTicketMarkerStatus = 'open' | 'in_progress' | 'completed'

export interface CampusTicketMarker {
  id: string
  kind: CampusTicketMarkerKind
  code: string
  title: string
  blockId: CampusBlockId
  room?: string
  priority: GridPriority
  status: CampusTicketMarkerStatus
  statusLabel: string
  assignee?: string
}

export const CAMPUS_TICKET_STATUS_LABELS: Record<CampusTicketMarkerStatus, string> = {
  open: 'Aberto',
  in_progress: 'Em andamento',
  completed: 'Concluido',
}

export const CAMPUS_TICKET_STATUS_COLORS: Record<CampusTicketMarkerStatus, string> = {
  open: '#dc2626',
  in_progress: '#2563eb',
  completed: '#16a34a',
}

export const CAMPUS_TICKET_KIND_LABELS: Record<CampusTicketMarkerKind, string> = {
  ticket: 'Chamado',
  task: 'Tarefa',
}
