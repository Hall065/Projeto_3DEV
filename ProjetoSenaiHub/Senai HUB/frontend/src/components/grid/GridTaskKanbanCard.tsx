import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import { GridPriorityBadge } from './GridBadges'
import type { GridPriority, GridTaskCard, GridTaskColumn } from '../../types/grid'
import { UserAvatar } from '../ui/UserAvatar'

const columnStatusClass: Record<GridTaskColumn, string> = {
  a_fazer: 'border-hub-navy/25 bg-hub-navy/10 text-blue-700',
  em_andamento: 'border-amber-200 bg-amber-50 text-amber-700',
  concluidas: 'bg-emerald-500 text-white border-emerald-500',
}

export function GridTaskKanbanCard({
  task,
  isDragging,
  onEdit,
  onDelete,
}: {
  task: GridTaskCard
  isDragging?: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <article
      className={`glass-panel-solid min-w-0 overflow-hidden rounded-xl p-3 shadow-sm transition-shadow duration-300 sm:p-4 ${
        isDragging ? 'scale-[1.02] shadow-xl ring-2 ring-hub-red/20' : 'hover:shadow-md'
      }`}
    >
      <div className="mb-2 flex items-start gap-2">
        <span
          className="mt-0.5 shrink-0 cursor-grab text-hub-text-muted active:cursor-grabbing"
          aria-hidden
        >
          <GripVertical className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-blue-600">{task.code}</span>
              {task.ticket_code ? (
                <span className="block truncate text-[10px] text-hub-text-muted">Chamado {task.ticket_code}</span>
              ) : null}
            </div>
            <div className="flex shrink-0 gap-0.5" onPointerDown={(e) => e.stopPropagation()}>
              <button type="button" className="rounded p-1.5 hover:bg-white/50" onClick={onEdit} aria-label="Editar">
                <Pencil className="h-3.5 w-3.5 text-hub-text-muted" />
              </button>
              <button type="button" className="rounded p-1.5 hover:bg-white/50" onClick={onDelete} aria-label="Excluir">
                <Trash2 className="h-3.5 w-3.5 text-hub-red" />
              </button>
            </div>
          </div>
          <h3 className="mt-1 line-clamp-2 break-words text-sm font-semibold leading-snug text-hub-navy">{task.title}</h3>
        </div>
      </div>

      {task.description ? (
        <p className="mb-3 line-clamp-3 break-words text-xs leading-relaxed text-hub-text-muted">{task.description}</p>
      ) : null}

      <ul className="mb-3 flex flex-col gap-2 text-xs text-hub-text-muted">
        <li className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
          <span className="text-[10px] font-medium uppercase tracking-wide">Sala</span>
          <span className="font-medium text-hub-text">{task.room || '—'}</span>
        </li>
        <li className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
          <span className="text-[10px] font-medium uppercase tracking-wide">Bloco</span>
          <span className="font-medium text-hub-text">{task.block || '—'}</span>
        </li>
        <li className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
          <span className="text-[10px] font-medium uppercase tracking-wide">Aberto em</span>
          <span className="font-medium text-hub-text">{task.opened_at}</span>
        </li>
      </ul>

      <div className="mb-3 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs text-hub-text-muted">Responsável</span>
        {task.assignee ? (
          <div className="flex min-w-0 items-center gap-1.5">
            <UserAvatar name={task.assignee} size="sm" />
            <span className="truncate text-xs font-medium">{task.assignee}</span>
          </div>
        ) : (
          <span className="text-xs font-medium text-red-600">Sem responsável</span>
        )}
      </div>

      {task.items.length > 0 ? (
        <p className="mb-3 break-words text-xs leading-relaxed text-hub-text-muted">
          <span className="font-medium text-hub-text">Itens: </span>
          {task.items.join(', ')}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <GridPriorityBadge priority={task.priority as GridPriority} />
        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${columnStatusClass[task.column]}`}>
          {task.status_label}
        </span>
      </div>
    </article>
  )
}

export const TASK_COLUMN_LABELS: Record<GridTaskColumn, string> = {
  a_fazer: 'A fazer',
  em_andamento: 'Em andamento',
  concluidas: 'Concluída',
}

export function applyTaskColumn(task: GridTaskCard, column: GridTaskColumn): GridTaskCard {
  return {
    ...task,
    column,
    status_label: TASK_COLUMN_LABELS[column],
  }
}
