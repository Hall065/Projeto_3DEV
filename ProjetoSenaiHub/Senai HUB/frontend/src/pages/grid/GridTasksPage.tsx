import { CheckCircle2, Filter, Link2, ListTodo, Plus, UserX, Wrench } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
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
import { GridKanbanMoveConfirmModal } from '../../components/grid/GridKanbanMoveConfirmModal'
import { applyTaskColumn, GridTaskKanbanCard } from '../../components/grid/GridTaskKanbanCard'
import type { GridInventoryLine } from '../../types/grid'
import { gridService } from '../../services/gridService'
import type { GridPriority, GridTaskCard, GridTaskColumn } from '../../types/grid'
import { useConfirmAction } from '../../hooks/useConfirmAction'
import { useCrudToast } from '../../hooks/useCrudToast'

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
  const { t } = useTranslation()
  const crudToast = useCrudToast()
  const { confirmDelete, confirmAction } = useConfirmAction()
  const [searchParams, setSearchParams] = useSearchParams()
  const openedFromQuery = useRef(false)
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
  const [moveConfirm, setMoveConfirm] = useState<{
    task: GridTaskCard
    from: GridTaskColumn
    to: GridTaskColumn
    resolve: (value: boolean) => void
  } | null>(null)

  const columnMeta = useMemo<KanbanColumnDef<GridTaskColumn>[]>(
    () => [
      { id: 'a_fazer', label: t('grid.tasks.columns.todo'), dot: 'bg-hub-navy', headerBg: 'bg-hub-navy/10' },
      { id: 'em_andamento', label: t('grid.tasks.columns.inProgress'), dot: 'bg-amber-500', headerBg: 'bg-amber-50' },
      { id: 'concluidas', label: t('grid.tasks.columns.done'), dot: 'bg-emerald-500', headerBg: 'bg-emerald-50' },
    ],
    [t],
  )

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

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
    setEditingId(null)
    if (searchParams.has('id')) {
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const openCreate = (column: GridTaskColumn) => {
    openedFromQuery.current = false
    setEditingId(null)
    setCreateColumn(column)
    setForm({ ...emptyForm, column })
    setDrawerOpen(true)
  }

  const openEdit = useCallback(
    (task: GridTaskCard) => {
      setEditingId(task.id)
      setSearchParams({ id: String(task.id) }, { replace: true })
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
    },
    [setSearchParams],
  )

  useEffect(() => {
    const paramId = searchParams.get('id')
    if (!paramId || loading) return
    const id = Number(paramId)
    if (Number.isNaN(id)) return
    if (editingId === id && drawerOpen) return

    const task = tasks.find((item) => item.id === id)
    if (!task) return

    openEdit(task)
    openedFromQuery.current = true
  }, [searchParams, tasks, loading, editingId, drawerOpen, openEdit])

  const handleSave = async () => {
    if (!form.title.trim() || !form.opened_by.trim()) {
      crudToast.notifyWarning(t('grid.tasks.alert.required'))
      return
    }

    if (inventoryItems.length > 0) {
      const catalogRes = await gridService.getInventory({ per_page: 100 })
      if (!(await guardInventoryBeforeSubmit(inventoryItems, catalogRes.data, crudToast, confirmAction))) {
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
      closeDrawer()
      crudToast.notifySaved(!!editingId)
      load()
    } catch (e: unknown) {
      crudToast.notifyError(e, t('grid.tasks.alert.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const handleTaskMove = useCallback(async (taskId: number, column: GridTaskColumn) => {
    const snapshot = tasks
    setMovingId(taskId)
    setTasks((prev) => prev.map((item) => (item.id === taskId ? applyTaskColumn(item, column) : item)))

    try {
      const updated = await gridService.updateTask(taskId, { column })
      setTasks((prev) => prev.map((item) => (item.id === taskId ? updated : item)))
    } catch (e: unknown) {
      setTasks(snapshot)
      crudToast.notifyError(e, t('grid.tasks.alert.moveError'))
    } finally {
      setMovingId(null)
    }
  }, [tasks, t])

  const confirmTaskColumnMove = useCallback(
    (task: GridTaskCard, from: GridTaskColumn, to: GridTaskColumn): Promise<boolean> =>
      new Promise((resolve) => {
        setMoveConfirm({ task, from, to, resolve })
      }),
    [],
  )

  const closeMoveConfirm = useCallback((confirmed: boolean) => {
    setMoveConfirm((current) => {
      current?.resolve(confirmed)
      return null
    })
  }, [])

  const taskMoveNeedsAssignee = (task: GridTaskCard, to: GridTaskColumn) =>
    to === 'em_andamento' && !task.assignee?.trim()

  const handleMoveConfirmAssign = () => {
    setMoveConfirm((current) => {
      if (current) {
        openEdit(current.task)
        current.resolve(false)
      }
      return null
    })
  }

  const moveConfirmFromLabel =
    moveConfirm && columnMeta.find((column) => column.id === moveConfirm.from)?.label
  const moveConfirmToLabel =
    moveConfirm && columnMeta.find((column) => column.id === moveConfirm.to)?.label
  const moveConfirmNeedsAssignee =
    moveConfirm != null && taskMoveNeedsAssignee(moveConfirm.task, moveConfirm.to)

  const handleDelete = async (task: GridTaskCard) => {
    if (!(await confirmDelete(`a tarefa "${task.title}"`))) return
    await gridService.deleteTask(task.id)
    load()
  }

  const countByColumn = (col: GridTaskColumn) => tasks.filter((item) => item.column === col).length

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title={t('grid.tasks.title')}
        subtitle={t('grid.tasks.subtitle')}
        actions={
          <div className="flex flex-wrap gap-2">
            <OutlineButton onClick={() => setFromTicketOpen(true)}>
              <Link2 className="h-4 w-4" /> {t('grid.tasks.actions.fromTicket')}
            </OutlineButton>
            <PrimaryButton onClick={() => openCreate('a_fazer')}>
              <Plus className="h-4 w-4" /> {t('grid.tasks.actions.newTask')}
            </PrimaryButton>
          </div>
        }
      />

      <div className="mb-6 grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
        ) : (
          <>
            <KpiCard icon={ListTodo} label={t('grid.tasks.kpis.todo')} value={countByColumn('a_fazer')} variant="blue" />
            <KpiCard icon={Wrench} label={t('grid.tasks.kpis.inProgress')} value={countByColumn('em_andamento')} variant="coral" />
            <KpiCard icon={CheckCircle2} label={t('grid.tasks.kpis.done')} value={countByColumn('concluidas')} variant="green" />
            <KpiCard icon={UserX} label={t('grid.tasks.kpis.unassigned')} value={tasks.filter((item) => !item.assignee).length} variant="senai" />
          </>
        )}
      </div>

      <ConnectCard className="mb-4 p-4">
        <div className="grid gap-4 lg:grid-cols-6">
          <input
            className={`${inputClass} lg:col-span-2`}
            placeholder={t('grid.tasks.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <OutlineButton onClick={() => setSearch('')}>
            <Filter className="h-4 w-4" /> {t('grid.common.clear')}
          </OutlineButton>
        </div>
      </ConnectCard>

      {loading ? (
        <ConnectLoadingSpinner label={t('grid.tasks.loading')} className="min-h-[400px]" />
      ) : (
        <GridKanbanBoard
          columns={columnMeta}
          items={tasks}
          getColumnId={(item) => item.column}
          applyColumn={applyTaskColumn}
          onItemsChange={setTasks}
          onItemMove={handleTaskMove}
          confirmColumnMove={confirmTaskColumnMove}
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
              <Plus className="h-4 w-4" /> {t('grid.tasks.actions.addTask')}
            </button>
          )}
        />
      )}

      <ConnectDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editingId ? t('grid.tasks.drawer.edit') : t('grid.tasks.drawer.new')}
        subtitle={t('grid.tasks.drawer.subtitle')}
        footer={
          <div className="flex justify-end gap-2">
            <OutlineButton onClick={() => setDrawerOpen(false)}>{t('common.cancel')}</OutlineButton>
            <PrimaryButton onClick={() => void handleSave()} disabled={saving}>
              {saving ? t('connect.common.saving') : t('common.save')}
            </PrimaryButton>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t('grid.tasks.form.openedBy')} required>
            <input className={inputClass} value={form.opened_by} onChange={(e) => setForm({ ...form, opened_by: e.target.value })} />
          </FormField>
          <FormField label={t('grid.tasks.form.title')} required>
            <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label={t('grid.tasks.form.description')}>
              <textarea className={`${inputClass} min-h-[80px] py-2`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </FormField>
          </div>
          <FormField label={t('grid.tasks.form.room')}>
            <input className={inputClass} value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
          </FormField>
          <FormField label={t('grid.tasks.form.block')}>
            <input className={inputClass} value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })} />
          </FormField>
          <FormField label={t('grid.tasks.form.assignee')}>
            <input className={inputClass} value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} />
          </FormField>
          <FormField label={t('grid.tasks.form.priority')}>
            <select className={selectClass} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as typeof form.priority })}>
              <option value="alta">{t('grid.tasks.form.priorityHigh')}</option>
              <option value="media">{t('grid.tasks.form.priorityMedium')}</option>
              <option value="baixa">{t('grid.tasks.form.priorityLow')}</option>
            </select>
          </FormField>
          <FormField label={t('grid.tasks.form.column')}>
            <select className={selectClass} value={form.column} onChange={(e) => setForm({ ...form, column: e.target.value as GridTaskColumn })}>
              <option value="a_fazer">{t('grid.tasks.columns.todo')}</option>
              <option value="em_andamento">{t('grid.tasks.columns.inProgress')}</option>
              <option value="concluidas">{t('grid.tasks.columns.done')}</option>
            </select>
          </FormField>
          <div className="sm:col-span-2">
            <FormField label={t('grid.tasks.form.looseItems')}>
              <input className={inputClass} value={form.items} onChange={(e) => setForm({ ...form, items: e.target.value })} />
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField label={t('grid.tasks.form.inventoryMaterials')}>
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

      <GridKanbanMoveConfirmModal
        open={moveConfirm != null}
        itemLabel={moveConfirm ? moveConfirm.task.title : ''}
        fromLabel={moveConfirmFromLabel ?? ''}
        toLabel={moveConfirmToLabel ?? ''}
        warning={moveConfirmNeedsAssignee ? t('grid.kanban.confirmMove.noAssigneeTask') : null}
        showAssignAction={moveConfirmNeedsAssignee}
        confirmDisabled={moveConfirmNeedsAssignee}
        onConfirm={() => closeMoveConfirm(true)}
        onCancel={() => closeMoveConfirm(false)}
        onAssign={handleMoveConfirmAssign}
      />
    </div>
  )
}
