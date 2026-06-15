import i18n, { intlLocale, normalizeLocale } from '../i18n'
import { getTicketStatusLabel } from '../components/grid/GridBadges'
import type { GridTicket, GridTicketStatus } from '../types/grid'

export const LOCKED_TICKET_STATUS: GridTicketStatus = 'em_atendimento'

export const TICKET_WORKFLOW_ORDER: GridTicketStatus[] = [
  'aberto',
  'pendente',
  'em_atendimento',
  'aguardando_aprovacao',
  'avaliacao_pendente',
  'concluido',
]

export function getTicketWorkflowSteps() {
  return TICKET_WORKFLOW_ORDER.map((status) => ({
    status,
    label: getTicketStatusLabel(status),
    description: i18n.t(`grid.workflow.stepHints.${status}`),
  }))
}

export function workflowStepIndex(status: GridTicketStatus): number {
  const idx = TICKET_WORKFLOW_ORDER.indexOf(status)
  return idx >= 0 ? idx : 0
}

export function appendStageNote(existing: string | undefined, stageLabel: string, note: string): string {
  const trimmed = note.trim()
  if (!trimmed) return existing?.trim() ?? ''
  const locale = intlLocale(normalizeLocale(i18n.language))
  const line = `[${new Date().toLocaleString(locale)}] ${stageLabel}: ${trimmed}`
  const base = existing?.trim()
  return base ? `${base}\n\n${line}` : line
}

export function canDragTicket(ticket: GridTicket): boolean {
  return !ticket.workflow_locked && ticket.status !== LOCKED_TICKET_STATUS
}

export function canMoveTicketTo(ticket: GridTicket, to: GridTicketStatus, from?: GridTicketStatus): boolean {
  const fromCol = from ?? ticket.status
  if (fromCol === LOCKED_TICKET_STATUS || ticket.workflow_locked) {
    return false
  }

  switch (to) {
    case 'aberto':
      return fromCol === 'pendente'
    case 'pendente':
      return fromCol === 'aberto' && !!ticket.assignee?.trim()
    case 'em_atendimento':
      return fromCol === 'pendente' && !!ticket.assignee?.trim()
    default:
      return false
  }
}

export function ticketMoveBlockedMessage(ticket: GridTicket, to: GridTicketStatus): string | null {
  if (ticket.status === LOCKED_TICKET_STATUS && to !== LOCKED_TICKET_STATUS) {
    return i18n.t('grid.workflow.blocked.lockedTask')
  }
  if (to === 'em_atendimento' && !ticket.assignee?.trim()) {
    return i18n.t('grid.workflow.blocked.needsAssigneeStart')
  }
  if (to === 'pendente' && ticket.status === 'aberto' && !ticket.assignee?.trim()) {
    return i18n.t('grid.workflow.blocked.needsAssigneePending')
  }
  if (['aguardando_aprovacao', 'avaliacao_pendente', 'concluido'].includes(to)) {
    return i18n.t('grid.workflow.blocked.useApprovalButtons')
  }
  return null
}

export function ticketMoveNeedsAssignee(ticket: GridTicket, to: GridTicketStatus): boolean {
  return !ticket.assignee?.trim() && (to === 'pendente' || to === 'em_atendimento')
}

export function ticketKanbanDropAllowed(ticket: GridTicket, from: GridTicketStatus, to: GridTicketStatus): boolean {
  if (from === to) return true
  if (from === LOCKED_TICKET_STATUS || ticket.workflow_locked) return false
  if (['aguardando_aprovacao', 'avaliacao_pendente', 'concluido'].includes(to)) return false

  switch (to) {
    case 'aberto':
      return from === 'pendente'
    case 'pendente':
      return from === 'aberto'
    case 'em_atendimento':
      return from === 'pendente'
    default:
      return false
  }
}
