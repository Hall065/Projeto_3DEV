import { AlertTriangle, CheckCircle2, ClipboardList, ListTodo, MapPin, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import mapPlaceholder from '../../assets/map-placeholder.svg'
import { KpiCard, KpiCardSkeleton } from '../../components/connect/ConnectKpiCard'
import {
  ConnectCard,
  ConnectLoadingSpinner,
  ConnectPageHeader,
} from '../../components/connect/ConnectShared'
import { GridPriorityBadge, GridTicketStatusBadge } from '../../components/grid/GridBadges'
import { gridService } from '../../services/gridService'
import type { GridTaskCard, GridTicket } from '../../types/grid'
import { UserAvatar } from '../../components/ui/UserAvatar'

export function GridTaskMapPage() {
  const [tasks, setTasks] = useState<GridTaskCard[]>([])
  const [tickets, setTickets] = useState<GridTicket[]>([])
  const [stats, setStats] = useState({ total: 0, todo: 0, in_progress: 0, done_today: 0, late: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    gridService
      .getMapData()
      .then((res) => {
        setTasks(res.tasks)
        setTickets(res.tickets)
        setStats(res.stats)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Mapa de tarefas"
        subtitle="O mapa interativo será disponibilizado em breve. Abaixo, a lista de atendimentos ativos por local."
      />

      <ConnectCard className="mb-6 min-w-0 overflow-hidden p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="glass-panel-solid relative flex min-h-[240px] items-center justify-center rounded-xl lg:col-span-1 lg:min-h-[320px]">
            {loading ? (
              <ConnectLoadingSpinner label="Carregando..." />
            ) : (
              <>
                <img src={mapPlaceholder} alt="" className="max-h-full max-w-full object-contain opacity-40" aria-hidden />
                <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm font-medium text-hub-text-muted">
                  Mapa do campus em desenvolvimento
                </p>
              </>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold text-hub-navy">
                <MapPin className="h-4 w-4 text-hub-red" />
                Atendimentos por local (lista)
              </h2>
              <span className="text-sm text-hub-text-muted">{tasks.length + tickets.length} registros</span>
            </div>

            {loading ? (
              <ConnectLoadingSpinner label="Carregando lista..." className="min-h-[280px]" />
            ) : (
              <ul className="scrollbar-glass-inset max-h-[400px] space-y-3 overflow-y-auto pr-1">
                {tasks.map((task) => (
                  <li key={`task-${task.id}`} className="glass-panel-solid rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-hub-red">{task.code}</p>
                        <p className="text-sm font-semibold text-hub-navy">{task.title}</p>
                        <p className="text-xs text-hub-text-muted">
                          Sala {task.room || '—'} · Bloco {task.block || '—'}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <UserAvatar name={task.assignee ?? '—'} size="sm" />
                          <span className="text-xs">{task.assignee ?? 'Sem responsável'}</span>
                          <GridPriorityBadge priority={task.priority} />
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">{task.status_label}</span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
                {tickets.map((ticket) => (
                  <li key={`ticket-${ticket.id}`} className="glass-panel-solid rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-hub-red">{ticket.code}</p>
                        <p className="text-sm font-semibold text-hub-navy">{ticket.title}</p>
                        <p className="text-xs text-hub-text-muted">
                          Sala {ticket.room || '—'} · Bloco {ticket.block || '—'}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <GridTicketStatusBadge status={ticket.status} />
                          <GridPriorityBadge priority={ticket.priority} />
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <Link to="/grid/tarefas" className="font-medium text-hub-red hover:underline">
                Ver tarefas →
              </Link>
              <Link to="/grid/chamados" className="font-medium text-hub-red hover:underline">
                Ver chamados →
              </Link>
            </div>
          </div>
        </div>
      </ConnectCard>

      <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <KpiCardSkeleton key={i} />)
        ) : (
          <>
            <KpiCard icon={ClipboardList} label="Total de tarefas" value={stats.total} variant="blue" to="/grid/tarefas" />
            <KpiCard icon={ListTodo} label="A fazer" value={stats.todo} variant="violet" />
            <KpiCard icon={Wrench} label="Em andamento" value={stats.in_progress} variant="coral" />
            <KpiCard icon={CheckCircle2} label="Concluídas" value={stats.done_today} variant="green" />
            <KpiCard icon={AlertTriangle} label="Atrasadas" value={stats.late} variant="senai" />
          </>
        )}
      </div>
    </div>
  )
}
