import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  ListTodo,
  Wrench,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import mapPlaceholder from '../../assets/map-placeholder.svg'
import {
  ConnectCard,
  ConnectLoadingSpinner,
  ConnectPageHeader,
  KpiCard,
  OutlineButton,
  selectClass,
} from '../../components/connect/ConnectShared'
import { GridPriorityBadge } from '../../components/grid/GridBadges'
import { gridService } from '../../services/gridService'
import type { GridTaskCard } from '../../types/grid'
import { UserAvatar } from '../../components/ui/UserAvatar'

export function GridTaskMapPage() {
  const [tasks, setTasks] = useState<GridTaskCard[]>([])
  const [stats, setStats] = useState({ total: 0, todo: 0, in_progress: 0, done_today: 0, late: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    gridService
      .getMapTasks()
      .then((res) => {
        setTasks(res.tasks)
        setStats(res.stats)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Mapa de tarefas"
        subtitle="Visualize no mapa todas as tarefas em andamento e pendências na unidade."
        actions={
          <div className="flex w-full min-w-0 flex-wrap gap-2 sm:w-auto">
            <select className={`${selectClass} w-full sm:w-auto`}>
              <option>Prioridade: Todos</option>
            </select>
            <select className={`${selectClass} w-full sm:w-auto`}>
              <option>Status: Todos</option>
            </select>
            <OutlineButton>Limpar filtros</OutlineButton>
          </div>
        }
      />

      <ConnectCard className="mb-6 min-w-0 overflow-hidden p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex min-h-[280px] items-center justify-center rounded-xl bg-hub-bg lg:col-span-2 lg:min-h-[360px]">
            {loading ? (
              <ConnectLoadingSpinner label="Carregando mapa..." />
            ) : (
              <img src={mapPlaceholder} alt="Mapa do campus" className="max-h-full max-w-full object-contain opacity-80" />
            )}
          </div>
          <div className="min-w-0">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-hub-navy">Tarefas no mapa</h2>
              <span className="text-sm text-hub-text-muted">{tasks.length} tarefas</span>
            </div>
            {loading ? (
              <ConnectLoadingSpinner label="Carregando tarefas..." className="min-h-[280px]" />
            ) : (
              <ul className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                {tasks.map((task) => (
                  <li key={task.id} className="rounded-xl border border-hub-border/60 p-3">
                    <div className="mb-2 flex items-start gap-2">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-hub-navy">{task.title}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <UserAvatar name={task.assignee ?? '—'} size="sm" />
                          <span className="text-xs text-hub-text-muted">{task.assignee ?? 'Sem responsável'}</span>
                        </div>
                        <p className="mt-1 text-xs text-hub-text-muted">
                          Sala {task.room} · Bloco {task.block}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                            A fazer
                          </span>
                          <GridPriorityBadge priority={task.priority} />
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/grid/tarefas" className="mt-4 block text-center text-sm font-medium text-hub-red hover:underline">
              Ver todas as tarefas →
            </Link>
          </div>
        </div>
      </ConnectCard>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard icon={ClipboardList} label="Total de tarefas" value={stats.total} />
        <KpiCard icon={ListTodo} label="A fazer" value={`${stats.todo} (50%)`} />
        <KpiCard icon={Wrench} label="Em andamento" value={`${stats.in_progress} (38%)`} />
        <KpiCard icon={CheckCircle2} label="Concluídas hoje" value={`${stats.done_today} (12%)`} />
        <KpiCard icon={AlertTriangle} label="Atrasadas" value={stats.late} />
      </div>
    </div>
  )
}
