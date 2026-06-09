import { ClipboardList, Ticket, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ConnectDrawer } from '../connect/ConnectDrawer'
import { ConnectDrawerHeroCard } from '../connect/ConnectDrawerHeroCard'
import { ConnectLoadingSpinner, StatusBadge } from '../connect/ConnectShared'
import { UserAvatar } from '../ui/UserAvatar'
import { gridService } from '../../services/gridService'
import type { GridUserDetail } from '../../types/grid'
import { parseApiError } from '../../utils/parseApiError'

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('pt-BR')
  } catch {
    return value
  }
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-hub-border/30 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-hub-text-muted">{label}</dt>
      <dd className="text-sm font-medium text-hub-navy sm:text-right">{value}</dd>
    </div>
  )
}

function StatKpi({ label, value, variant }: { label: string; value: number; variant?: 'warn' | 'muted' }) {
  const colors =
    variant === 'warn'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : variant === 'muted'
        ? 'border-hub-border/50 bg-hub-bg/60 text-hub-text-muted'
        : 'border-emerald-200 bg-emerald-50 text-emerald-900'

  return (
    <div className={`rounded-xl border px-4 py-3 ${colors}`}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  )
}

export function GridUserDetailDrawer({
  userId,
  open,
  onClose,
}: {
  userId: number | null
  open: boolean
  onClose: () => void
}) {
  const [tab, setTab] = useState<'overview' | 'activity'>('overview')
  const [detail, setDetail] = useState<GridUserDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !userId) {
      setDetail(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    setTab('overview')

    gridService
      .getUser(userId)
      .then(setDetail)
      .catch((err) => setError(parseApiError(err, 'Nao foi possivel carregar os detalhes do usuario.')))
      .finally(() => setLoading(false))
  }, [open, userId])

  return (
    <ConnectDrawer
      open={open}
      onClose={onClose}
      title={detail?.name ?? 'Usuário'}
      subtitle={detail?.role ?? 'Carregando...'}
      width="2xl"
    >
      {loading ? (
        <ConnectLoadingSpinner label="Carregando usuário..." className="min-h-[320px]" />
      ) : error ? (
        <p className="py-12 text-center text-sm text-red-600">{error}</p>
      ) : detail ? (
        <div className="space-y-6">
          <ConnectDrawerHeroCard onBack={onClose}>
            <UserAvatar name={detail.name} size="lg" />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h3 className="text-lg font-bold text-hub-navy">{detail.name}</h3>
              <p className="mt-1 text-sm text-hub-text-muted">{detail.email}</p>
              <p className="mt-2">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  {detail.role}
                </span>
              </p>
              <div className="mt-3">
                <StatusBadge status={detail.status} />
              </div>
            </div>
          </ConnectDrawerHeroCard>

          <div className="flex gap-2 border-b border-hub-border/50">
            <button
              type="button"
              onClick={() => setTab('overview')}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
                tab === 'overview' ? 'border-hub-red text-hub-red' : 'border-transparent text-hub-text-muted hover:text-hub-navy'
              }`}
            >
              Visão geral
            </button>
            <button
              type="button"
              onClick={() => setTab('activity')}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
                tab === 'activity' ? 'border-hub-red text-hub-red' : 'border-transparent text-hub-text-muted hover:text-hub-navy'
              }`}
            >
              Atividade ({detail.activity?.length ?? 0})
            </button>
          </div>

          {tab === 'overview' ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatKpi label="Tarefas" value={detail.stats.tasks_total} />
                <StatKpi label="Em andamento" value={detail.stats.tasks_in_progress} variant={detail.stats.tasks_in_progress > 0 ? 'warn' : undefined} />
                <StatKpi label="Concluídas" value={detail.stats.tasks_completed} />
                <StatKpi label="Chamados" value={detail.stats.tickets_assigned} variant="muted" />
              </div>

              <dl className="surface-inset rounded-2xl border border-hub-border/50 px-4">
                <DetailRow label="ID" value={detail.id} />
                <DetailRow label="E-mail institucional" value={detail.email} />
                <DetailRow label="Telefone" value={detail.phone || '—'} />
                <DetailRow label="CPF" value={detail.cpf || '—'} />
                <DetailRow label="Tipo de usuário" value={detail.role} />
                <DetailRow label="Status" value={<StatusBadge status={detail.status} />} />
                <DetailRow label="Cadastrado em" value={formatDateTime(detail.created_at)} />
                <DetailRow label="Última atualização" value={formatDateTime(detail.updated_at)} />
              </dl>
            </>
          ) : (
            <div className="rounded-2xl border border-hub-border/50">
              {(detail.activity?.length ?? 0) === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-hub-text-muted">
                  Nenhuma tarefa ou chamado atribuído a este usuário.
                </p>
              ) : (
                <ul className="divide-y divide-hub-border/40">
                  {detail.activity.map((row) => (
                    <li key={`${row.type}-${row.id}`} className="flex items-start gap-3 px-4 py-3 text-sm">
                      {row.type === 'task' ? (
                        <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-hub-red" />
                      ) : (
                        <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-hub-navy">
                          {row.code} · {row.title}
                        </p>
                        <p className="text-xs text-hub-text-muted">
                          {row.type === 'task' ? 'Tarefa' : 'Chamado'} · {row.status}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-hub-text-muted">{formatDateTime(row.updated_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="flex items-center justify-center gap-2 py-12 text-sm text-hub-text-muted">
          <User className="h-5 w-5" /> Selecione um usuário
        </p>
      )}
    </ConnectDrawer>
  )
}
