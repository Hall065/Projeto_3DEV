import { useEffect, useState } from 'react'
import { ConnectCard, ConnectLoadingSpinner, FormField, selectClass } from '../connect/ConnectShared'
import { GridPriorityBadge, GridTicketStatusBadge, ticketStatusLabels } from './GridBadges'
import { gridService } from '../../services/gridService'
import type { GridTicket, GridTicketReport } from '../../types/grid'

function formatDate(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR')
}

export function GridTicketReportPanel({ tickets }: { tickets: GridTicket[] }) {
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
      <h2 className="mb-1 text-lg font-bold text-hub-navy">Relatório de atendimento específico</h2>
      <p className="mb-4 text-sm text-hub-text-muted">
        Selecione um chamado para ver o histórico completo do atendimento.
      </p>

      <FormField label="Chamado">
        <select className={selectClass} value={selectedId} onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">Selecione um chamado...</option>
          {tickets.map((t) => (
            <option key={t.id} value={t.id}>
              {t.code} — {t.title}
            </option>
          ))}
        </select>
      </FormField>

      {loading && <ConnectLoadingSpinner label="Carregando relatório..." className="min-h-[200px]" />}

      {report && !loading && (
        <div className="mt-6 space-y-6">
          <div className="flex flex-wrap gap-2">
            <GridPriorityBadge priority={report.ticket.priority} />
            <GridTicketStatusBadge status={report.ticket.status} />
            <span className="text-sm font-medium text-hub-navy">{report.ticket.code}</span>
          </div>

          <section className="grid gap-4 sm:grid-cols-2">
            <InfoBlock title="Aberto por" value={report.ticket.requester} />
            <InfoBlock title="Quando" value={formatDate(report.timeline.opened_at)} />
            <InfoBlock title="Início do atendimento" value={formatDate(report.timeline.started_at)} />
            <InfoBlock title="Conclusão técnica" value={formatDate(report.timeline.completed_at)} />
            <InfoBlock title="Aprovação chefe" value={formatDate(report.timeline.approved_at)} />
            <InfoBlock title="Tempo total" value={report.timeline.duration_label ?? '—'} />
            <InfoBlock title="Local" value={`Sala ${report.location.room || '—'} / Bloco ${report.location.block || '—'}`} />
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-hub-navy">Por quê (solicitação)</h3>
            <p className="rounded-lg bg-white/50 p-3 text-sm text-hub-text">{report.ticket.summary || '—'}</p>
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-hub-navy">O que foi feito</h3>
            <div className="space-y-2">
              {report.tasks.length === 0 ? (
                <p className="text-sm text-hub-text-muted">Nenhuma tarefa vinculada.</p>
              ) : (
                report.tasks.map((task) => (
                  <div key={task.id} className="rounded-lg border border-hub-border/40 bg-white/40 p-3 text-sm">
                    <p className="font-medium text-hub-navy">
                      {task.code} — {task.title}
                    </p>
                    <p className="text-hub-text-muted">{task.description}</p>
                    <p className="mt-1 text-xs">
                      Responsável: {task.assignee || '—'} · Status: {task.status_label}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 font-semibold text-hub-navy">O que foi consertado</h3>
              <p className="rounded-lg bg-white/50 p-3 text-sm">{report.ticket.fixed_description || '—'}</p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-hub-navy">Considerações</h3>
              <p className="rounded-lg bg-white/50 p-3 text-sm">{report.ticket.considerations || report.ticket.resolution_summary || '—'}</p>
            </div>
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-hub-navy">Materiais utilizados</h3>
            {report.materials.length === 0 ? (
              <p className="text-sm text-hub-text-muted">Nenhum material registrado.</p>
            ) : (
              <ul className="divide-y divide-hub-border/40 rounded-lg border border-hub-border/40">
                {report.materials.map((m, i) => (
                  <li key={i} className="flex justify-between px-3 py-2 text-sm">
                    <span>
                      {m.item} <span className="text-hub-text-muted">({m.task_code})</span>
                    </span>
                    <span className="font-medium">
                      {m.quantity} un · {m.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {report.ticket.approved_by ? (
            <section>
              <h3 className="mb-2 font-semibold text-hub-navy">Aprovação do chefe de manutenção</h3>
              <div className="rounded-lg bg-yellow-50/80 p-3 text-sm">
                <p className="font-medium text-yellow-900">Aprovado por: {report.ticket.approved_by}</p>
                <p className="mt-1 text-hub-text-muted">{report.ticket.approval_notes || 'Sem observações.'}</p>
              </div>
            </section>
          ) : null}

          <section>
            <h3 className="mb-2 font-semibold text-hub-navy">Avaliação do solicitante</h3>
            {report.ticket.evaluation_rating ? (
              <div className="rounded-lg bg-emerald-50/80 p-3 text-sm">
                <p className="font-semibold text-emerald-800">Nota: {report.ticket.evaluation_rating}/5</p>
                <p className="text-hub-text-muted">Por: {report.ticket.evaluated_by}</p>
                <p className="mt-2">{report.ticket.evaluation_notes || 'Sem comentários.'}</p>
                <p className="mt-1 text-xs text-hub-text-muted">{formatDate(report.ticket.evaluated_at)}</p>
              </div>
            ) : (
              <p className="text-sm text-hub-text-muted">
                {report.ticket.status === 'avaliacao_pendente'
                  ? 'Aguardando avaliação do solicitante.'
                  : report.ticket.status === 'aguardando_aprovacao'
                    ? 'Aguardando aprovação do chefe de manutenção.'
                    : 'Ainda não avaliado.'}
              </p>
            )}
          </section>

          <p className="text-xs text-hub-text-muted">
            Status atual: {ticketStatusLabels[report.ticket.status]}
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
