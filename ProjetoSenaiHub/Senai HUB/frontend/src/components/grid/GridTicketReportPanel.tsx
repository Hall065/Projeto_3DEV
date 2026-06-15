import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConnectCard, ConnectLoadingSpinner, FormField, selectClass } from '../connect/ConnectShared'
import { GridPriorityBadge, GridTicketStatusBadge, getTicketStatusLabel } from './GridBadges'
import { intlLocale, normalizeLocale } from '../../i18n'
import { gridService } from '../../services/gridService'
import type { GridTicket, GridTicketReport } from '../../types/grid'

function formatDate(iso: string | undefined | null, locale: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(locale)
}

export function GridTicketReportPanel({ tickets }: { tickets: GridTicket[] }) {
  const { t, i18n } = useTranslation()
  const dateLocale = intlLocale(normalizeLocale(i18n.language))
  const [selectedId, setSelectedId] = useState<number | ''>('')
  const [report, setReport] = useState<GridTicketReport | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedId) {
      setReport(null)
      return
    }
    setLoading(true)
    gridService
      .getTicketReport(Number(selectedId))
      .then(setReport)
      .finally(() => setLoading(false))
  }, [selectedId])

  return (
    <ConnectCard className="mb-6 p-4 sm:p-6">
      <h2 className="mb-1 text-lg font-bold text-hub-navy">{t('gridComponents.reportPanel.title')}</h2>
      <p className="mb-4 text-sm text-hub-text-muted">{t('gridComponents.reportPanel.subtitle')}</p>

      <FormField label={t('gridComponents.reportPanel.ticketField')}>
        <select className={selectClass} value={selectedId} onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">{t('gridComponents.reportPanel.selectPlaceholder')}</option>
          {tickets.map((ticket) => (
            <option key={ticket.id} value={ticket.id}>
              {ticket.code} — {ticket.title}
            </option>
          ))}
        </select>
      </FormField>

      {loading && <ConnectLoadingSpinner label={t('gridComponents.reportPanel.loading')} className="min-h-[200px]" />}

      {report && !loading && (
        <div className="mt-6 space-y-6">
          <div className="flex flex-wrap gap-2">
            <GridPriorityBadge priority={report.ticket.priority} />
            <GridTicketStatusBadge status={report.ticket.status} />
            <span className="text-sm font-medium text-hub-navy">{report.ticket.code}</span>
          </div>

          <section className="grid gap-4 sm:grid-cols-2">
            <InfoBlock title={t('gridComponents.reportPanel.openedBy')} value={report.ticket.requester} />
            <InfoBlock title={t('gridComponents.reportPanel.when')} value={formatDate(report.timeline.opened_at, dateLocale)} />
            <InfoBlock title={t('gridComponents.reportPanel.serviceStart')} value={formatDate(report.timeline.started_at, dateLocale)} />
            <InfoBlock title={t('gridComponents.reportPanel.technicalCompletion')} value={formatDate(report.timeline.completed_at, dateLocale)} />
            <InfoBlock title={t('gridComponents.reportPanel.supervisorApproval')} value={formatDate(report.timeline.approved_at, dateLocale)} />
            <InfoBlock title={t('gridComponents.reportPanel.totalTime')} value={report.timeline.duration_label ?? '—'} />
            <InfoBlock
              title={t('gridComponents.reportPanel.location')}
              value={t('gridComponents.reportPanel.locationValue', {
                room: report.location.room || '—',
                block: report.location.block || '—',
              })}
            />
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-hub-navy">{t('gridComponents.reportPanel.whyTitle')}</h3>
            <p className="rounded-lg bg-white/50 p-3 text-sm text-hub-text">{report.ticket.summary || '—'}</p>
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-hub-navy">{t('gridComponents.reportPanel.whatWasDoneTitle')}</h3>
            <div className="space-y-2">
              {report.tasks.length === 0 ? (
                <p className="text-sm text-hub-text-muted">{t('gridComponents.reportPanel.noLinkedTasks')}</p>
              ) : (
                report.tasks.map((task) => (
                  <div key={task.id} className="rounded-lg border border-hub-border/40 bg-white/40 p-3 text-sm">
                    <p className="font-medium text-hub-navy">
                      {task.code} — {task.title}
                    </p>
                    <p className="text-hub-text-muted">{task.description}</p>
                    <p className="mt-1 text-xs">
                      {t('gridComponents.reportPanel.taskMeta', {
                        assignee: task.assignee || '—',
                        status: task.status_label,
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 font-semibold text-hub-navy">{t('gridComponents.reportPanel.whatWasFixedTitle')}</h3>
              <p className="rounded-lg bg-white/50 p-3 text-sm">{report.ticket.fixed_description || '—'}</p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-hub-navy">{t('gridComponents.reportPanel.considerationsTitle')}</h3>
              <p className="rounded-lg bg-white/50 p-3 text-sm">{report.ticket.considerations || report.ticket.resolution_summary || '—'}</p>
            </div>
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-hub-navy">{t('gridComponents.reportPanel.materialsTitle')}</h3>
            {report.materials.length === 0 ? (
              <p className="text-sm text-hub-text-muted">{t('gridComponents.reportPanel.noMaterials')}</p>
            ) : (
              <ul className="divide-y divide-hub-border/40 rounded-lg border border-hub-border/40">
                {report.materials.map((material, index) => (
                  <li key={index} className="flex justify-between px-3 py-2 text-sm">
                    <span>
                      {material.item} <span className="text-hub-text-muted">({material.task_code})</span>
                    </span>
                    <span className="font-medium">
                      {t('gridComponents.reportPanel.materialLine', {
                        quantity: material.quantity,
                        status: material.status,
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {report.ticket.approved_by ? (
            <section>
              <h3 className="mb-2 font-semibold text-hub-navy">{t('gridComponents.reportPanel.approvalTitle')}</h3>
              <div className="rounded-lg bg-yellow-50/80 p-3 text-sm">
                <p className="font-medium text-yellow-900">
                  {t('gridComponents.reportPanel.approvedBy', { by: report.ticket.approved_by })}
                </p>
                <p className="mt-1 text-hub-text-muted">{report.ticket.approval_notes || t('gridComponents.reportPanel.noApprovalNotes')}</p>
              </div>
            </section>
          ) : null}

          <section>
            <h3 className="mb-2 font-semibold text-hub-navy">{t('gridComponents.reportPanel.evaluationTitle')}</h3>
            {report.ticket.evaluation_rating ? (
              <div className="rounded-lg bg-emerald-50/80 p-3 text-sm">
                <p className="font-semibold text-emerald-800">
                  {t('gridComponents.reportPanel.rating', { rating: report.ticket.evaluation_rating })}
                </p>
                <p className="text-hub-text-muted">{t('gridComponents.reportPanel.evaluatedBy', { by: report.ticket.evaluated_by })}</p>
                <p className="mt-2">{report.ticket.evaluation_notes || t('gridComponents.reportPanel.noEvaluationComments')}</p>
                <p className="mt-1 text-xs text-hub-text-muted">{formatDate(report.ticket.evaluated_at, dateLocale)}</p>
              </div>
            ) : (
              <p className="text-sm text-hub-text-muted">
                {report.ticket.status === 'avaliacao_pendente'
                  ? t('gridComponents.reportPanel.awaitingEvaluation')
                  : report.ticket.status === 'aguardando_aprovacao'
                    ? t('gridComponents.reportPanel.awaitingApproval')
                    : t('gridComponents.reportPanel.notYetEvaluated')}
              </p>
            )}
          </section>

          <p className="text-xs text-hub-text-muted">
            {t('gridComponents.reportPanel.currentStatus', {
              status: getTicketStatusLabel(report.ticket.status),
            })}
          </p>
        </div>
      )}
    </ConnectCard>
  )
}

function InfoBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/40 p-3">
      <p className="text-[10px] font-semibold uppercase text-hub-text-muted">{title}</p>
      <p className="mt-1 text-sm font-medium text-hub-text">{value}</p>
    </div>
  )
}
