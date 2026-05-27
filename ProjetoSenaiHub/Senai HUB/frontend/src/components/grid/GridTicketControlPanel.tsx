import { Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  ConnectCard,
  ConnectLoadingSpinner,
  FormField,
  inputClass,
  OutlineButton,
  PrimaryButton,
  selectClass,
} from '../connect/ConnectShared'
import { GridPriorityBadge, GridTicketStatusBadge } from './GridBadges'
import { GridTicketWorkflowStepper } from './GridTicketWorkflowStepper'
import { gridService } from '../../services/gridService'
import { appendStageNote } from '../../utils/gridTicketWorkflow'
import type { GridTicket, GridTicketReport } from '../../types/grid'

type StageFormProps = {
  ticket: GridTicket
  report: GridTicketReport | null
  technicians: string[]
  actorName: string
  saving: boolean
  onRefresh: () => Promise<void>
  onSavedNote?: () => void
}

export function GridTicketControlPanel({
  ticket,
  report,
  technicians,
  actorName,
  saving,
  onRefresh,
}: StageFormProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-hub-red">{ticket.code}</p>
          <h2 className="mt-1 text-lg font-bold text-hub-navy">{ticket.title}</h2>
          <p className="mt-1 text-sm text-hub-text-muted">
            {ticket.requester} · Sala {ticket.room || '—'} / Bloco {ticket.block || '—'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <GridPriorityBadge priority={ticket.priority} />
          <GridTicketStatusBadge status={ticket.status} />
        </div>
      </div>

      <ConnectCard className="!border-hub-border/40 !bg-white/60 p-4 sm:p-5">
        <GridTicketWorkflowStepper currentStatus={ticket.status} />
      </ConnectCard>

      <StageForm ticket={ticket} report={report} technicians={technicians} actorName={actorName} saving={saving} onRefresh={onRefresh} />

      <WorkflowNotesHistory ticket={ticket} />
    </div>
  )
}

function StageForm({ ticket, report, technicians, actorName, saving, onRefresh }: StageFormProps) {
  const [stageNote, setStageNote] = useState('')
  const [assignee, setAssignee] = useState(ticket.assignee ?? '')
  const [fixedDescription, setFixedDescription] = useState(ticket.fixed_description ?? '')
  const [resolutionSummary, setResolutionSummary] = useState(ticket.resolution_summary ?? '')
  const [approvalNotes, setApprovalNotes] = useState(ticket.approval_notes ?? '')
  const [rating, setRating] = useState(5)
  const [evaluationNotes, setEvaluationNotes] = useState('')
  const [localSaving, setLocalSaving] = useState(false)

  const primaryTask = report?.tasks?.[0] ?? null
  const busy = saving || localSaving

  useEffect(() => {
    setAssignee(ticket.assignee ?? '')
    setFixedDescription(ticket.fixed_description ?? '')
    setResolutionSummary(ticket.resolution_summary ?? '')
    setApprovalNotes(ticket.approval_notes ?? '')
    setStageNote('')
    setEvaluationNotes('')
    setRating(5)
  }, [ticket.id, ticket.status, ticket.assignee, ticket.fixed_description, ticket.resolution_summary, ticket.approval_notes])

  const run = async (fn: () => Promise<void>) => {
    setLocalSaving(true)
    try {
      await fn()
      setStageNote('')
      await onRefresh()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
      const msg =
        err?.response?.data?.errors?.status?.[0] ??
        err?.response?.data?.message ??
        'Não foi possível salvar. Verifique os dados e tente novamente.'
      window.alert(msg)
    } finally {
      setLocalSaving(false)
    }
  }

  const saveNoteOnly = async (stageLabel: string) => {
    if (!stageNote.trim()) return
    await run(async () => {
      await gridService.updateTicket(ticket.id, {
        considerations: appendStageNote(ticket.considerations, stageLabel, stageNote),
      })
    })
  }

  const noteField = (stageLabel: string) => (
    <FormField label="Observações desta etapa">
      <textarea
        className={`${inputClass} min-h-[88px] py-2`}
        value={stageNote}
        onChange={(e) => setStageNote(e.target.value)}
        placeholder={`Registre o que ocorreu em "${stageLabel}"...`}
      />
      {stageNote.trim() ? (
        <div className="mt-2">
          <OutlineButton disabled={busy} onClick={() => void saveNoteOnly(stageLabel)}>
            Salvar observação sem avançar
          </OutlineButton>
        </div>
      ) : null}
    </FormField>
  )

  if (ticket.status === 'aberto') {
    return (
      <ConnectCard className="space-y-4 p-4 sm:p-6">
        <StageHeader title="Atribuir técnico" subtitle="O chamado passará para Pendente após salvar." />
        <FormField label="Técnico responsável" required>
          <select className={selectClass} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">Selecione...</option>
            {technicians.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </FormField>
        {noteField('Aberto')}
        <PrimaryButton
          disabled={busy || !assignee.trim()}
          onClick={() =>
            void run(async () => {
              await gridService.updateTicket(ticket.id, {
                assignee: assignee.trim(),
                considerations: appendStageNote(ticket.considerations, 'Aberto', stageNote),
              })
            })
          }
        >
          {busy ? 'Salvando...' : 'Atribuir técnico'}
        </PrimaryButton>
      </ConnectCard>
    )
  }

  if (ticket.status === 'pendente') {
    return (
      <ConnectCard className="space-y-4 p-4 sm:p-6">
        <StageHeader
          title="Iniciar atendimento"
          subtitle={`Técnico: ${ticket.assignee || '—'}. Será criada uma tarefa em andamento.`}
        />
        {noteField('Pendente')}
        <PrimaryButton
          disabled={busy}
          onClick={() =>
            void run(async () => {
              await gridService.updateTicket(ticket.id, {
                status: 'em_atendimento',
                considerations: appendStageNote(ticket.considerations, 'Pendente', stageNote),
              })
            })
          }
        >
          {busy ? 'Iniciando...' : 'Iniciar atendimento'}
        </PrimaryButton>
      </ConnectCard>
    )
  }

  if (ticket.status === 'em_atendimento') {
    return (
      <ConnectCard className="space-y-4 p-4 sm:p-6">
        <StageHeader
          title="Execução do serviço"
          subtitle={
            primaryTask
              ? `Tarefa vinculada: ${primaryTask.code} (${primaryTask.status_label})`
              : 'Nenhuma tarefa vinculada encontrada.'
          }
        />
        <FormField label="O que foi consertado / executado">
          <textarea
            className={`${inputClass} min-h-[88px] py-2`}
            value={fixedDescription}
            onChange={(e) => setFixedDescription(e.target.value)}
            placeholder="Descreva o serviço realizado..."
          />
        </FormField>
        {noteField('Em atendimento')}
        <PrimaryButton
          disabled={busy || !primaryTask}
          onClick={() =>
            void run(async () => {
              const considerations = appendStageNote(ticket.considerations, 'Em atendimento', stageNote)
              await gridService.updateTicket(ticket.id, {
                fixed_description: fixedDescription.trim() || undefined,
                considerations,
              })
              await gridService.updateTask(primaryTask!.id, { column: 'concluidas' })
            })
          }
        >
          {busy ? 'Concluindo...' : 'Concluir tarefa e enviar para aprovação'}
        </PrimaryButton>
      </ConnectCard>
    )
  }

  if (ticket.status === 'aguardando_aprovacao') {
    return (
      <ConnectCard className="space-y-4 p-4 sm:p-6">
        <StageHeader title="Aprovação do chefe de manutenção" subtitle="Confirme se o serviço foi executado corretamente." />
        <FormField label="Resumo da verificação">
          <textarea
            className={`${inputClass} min-h-[72px] py-2`}
            value={resolutionSummary}
            onChange={(e) => setResolutionSummary(e.target.value)}
            placeholder="O que foi verificado..."
          />
        </FormField>
        <FormField label="Observações da aprovação">
          <textarea
            className={`${inputClass} min-h-[72px] py-2`}
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            placeholder="Comentários do chefe..."
          />
        </FormField>
        {noteField('Aguardando aprovação')}
        <PrimaryButton
          disabled={busy}
          onClick={() =>
            void run(async () => {
              await gridService.approveTicketService(ticket.id, {
                approved_by: actorName,
                notes: approvalNotes.trim() || stageNote.trim() || undefined,
                resolution_summary: resolutionSummary.trim() || undefined,
              })
              if (stageNote.trim() && !approvalNotes.trim()) {
                await gridService.updateTicket(ticket.id, {
                  considerations: appendStageNote(ticket.considerations, 'Aprovação', stageNote),
                })
              }
            })
          }
        >
          {busy ? 'Aprovando...' : 'Aprovar serviço'}
        </PrimaryButton>
      </ConnectCard>
    )
  }

  if (ticket.status === 'avaliacao_pendente') {
    return (
      <ConnectCard className="space-y-4 p-4 sm:p-6">
        <StageHeader title="Avaliação do solicitante" subtitle={`Solicitante: ${ticket.requester}`} />
        <FormField label="Nota (1 a 5)" required>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className={`rounded-lg p-2 transition-colors ${rating >= n ? 'text-amber-500' : 'text-hub-border'}`}
                aria-label={`Nota ${n}`}
              >
                <Star className={`h-6 w-6 ${rating >= n ? 'fill-current' : ''}`} />
              </button>
            ))}
          </div>
        </FormField>
        <FormField label="Comentários da avaliação">
          <textarea
            className={`${inputClass} min-h-[72px] py-2`}
            value={evaluationNotes}
            onChange={(e) => setEvaluationNotes(e.target.value)}
            placeholder="Comentários do solicitante sobre o atendimento..."
          />
        </FormField>
        {noteField('Avaliação')}
        <PrimaryButton
          disabled={busy}
          onClick={() =>
            void run(async () => {
              await gridService.evaluateTicket(ticket.id, {
                rating,
                notes: evaluationNotes.trim() || stageNote.trim() || undefined,
                evaluated_by: ticket.requester,
              })
            })
          }
        >
          {busy ? 'Finalizando...' : 'Finalizar chamado'}
        </PrimaryButton>
      </ConnectCard>
    )
  }

  return (
    <ConnectCard className="space-y-4 p-4 sm:p-6">
      <StageHeader title="Chamado finalizado" subtitle="Nenhuma ação pendente. Consulte o histórico abaixo." />
      {ticket.evaluation_rating ? (
        <p className="text-sm text-hub-text">
          Avaliação: <strong>{ticket.evaluation_rating}/5</strong> por {ticket.evaluated_by}
        </p>
      ) : null}
      {ticket.approved_by ? (
        <p className="text-sm text-hub-text-muted">
          Aprovado por {ticket.approved_by}
          {ticket.approved_at ? ` em ${new Date(ticket.approved_at).toLocaleString('pt-BR')}` : ''}
        </p>
      ) : null}
    </ConnectCard>
  )
}

function StageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-hub-navy">{title}</h3>
      <p className="mt-1 text-sm text-hub-text-muted">{subtitle}</p>
    </div>
  )
}

function WorkflowNotesHistory({ ticket }: { ticket: GridTicket }) {
  const blocks = [
    { label: 'Histórico geral', value: ticket.considerations },
    { label: 'O que foi consertado', value: ticket.fixed_description },
    { label: 'Resumo da resolução', value: ticket.resolution_summary },
    { label: 'Aprovação (chefe)', value: ticket.approval_notes },
    { label: 'Avaliação (solicitante)', value: ticket.evaluation_notes },
  ].filter((b) => b.value?.trim())

  if (blocks.length === 0) {
    return (
      <p className="text-sm text-hub-text-muted">Nenhuma observação registrada ainda.</p>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-hub-navy">Histórico e observações</h3>
      {blocks.map((block) => (
        <div key={block.label} className="rounded-xl border border-hub-border/40 bg-white/50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-hub-text-muted">{block.label}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-hub-text">{block.value}</p>
        </div>
      ))}
    </div>
  )
}

export function GridTicketControlPanelSkeleton() {
  return <ConnectLoadingSpinner label="Carregando chamado..." className="min-h-[320px]" />
}
