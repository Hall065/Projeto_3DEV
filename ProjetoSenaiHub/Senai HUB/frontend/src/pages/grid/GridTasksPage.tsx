import { CheckCircle2, Filter, Link2, ListTodo, Plus, UserX, Wrench } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { ConnectDrawer } from '../../components/connect/ConnectDrawer'
import { KpiCard, KpiCardSkeleton } from '../../components/connect/ConnectKpiCard'
import {
  ConnectCard,
  ConnectLoadingSpinner,
  ConnectPageHeader,
  FormField,
  inputClass,
  OutlineButton,
  PrimaryButton,
  selectClass,
} from '../../components/connect/ConnectShared'
import { GridCreateTaskFromTicketDrawer } from '../../components/grid/GridCreateTaskFromTicketDrawer'
import { GridInventoryPicker, guardInventoryBeforeSubmit } from '../../components/grid/GridInventoryPicker'
import { GridKanbanBoard, type KanbanColumnDef } from '../../components/grid/GridKanbanBoard'
import { applyTaskColumn, GridTaskKanbanCard } from '../../components/grid/GridTaskKanbanCard'
import type { GridInventoryLine } from '../../types/grid'
import { gridService } from '../../services/gridService'
import type { GridPriority, GridTaskCard, GridTaskColumn } from '../../types/grid'
import { confirmDelete } from '../../utils/confirmAction'

const columnMeta: KanbanColumnDef<GridTaskColumn>[] = [
  { id: 'a_fazer', label: 'A fazer', dot: 'bg-hub-navy', headerBg: 'bg-hub-navy/10' },
  { id: 'em_andamento', label: 'Em andamento', dot: 'bg-amber-500', headerBg: 'bg-amber-50' },
  { id: 'concluidas', label: 'Concluídas', dot: 'bg-emerald-500', headerBg: 'bg-emerald-50' },
]

const emptyForm = {
  opened_by: '',
  title: '',
  description: '',
  room: '',
  block: '',
  assignee: '',
  items: '',
  priority: 'media' as GridPriority,
  column: 'a_fazer' as GridTaskColumn,
}

export function GridTasksPage() {
  const [tasks, setTasks] = useState<GridTaskCard[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [createColumn, setCreateColumn] = useState<GridTaskColumn>('a_fazer')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [movingId, setMovingId] = useState<number | null>(null)
  const [fromTicketOpen, setFromTicketOpen] = useState(false)
  const [inventoryItems, setInventoryItems] = useState<GridInventoryLine[]>([])

  const load = () => {
    setLoading(true)
    gridService
      .getTasks({ all: true, search })
      .then((res) => setTasks(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [search])

  const openCreate = (column: GridTaskColumn) => {
    setEditingId(null)
    setCreateColumn(column)
    setForm({ ...emptyForm, column })
    setDrawerOpen(true)
  }

  const openEdit = (task: GridTaskCard) => {
    setEditingId(task.id)
    setForm({
      opened_by: task.opened_by,
      title: task.title,
      description: task.description,
      room: task.room,
      block: task.block,
      assignee: task.assignee ?? '',
      items: task.items.join(', '),
      priority: task.priority,
      column: task.column,
    })
    setInventoryItems(task.inventory_items ?? [])
    setDrawerOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.opened_by.trim()) {
      window.alert('Informe título e quem abriu a tarefa.')
      return
    }

    if (inventoryItems.length > 0) {
      const catalogRes = await gridService.getInventory({ per_page: 100 })
      if (!guardInventoryBeforeSubmit(inventoryItems, catalogRes.data)) {
        return
      }
    }

    setSaving(true)
    try {
      const payload = {
        opened_by: form.opened_by.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        room: form.room.trim(),
        block: form.block.trim(),
        assignee: form.assignee.trim() || null,
        items: form.items.split(',').map((s) => s.trim()).filter(Boolean),
        inventory_items: inventoryItems,
        priority: form.priority,
        column: form.column,
      }
      if (editingId) {
        await gridService.updateTask(editingId, payload)
      } else {
        await gridService.createTask({ ...payload, column: createColumn })
      }
      setDrawerOpen(false)
      load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response
        ?.data
      const inv = msg?.errors?.inventory_items?.[0]
      window.alert(inv ?? msg?.message ?? 'Não foi possível salvar a tarefa.')
    } finally {
      setSaving(false)
    }
  }

  const handleTaskMove = useCallback(async (taskId: number, column: GridTaskColumn) => {
    const snapshot = tasks
    setMovingId(taskId)
    setTasks((prev) => prev.map((t) => (t.id === taskId ? applyTaskColumn(t, column) : t)))

    try {
      const updated = await gridService.updateTask(taskId, { column })
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)))
    } catch (e: unknown) {
      setTasks(snapshot)
      const msg = (e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response
        ?.data
      const inv = msg?.errors?.inventory_items?.[0]
      window.alert(inv ?? msg?.message ?? 'Não foi possível mover a tarefa. Verifique o estoque dos materiais.')
    } finally {
      setMovingId(null)
    }
  }, [tasks])

  const handleDelete = async (task: GridTaskCard) => {
    if (!confirmDelete(`a tarefa "${task.title}"`)) return
    await gridService.deleteTask(task.id)
    load()
  }

  const countByColumn = (col: GridTaskColumn) => tasks.filter((t) => t.column === col).length

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Tarefas"
        subtitle="Arraste os cards entre as colunas. Ao concluir a tarefa, o chamado vinculado vai para aprovação do chefe."
        actions={
          <div className="flex flex-wrap gap-2">
            <OutlineButton onClick={() => setFromTicketOpen(true)}>
              <Link2 className="h-4 w-4" /> A partir de chamado
            </OutlineButton>
            <PrimaryButton onClick={() => openCreate('a_fazer')}>
              <Plus className="h-4 w-4" /> Nova tarefa
            </PrimaryButton>
          </div>
        }
      />

      <div className="mb-6 grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
        ) : (
          <>
            <KpiCard icon={ListTodo} label="A fazer" value={countByColumn('a_fazer')} variant="blue" />
            <KpiCard icon={Wrench} label="Em andamento" value={countByColumn('em_andamento')} variant="coral" />
            <KpiCard icon={CheckCircle2} label="Concluídas" value={countByColumn('concluidas')} variant="green" />
            <KpiCard icon={UserX} label="Sem responsável" value={tasks.filter((t) => !t.assignee).length} variant="senai" />
          </>
        )}
      </div>

      <ConnectCard className="mb-4 p-4">
        <div className="grid gap-4 lg:grid-cols-6">
          <input
            className={`${inputClass} lg:col-span-2`}
            placeholder="Buscar tarefa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <OutlineButton onClick={() => setSearch('')}>
            <Filter className="h-4 w-4" /> Limpar
          </OutlineButton>
        </div>
      </ConnectCard>

      {loading ? (
        <ConnectLoadingSpinner label="Carregando tarefas..." className="min-h-[400px]" />
      ) : (
        <GridKanbanBoard
          columns={columnMeta}
          items={tasks}
          getColumnId={(t) => t.column}
          applyColumn={applyTaskColumn}
          onItemsChange={setTasks}
          onItemMove={handleTaskMove}
          renderCard={(task, { isDragging }) => (
            <GridTaskKanbanCard
              task={task}
              isDragging={isDragging || movingId === task.id}
              onEdit={() => openEdit(task)}
              onDelete={() => void handleDelete(task)}
            />
          )}
          columnFooter={(columnId) => (
            <button
              type="button"
              className="flex items-center justify-center gap-1 rounded-lg py-2 text-sm font-medium text-hub-red hover:bg-white/40"
              onClick={() => openCreate(columnId)}
            >
              <Plus className="h-4 w-4" /> Adicionar tarefa
            </button>
          )}
        />
      )}

      <ConnectDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingId ? 'Editar tarefa' : 'Nova tarefa'}
        subtitle="Dados da ordem de serviço / tarefa de manutenção."
        footer={
          <div className="flex justify-end gap-2">
            <OutlineButton onClick={() => setDrawerOpen(false)}>Cancelar</OutlineButton>
            <PrimaryButton onClick={() => void handleSave()} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </PrimaryButton>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Aberto por" required>
            <input className={inputClass} value={form.opened_by} onChange={(e) => setForm({ ...form, opened_by: e.target.value })} placeholder="Ex: Secretaria pedagógica" />
          </FormField>
          <FormField label="Título" required>
            <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Reparo na tomada da sala 12" />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Descrição">
              <textarea className={`${inputClass} min-h-[80px] py-2`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detalhes da tarefa e materiais necessários..." />
            </FormField>
          </div>
          <FormField label="Sala">
            <input className={inputClass} value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="Ex: 12" />
          </FormField>
          <FormField label="Bloco">
            <input className={inputClass} value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })} placeholder="Ex: B" />
          </FormField>
          <FormField label="Responsável">
            <input className={inputClass} value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} placeholder="Ex: João Silva" />
          </FormField>
          <FormField label="Prioridade">
            <select className={selectClass} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as typeof form.priority })}>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </FormField>
          <FormField label="Coluna">
            <select className={selectClass} value={form.column} onChange={(e) => setForm({ ...form, column: e.target.value as GridTaskColumn })}>
              <option value="a_fazer">A fazer</option>
              <option value="em_andamento">Em andamento</option>
              <option value="concluidas">Concluídas</option>
            </select>
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Itens avulsos (texto, separados por vírgula)">
              <input className={inputClass} value={form.items} onChange={(e) => setForm({ ...form, items: e.target.value })} placeholder="Lâmpada LED, Selante..." />
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField label="Materiais do estoque">
              <GridInventoryPicker value={inventoryItems} onChange={setInventoryItems} />
            </FormField>
          </div>
        </div>
      </ConnectDrawer>

      <GridCreateTaskFromTicketDrawer
        open={fromTicketOpen}
        onClose={() => setFromTicketOpen(false)}
        onCreated={load}
      />
    </div>
  )
}
