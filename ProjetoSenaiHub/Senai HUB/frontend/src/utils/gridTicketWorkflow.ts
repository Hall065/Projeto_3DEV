import { ticketStatusLabels } from '../components/grid/GridBadges'
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

const WORKFLOW_STEP_HINTS: Record<GridTicketStatus, string> = {
  aberto: 'Chamado registrado. Atribua um técnico para continuar.',
  pendente: 'Técnico definido. Inicie o atendimento em campo.',
  em_atendimento: 'Serviço em execução. Conclua a tarefa vinculada ao finalizar.',
  aguardando_aprovacao: 'Aguardando validação do chefe de manutenção.',
  avaliacao_pendente: 'Aguardando avaliação do solicitante.',
  concluido: 'Chamado finalizado e arquivado para consulta.',
}

export const TICKET_WORKFLOW_STEPS = TICKET_WORKFLOW_ORDER.map((status) => ({
  status,
  label: ticketStatusLabels[status],
  description: WORKFLOW_STEP_HINTS[status],
}))

export function workflowStepIndex(status: GridTicketStatus): number {
  const idx = TICKET_WORKFLOW_ORDER.indexOf(status)
  return idx >= 0 ? idx : 0
}

export function appendStageNote(existing: string | undefined, stageLabel: string, note: string): string {
  const trimmed = note.trim()
  if (!trimmed) return existing?.trim() ?? ''
  const line = `[${new Date().toLocaleString('pt-BR')}] ${stageLabel}: ${trimmed}`
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
    return 'Chamado em atendimento só avança quando a tarefa vinculada for concluída.'
  }
  if (to === 'em_atendimento' && !ticket.assignee?.trim()) {
    return 'Atribua um técnico antes de iniciar o atendimento.'
  }
  if (to === 'pendente' && fromNeedsAssignee(ticket)) {
    return 'Atribua um técnico para mover para Pendentes.'
  }
  if (['aguardando_aprovacao', 'avaliacao_pendente', 'concluido'].includes(to)) {
    return 'Use os botões de aprovação e avaliação para avançar nesta etapa.'
  }
  return null
}

function fromNeedsAssignee(ticket: GridTicket): boolean {
  return ticket.status === 'aberto' && !ticket.assignee?.trim()
}
