import { Star } from 'lucide-react'

import { useEffect, useState } from 'react'

import { useTranslation } from 'react-i18next'

import {

  ConnectCard,

  ConnectLoadingSpinner,

  FormField,

  inputClass,

  OutlineButton,

  PrimaryButton,

  selectClass,

} from '../connect/ConnectShared'

import { GridTicketAttachmentsPanel } from './GridTicketAttachmentsPanel'

import { GridPriorityBadge, GridTicketStatusBadge } from './GridBadges'

import { GridTicketWorkflowStepper } from './GridTicketWorkflowStepper'

import { gridService } from '../../services/gridService'

import { appendStageNote } from '../../utils/gridTicketWorkflow'

import { useCrudToast } from '../../hooks/useCrudToast'

import { intlLocale, normalizeLocale } from '../../i18n'

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

  const { t } = useTranslation()



  return (

    <div className="space-y-6">

      <div className="flex flex-wrap items-start justify-between gap-3">

        <div className="min-w-0">

          <p className="text-xs font-semibold uppercase tracking-wide text-hub-red">{ticket.code}</p>

          <h2 className="mt-1 text-lg font-bold text-hub-navy">{ticket.title}</h2>

          <p className="mt-1 text-sm text-hub-text-muted">

            {ticket.requester} · {t('grid.common.room')} {ticket.room || '—'} / {t('grid.common.block')}{' '}

            {ticket.block || '—'}

          </p>

        </div>

        <div className="flex flex-wrap gap-2">

          <GridPriorityBadge priority={ticket.priority} />

          <GridTicketStatusBadge status={ticket.status} />

        </div>

      </div>



      <ConnectCard className="surface-inset !border-hub-border/40 p-4 sm:p-5">

        <GridTicketWorkflowStepper currentStatus={ticket.status} />

      </ConnectCard>



      <StageForm ticket={ticket} report={report} technicians={technicians} actorName={actorName} saving={saving} onRefresh={onRefresh} />



      <ConnectCard className="surface-inset !border-hub-border/40 p-4 sm:p-5">

        <GridTicketAttachmentsPanel

          ticketId={ticket.id}

          attachments={ticket.attachments ?? []}

          onAttachmentsChange={() => {

            void onRefresh()

          }}

        />

      </ConnectCard>



      <WorkflowNotesHistory ticket={ticket} />

    </div>

  )

}



function StageForm({ ticket, report, technicians, actorName, saving, onRefresh }: StageFormProps) {

  const { t, i18n } = useTranslation()

  const locale = intlLocale(normalizeLocale(i18n.language))

  const crudToast = useCrudToast()

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

  const stageLabels = {
    aberto: t('grid.ticketControlPanel.stages.aberto'),
    pendente: t('grid.ticketControlPanel.stages.pendente'),
    em_atendimento: t('grid.ticketControlPanel.stages.em_atendimento'),
    aguardando_aprovacao: t('grid.ticketControlPanel.stages.aguardando_aprovacao'),
    avaliacao: t('grid.ticketControlPanel.stages.avaliacao'),
    aprovacao: t('grid.ticketControlPanel.stages.aprovacao'),
  } as const

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

      crudToast.notifySaved(true)

      await onRefresh()

    } catch (e: unknown) {

      crudToast.notifyError(e, t('gridComponents.ticketControlPanel.saveError'))

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

    <FormField label={t('gridComponents.ticketControlPanel.stageNotes')}>

      <textarea

        className={`${inputClass} min-h-[88px] py-2`}

        value={stageNote}

        onChange={(e) => setStageNote(e.target.value)}

        placeholder={t('gridComponents.ticketControlPanel.stageNotesPlaceholder', { stage: stageLabel })}

      />

      {stageNote.trim() ? (

        <div className="mt-2">

          <OutlineButton disabled={busy} onClick={() => void saveNoteOnly(stageLabel)}>

            {t('gridComponents.ticketControlPanel.saveNoteOnly')}

          </OutlineButton>

        </div>

      ) : null}

    </FormField>

  )



  if (ticket.status === 'aberto') {

    return (

      <ConnectCard className="space-y-4 p-4 sm:p-6">

        <StageHeader

          title={t('gridComponents.ticketControlPanel.assignTitle')}

          subtitle={t('gridComponents.ticketControlPanel.assignSubtitle')}

        />

        <FormField label={t('gridComponents.createTaskFromTicket.assignee')} required>

          <select className={selectClass} value={assignee} onChange={(e) => setAssignee(e.target.value)}>

            <option value="">{t('gridComponents.ticketControlPanel.selectTechnician')}</option>

            {technicians.map((name) => (

              <option key={name} value={name}>

                {name}

              </option>

            ))}

          </select>

        </FormField>

        {noteField(stageLabels.aberto)}

        <PrimaryButton

          disabled={busy || !assignee.trim()}

          onClick={() =>

            void run(async () => {

              await gridService.updateTicket(ticket.id, {

                assignee: assignee.trim(),

                considerations: appendStageNote(ticket.considerations, stageLabels.aberto, stageNote),

              })

            })

          }

        >

          {busy ? t('connect.common.saving') : t('gridComponents.ticketControlPanel.assignTechnician')}

        </PrimaryButton>

      </ConnectCard>

    )

  }



  if (ticket.status === 'pendente') {

    return (

      <ConnectCard className="space-y-4 p-4 sm:p-6">

        <StageHeader

          title={t('gridComponents.ticketControlPanel.startTitle')}

          subtitle={t('gridComponents.ticketControlPanel.startSubtitle', {

            technician: ticket.assignee || '—',

          })}

        />

        {noteField(stageLabels.pendente)}

        <PrimaryButton

          disabled={busy}

          onClick={() =>

            void run(async () => {

              await gridService.updateTicket(ticket.id, {

                status: 'em_atendimento',

                considerations: appendStageNote(ticket.considerations, stageLabels.pendente, stageNote),

              })

            })

          }

        >

          {busy ? t('gridComponents.ticketControlPanel.starting') : t('gridComponents.ticketControlPanel.startService')}

        </PrimaryButton>

      </ConnectCard>

    )

  }



  if (ticket.status === 'em_atendimento') {

    return (

      <ConnectCard className="space-y-4 p-4 sm:p-6">

        <StageHeader

          title={t('gridComponents.ticketControlPanel.executionTitle')}

          subtitle={

            primaryTask

              ? t('gridComponents.ticketControlPanel.linkedTask', {

                  code: primaryTask.code,

                  status: primaryTask.status_label,

                })

              : t('gridComponents.ticketControlPanel.noLinkedTask')

          }

        />

        <FormField label={t('gridComponents.ticketControlPanel.fixedDescription')}>

          <textarea

            className={`${inputClass} min-h-[88px] py-2`}

            value={fixedDescription}

            onChange={(e) => setFixedDescription(e.target.value)}

            placeholder={t('gridComponents.ticketControlPanel.fixedPlaceholder')}

          />

        </FormField>

        {noteField(stageLabels.em_atendimento)}

        <PrimaryButton

          disabled={busy || !primaryTask}

          onClick={() =>

            void run(async () => {

              const considerations = appendStageNote(ticket.considerations, stageLabels.em_atendimento, stageNote)

              await gridService.updateTicket(ticket.id, {

                fixed_description: fixedDescription.trim() || undefined,

                considerations,

              })

              await gridService.updateTask(primaryTask!.id, { column: 'concluidas' })

            })

          }

        >

          {busy

            ? t('gridComponents.ticketControlPanel.completing')

            : t('gridComponents.ticketControlPanel.completeAndApprove')}

        </PrimaryButton>

      </ConnectCard>

    )

  }



  if (ticket.status === 'aguardando_aprovacao') {

    return (

      <ConnectCard className="space-y-4 p-4 sm:p-6">

        <StageHeader

          title={t('gridComponents.ticketControlPanel.approvalTitle')}

          subtitle={t('gridComponents.ticketControlPanel.approvalSubtitle')}

        />

        <FormField label={t('gridComponents.ticketControlPanel.verificationSummary')}>

          <textarea

            className={`${inputClass} min-h-[72px] py-2`}

            value={resolutionSummary}

            onChange={(e) => setResolutionSummary(e.target.value)}

            placeholder={t('gridComponents.ticketControlPanel.verificationPlaceholder')}

          />

        </FormField>

        <FormField label={t('gridComponents.ticketControlPanel.approvalNotes')}>

          <textarea

            className={`${inputClass} min-h-[72px] py-2`}

            value={approvalNotes}

            onChange={(e) => setApprovalNotes(e.target.value)}

            placeholder={t('gridComponents.ticketControlPanel.approvalPlaceholder')}

          />

        </FormField>

        {noteField(stageLabels.aguardando_aprovacao)}

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

                  considerations: appendStageNote(ticket.considerations, stageLabels.aprovacao, stageNote),

                })

              }

            })

          }

        >

          {busy ? t('gridComponents.ticketControlPanel.approving') : t('gridComponents.ticketControlPanel.approveService')}

        </PrimaryButton>

      </ConnectCard>

    )

  }



  if (ticket.status === 'avaliacao_pendente') {

    return (

      <ConnectCard className="space-y-4 p-4 sm:p-6">

        <StageHeader

          title={t('gridComponents.ticketControlPanel.evaluationTitle')}

          subtitle={t('gridComponents.ticketControlPanel.evaluationSubtitle', { requester: ticket.requester })}

        />

        <FormField label={t('gridComponents.evaluateTicket.rating')} required>

          <div className="flex gap-2">

            {[1, 2, 3, 4, 5].map((n) => (

              <button

                key={n}

                type="button"

                onClick={() => setRating(n)}

                className={`rounded-lg p-2 transition-colors ${rating >= n ? 'text-amber-500' : 'text-hub-border'}`}

                aria-label={t('gridComponents.evaluateTicket.ratingAria', { n })}

              >

                <Star className={`h-6 w-6 ${rating >= n ? 'fill-current' : ''}`} />

              </button>

            ))}

          </div>

        </FormField>

        <FormField label={t('gridComponents.ticketControlPanel.evaluationComments')}>

          <textarea

            className={`${inputClass} min-h-[72px] py-2`}

            value={evaluationNotes}

            onChange={(e) => setEvaluationNotes(e.target.value)}

            placeholder={t('gridComponents.ticketControlPanel.evaluationPlaceholder')}

          />

        </FormField>

        {noteField(stageLabels.avaliacao)}

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

          {busy ? t('gridComponents.ticketControlPanel.finishing') : t('gridComponents.ticketControlPanel.finishTicket')}

        </PrimaryButton>

      </ConnectCard>

    )

  }



  return (

    <ConnectCard className="space-y-4 p-4 sm:p-6">

      <StageHeader

        title={t('gridComponents.ticketControlPanel.finishedTitle')}

        subtitle={t('gridComponents.ticketControlPanel.finishedSubtitle')}

      />

      {ticket.evaluation_rating ? (

        <p className="text-sm text-hub-text">

          {t('gridComponents.ticketControlPanel.evaluationResult', {

            rating: ticket.evaluation_rating,

            by: ticket.evaluated_by,

          })}

        </p>

      ) : null}

      {ticket.approved_by ? (

        <p className="text-sm text-hub-text-muted">

          {t('gridComponents.ticketControlPanel.approvedBy', {

            by: ticket.approved_by,

            at: ticket.approved_at

              ? t('gridComponents.ticketControlPanel.approvedAt', {

                  date: new Date(ticket.approved_at).toLocaleString(locale),

                })

              : '',

          })}

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

  const { t } = useTranslation()



  const blocks = [

    { label: t('gridComponents.ticketControlPanel.historyGeneral'), value: ticket.considerations },

    { label: t('gridComponents.ticketControlPanel.historyFixed'), value: ticket.fixed_description },

    { label: t('gridComponents.ticketControlPanel.historyResolution'), value: ticket.resolution_summary },

    { label: t('gridComponents.ticketControlPanel.historyApproval'), value: ticket.approval_notes },

    { label: t('gridComponents.ticketControlPanel.historyEvaluation'), value: ticket.evaluation_notes },

  ].filter((b) => b.value?.trim())



  if (blocks.length === 0) {

    return <p className="text-sm text-hub-text-muted">{t('gridComponents.ticketControlPanel.noNotes')}</p>

  }



  return (

    <div className="space-y-3">

      <h3 className="text-sm font-semibold text-hub-navy">{t('gridComponents.ticketControlPanel.historyTitle')}</h3>

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

  const { t } = useTranslation()

  return <ConnectLoadingSpinner label={t('gridComponents.ticketControlPanel.loading')} className="min-h-[320px]" />

}


