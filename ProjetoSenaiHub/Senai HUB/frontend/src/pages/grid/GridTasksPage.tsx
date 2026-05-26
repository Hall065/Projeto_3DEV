import { CheckCircle2, Filter, ListTodo, Plus, UserX, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  ConnectCard,
  ConnectLoadingSpinner,
  ConnectPageHeader,
  inputClass,
  KpiCard,
  OutlineButton,
  selectClass,
} from '../../components/connect/ConnectShared'
import { GridPriorityBadge } from '../../components/grid/GridBadges'
import { gridService } from '../../services/gridService'
import type { GridTaskCard, GridTaskColumn } from '../../types/grid'
import { UserAvatar } from '../../components/ui/UserAvatar'

const columns: { key: GridTaskColumn; label: string; dot: string; headerBg: string; count: number }[] = [
  { key: 'a_fazer', label: 'A fazer', dot: 'bg-hub-navy', headerBg: 'bg-hub-navy/10', count: 18 },
  { key: 'em_andamento', label: 'Em andamento', dot: 'bg-amber-500', headerBg: 'bg-amber-50', count: 12 },
  { key: 'concluidas', label: 'Concluídas', dot: 'bg-emerald-500', headerBg: 'bg-emerald-50', count: 46 },
]

function TaskCard({ task }: { task: GridTaskCard }) {
  const statusClass =
    task.column === 'concluidas'
      ? 'bg-emerald-500 text-white border-emerald-500'
      : task.column === 'em_andamento'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-hub-navy/25 bg-hub-navy/10 text-blue-700'

  return (
    <article className="rounded-xl border border-hub-border/60 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="text-xs font-semibold text-blue-600">{task.code}</span>
        <span className="text-xs text-hub-text-muted">Aberto por: {task.opened_by}</span>
      </div>
      <h3 className="mb-1 font-semibold text-hub-navy">{task.title}</h3>
      <p className="mb-3 line-clamp-2 text-xs text-hub-text-muted">{task.description}</p>
      <div className="mb-3 grid grid-cols-3 gap-2 text-xs text-hub-text-muted">
        <div>
          <span className="block text-[10px] uppercase">Sala</span>
          <span className="font-medium text-hub-text">{task.room}</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase">Bloco</span>
          <span className="font-medium text-hub-text">{task.block}</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase">Aberto em</span>
          <span className="font-medium text-hub-text">{task.opened_at}</span>
        </div>
      </div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs text-hub-text-muted">Responsável</span>
        {task.assignee ? (
          <div className="flex items-center gap-1.5">
            <UserAvatar name={task.assignee} size="sm" />
            <span className="text-xs font-medium">{task.assignee}</span>
          </div>
        ) : (
          <span className="text-xs font-medium text-red-600">Sem responsável</span>
        )}
      </div>
      {task.items.length > 0 && (
        <p className="mb-3 text-xs text-hub-text-muted">
          <span className="font-medium text-hub-text">Itens: </span>
          {task.items.join(', ')}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <GridPriorityBadge priority={task.priority} />
        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusClass}`}>
          {task.status_label}
        </span>
      </div>
      {task.column === 'concluidas' && (
        <button type="button" className="mt-3 text-xs font-medium text-blue-600 hover:underline">
          Retornar item ao estoque
        </button>
      )}
    </article>
  )
}

export function GridTasksPage() {
  const [tasks, setTasks] = useState<GridTaskCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    gridService
      .getTasks()
      .then((res) => setTasks(res.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader title="Tarefas" subtitle="Acompanhe e gerencie as tarefas de manutenção em andamento." />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={ListTodo} label="A fazer" value={18} />
        <KpiCard icon={Wrench} label="Em andamento" value={12} />
        <KpiCard icon={CheckCircle2} label="Concluídas" value={46} />
        <KpiCard icon={UserX} label="Sem responsável" value={7} />
      </div>

      <ConnectCard className="mb-4 p-4">
        <div className="grid gap-4 lg:grid-cols-6">
          <input className={`${inputClass} lg:col-span-2`} placeholder="Buscar tarefa por ID, título ou responsável..." />
          <select className={selectClass}>
            <option value="">Todos os blocos</option>
          </select>
          <select className={selectClass}>
            <option value="">Todas as salas</option>
          </select>
          <select className={selectClass}>
            <option value="">Todos os responsáveis</option>
          </select>
          <OutlineButton>
            <Filter className="h-4 w-4" /> Filtros
          </OutlineButton>
        </div>
      </ConnectCard>

      {loading ? (
        <ConnectLoadingSpinner label="Carregando tarefas..." className="min-h-[400px]" />
      ) : (
        <div className="grid w-full min-w-0 grid-cols-1 gap-4 lg:grid-cols-3">
          {columns.map((col) => (
            <div key={col.key} className="flex min-w-0 flex-col rounded-2xl border border-hub-border/60 bg-white">
              <div className={`flex items-center gap-2 rounded-t-2xl px-4 py-3 ${col.headerBg}`}>
                <span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
                <h2 className="font-semibold text-hub-navy">{col.label}</h2>
                <span className="ml-auto rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold text-hub-navy">
                  {col.count}
                </span>
              </div>
              <div className="flex min-h-[200px] flex-col gap-3 p-3">
                {tasks
                  .filter((t) => t.column === col.key)
                  .map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                <button
                  type="button"
                  className="flex items-center justify-center gap-1 rounded-lg py-2 text-sm font-medium text-hub-red hover:bg-hub-bg"
                >
                  <Plus className="h-4 w-4" /> Adicionar tarefa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
