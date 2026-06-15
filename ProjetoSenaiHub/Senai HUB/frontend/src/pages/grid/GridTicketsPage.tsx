import { AlertTriangle, CheckCircle2, ClipboardList, Eye, Filter, LayoutGrid, List, Pencil, Plus, Trash2, UserCheck, Wrench } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { GRID_API_ROLE_TECHNICIAN } from '../../constants/gridRoles'
import { ConnectDrawer } from '../../components/connect/ConnectDrawer'
import { ConnectEntityViewDrawer } from '../../components/connect/ConnectEntityViewDrawer'
import { ConnectRowActionsMenu } from '../../components/connect/ConnectRowActionsMenu'
import { KpiCard, KpiCardSkeleton } from '../../components/connect/ConnectKpiCard'
import {
  ConnectCard,
  ConnectLoadingSpinner,
  ConnectPageHeader,
  ConnectPagination,
  ConnectTableScroll,
  FormField,
  inputClass,
  OutlineButton,
  PrimaryButton,
  selectClass,
} from '../../components/connect/ConnectShared'
import { GridPriorityBadge, GridTicketStatusBadge } from '../../components/grid/GridBadges'
import { GridKanbanBoard, type KanbanColumnDef } from '../../components/grid/GridKanbanBoard'
import { GridKanbanMoveConfirmModal } from '../../components/grid/GridKanbanMoveConfirmModal'
import { GridApproveServiceDrawer } from '../../components/grid/GridApproveServiceDrawer'
import { GridEvaluateTicketDrawer } from '../../components/grid/GridEvaluateTicketDrawer'
import {
  canDragTicket,
  canMoveTicketTo,
  ticketKanbanDropAllowed,
  ticketMoveNeedsAssignee,
} from '../../utils/gridTicketWorkflow'
import { applyTicketStatus, GridTicketKanbanCard } from '../../components/grid/GridTicketKanbanCard'
import { useAuth } from '../../contexts/AuthContext'
import { GridTicketAttachmentsPanel, uploadPendingTicketAttachments } from '../../components/grid/GridTicketAttachmentsPanel'
import { GridTicketCard } from '../../components/grid/GridTicketCard'
import { gridService } from '../../services/gridService'
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus'
import { useConfirmAction } from '../../hooks/useConfirmAction'
import { useCrudToast } from '../../hooks/useCrudToast'
import type {
  GridDashboardData,
  GridPriority,
  GridTicket,
  GridTicketAttachment,
  GridTicketStatus,
  PaginatedMeta,
} from '../../types/grid'

function getTicketColumns(t: TFunction): KanbanColumnDef<GridTicketStatus>[] {
  return [
    { id: 'aberto', label: t('grid.tickets.columns.open'), dot: 'bg-blue-500', headerBg: 'bg-blue-50' },
    { id: 'pendente', label: t('grid.tickets.columns.pending'), dot: 'bg-slate-400', headerBg: 'bg-slate-50' },
    { id: 'em_atendimento', label: t('grid.tickets.columns.inService'), dot: 'bg-amber-500', headerBg: 'bg-amber-50' },
    { id: 'aguardando_aprovacao', label: t('grid.tickets.columns.awaitingApproval'), dot: 'bg-yellow-500', headerBg: 'bg-yellow-50' },
    { id: 'avaliacao_pendente', label: t('grid.tickets.columns.awaitingEvaluation'), dot: 'bg-violet-500', headerBg: 'bg-violet-50' },
    { id: 'concluido', label: t('grid.tickets.columns.finished'), dot: 'bg-emerald-500', headerBg: 'bg-emerald-50' },
  ]
}

const emptyForm = {
  requester: '',
  title: '',
  summary: '',
  room: '',
  block: '',
  priority: 'media' as GridPriority,
  status: 'aberto' as GridTicketStatus,
  assignee: '',
  fixed_description: '',
  considerations: '',
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function GridTicketsPage() {
  const { t } = useTranslation()
  const crudToast = useCrudToast()
  const { confirmDelete } = useConfirmAction()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tickets, setTickets] = useState<GridTicket[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | undefined>()
  const [dashboard, setDashboard] = useState<GridDashboardData | null>(null)
  const [technicians, setTechnicians] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [block, setBlock] = useState('')
  const [priority, setPriority] = useState('')
  const [status, setStatus] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [assignTarget, setAssignTarget] = useState<GridTicket | null>(null)
  const [assignee, setAssignee] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [viewSnapshot, setViewSnapshot] = useState<GridTicket | null>(null)
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')
  const [movingId, setMovingId] = useState<number | null>(null)
  const [evaluateTarget, setEvaluateTarget] = useState<GridTicket | null>(null)
  const [approveTarget, setApproveTarget] = useState<GridTicket | null>(null)
  const [ticketAttachments, setTicketAttachments] = useState<GridTicketAttachment[]>([])
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([])
  const [moveConfirm, setMoveConfirm] = useState<{
    ticket: GridTicket
    from: GridTicketStatus
    to: GridTicketStatus
    resolve: (value: boolean) => void
  } | null>(null)

  const ticketColumns = useMemo(() => getTicketColumns(t), [t])

  const loadDashboard = useCallback(() => gridService.getDashboard().then(setDashboard), [])

  const load = () => {
    setLoading(true)
    const params: Record<string, string | number> = { search }
    if (viewMode === 'board') {
      params.per_page = 100
    } else {
      params.page = page
      params.per_page = 10
    }
    if (block) params.block = block
    if (priority) params.priority = priority
    if (status) params.status = status

    gridService
      .getTickets(params)
      .then((res) => {
        setTickets(res.data)
        setMeta(res.meta)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page, search, block, priority, status, viewMode])

  useEffect(() => {
    loadDashboard()
    gridService.getUsers({ per_page: 50, role: GRID_API_ROLE_TECHNICIAN }).then((res) => {
      const names = res.data.map((u) => u.name)
      setTechnicians(names.length ? names : res.data.map((u) => u.name))
    })
  }, [loadDashboard])

  useRefetchOnFocus(loadDashboard)

  const openView = useCallback((ticket: GridTicket) => {
    setViewSnapshot(ticket)
    setSearchParams({ id: String(ticket.id) }, { replace: true })
  }, [setSearchParams])

  const closeView = useCallback(() => {
    setViewSnapshot(null)
    if (searchParams.has('id')) {
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    const paramId = searchParams.get('id')
    if (!paramId) return
    const id = Number(paramId)
    if (Number.isNaN(id)) return
    if (viewSnapshot?.id === id) return

    const fromList = tickets.find((item) => item.id === id)
    if (fromList) {
      setViewSnapshot(fromList)
      return
    }

    let cancelled = false
    gridService
      .getTicket(id)
      .then((ticket) => {
        if (!cancelled) setViewSnapshot(ticket)
      })
      .catch((err) => {
        if (!cancelled) {
          crudToast.notifyError(err, t('common.error'))
          closeView()
        }
      })

    return () => {
      cancelled = true
    }
  }, [searchParams, tickets, viewSnapshot?.id, closeView, t])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setTicketAttachments([])
    setPendingAttachments([])
    setDrawerOpen(true)
  }

  const openEdit = (ticket: GridTicket) => {
    setEditingId(ticket.id)
    setTicketAttachments(ticket.attachments ?? [])
    setPendingAttachments([])
    setForm({
      requester: ticket.requester,
      title: ticket.title,
      summary: ticket.summary,
      room: ticket.room,
      block: ticket.block,
      priority: ticket.priority,
      status: ticket.status,
      assignee: ticket.assignee,
      fixed_description: ticket.fixed_description ?? '',
      considerations: ticket.considerations ?? '',
    })
    setDrawerOpen(true)
  }

  const openAssign = (ticket: GridTicket) => {
    setAssignTarget(ticket)
    setAssignee(ticket.assignee)
    setAssignOpen(true)
  }

  const handleSave = async () => {
    if (!form.requester.trim() || !form.title.trim()) {
      crudToast.notifyWarning(t('grid.tickets.alert.required'))
      return
    }

    setSaving(true)
    try {
      const payload = {
        requester: form.requester.trim(),
        title: form.title.trim(),
        summary: form.summary.trim(),
        room: form.room.trim(),
        block: form.block.trim(),
        priority: form.priority,
        status: form.status,
        assignee: form.assignee.trim() || undefined,
        fixed_description: form.fixed_description?.trim(),
        considerations: form.considerations?.trim(),
      }
      let savedId = editingId
      if (editingId) {
        await gridService.updateTicket(editingId, payload)
      } else {
        const created = await gridService.createTicket(payload)
        savedId = created.id
      }

      if (savedId && pendingAttachments.length > 0) {
        await uploadPendingTicketAttachments(savedId, pendingAttachments)
      }

      setDrawerOpen(false)
      setPendingAttachments([])
      crudToast.notifySaved(!!editingId)
      load()
      loadDashboard()
    } catch (e: unknown) {
      crudToast.notifyError(e, t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const handleAssign = async () => {
    if (!assignTarget) return
    setSaving(true)
    try {
      await gridService.updateTicket(assignTarget.id, { assignee: assignee.trim() })
      setAssignOpen(false)
      crudToast.notifySaved(true)
      load()
    } catch (e: unknown) {
      crudToast.notifyError(e, t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (ticket: GridTicket) => {
    if (!(await confirmDelete(`o chamado "${ticket.code}"`))) return
    try {
      await gridService.deleteTicket(ticket.id)
      crudToast.notifyDeleted()
      load()
      loadDashboard()
    } catch (e: unknown) {
      crudToast.notifyError(e, t('common.error'))
    }
  }

  const handleTicketMove = useCallback(
    async (ticketId: number, newStatus: GridTicketStatus) => {
      const current = tickets.find((item) => item.id === ticketId)
      if (!current || !canMoveTicketTo(current, newStatus)) return

      const snapshot = tickets
      setMovingId(ticketId)
      setTickets((prev) => prev.map((item) => (item.id === ticketId ? applyTicketStatus(item, newStatus) : item)))

      try {
        const payload: Partial<GridTicket> = { status: newStatus }
        if (newStatus === 'aberto' && current.status === 'pendente') {
          payload.assignee = ''
        }
        const updated = await gridService.updateTicket(ticketId, payload)
        setTickets((prev) => prev.map((item) => (item.id === ticketId ? updated : item)))
        loadDashboard()
      } catch (e: unknown) {
        setTickets(snapshot)
        crudToast.notifyError(e, t('grid.tickets.alert.moveError'))
      } finally {
        setMovingId(null)
      }
    },
    [tickets, t, loadDashboard],
  )

  const confirmTicketColumnMove = useCallback(
    (ticket: GridTicket, from: GridTicketStatus, to: GridTicketStatus): Promise<boolean> =>
      new Promise((resolve) => {
        setMoveConfirm({ ticket, from, to, resolve })
      }),
    [],
  )

  const closeMoveConfirm = useCallback((confirmed: boolean) => {
    setMoveConfirm((current) => {
      current?.resolve(confirmed)
      return null
    })
  }, [])

  const handleMoveConfirmAssign = () => {
    setMoveConfirm((current) => {
      if (current) {
        openAssign(current.ticket)
        current.resolve(false)
      }
      return null
    })
  }

  const moveConfirmFromLabel =
    moveConfirm && ticketColumns.find((column) => column.id === moveConfirm.from)?.label
  const moveConfirmToLabel =
    moveConfirm && ticketColumns.find((column) => column.id === moveConfirm.to)?.label
  const moveConfirmNeedsAssignee =
    moveConfirm != null && ticketMoveNeedsAssignee(moveConfirm.ticket, moveConfirm.to)
  const moveConfirmCanProceed =
    moveConfirm != null && canMoveTicketTo(moveConfirm.ticket, moveConfirm.to, moveConfirm.from)

  const kpis = dashboard?.kpis
  const spark = dashboard?.kpi_sparklines
  const urgentCount = dashboard?.kpis.urgent_tickets ?? dashboard?.report_kpis?.urgent ?? 0

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title={t('grid.tickets.title')}
        subtitle={viewMode === 'board' ? t('grid.tickets.subtitle.board') : t('grid.tickets.subtitle.list')}
        actions={
          <>
            <div className="flex rounded-xl border border-hub-border/60 p-0.5">
              <button
                type="button"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'board' ? 'bg-hub-navy text-white' : 'text-hub-text-muted hover:bg-white/60'
                }`}
                onClick={() => setViewMode('board')}
              >
                <LayoutGrid className="h-4 w-4" /> {t('grid.tickets.view.board')}
              </button>
              <button
                type="button"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'list' ? 'bg-hub-navy text-white' : 'text-hub-text-muted hover:bg-white/60'
                }`}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" /> {t('grid.tickets.view.list')}
              </button>
            </div>
            <PrimaryButton onClick={openCreate}>
              <Plus className="h-4 w-4" /> {t('grid.tickets.new')}
            </PrimaryButton>
          </>
        }
      />

      <div className="mb-6 grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {!kpis ? (
          Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              icon={ClipboardList}
              label={t('grid.tickets.kpis.open')}
              value={kpis.open_tickets}
              variant="blue"
              sparkline={spark?.open_tickets ?? []}
            />
            <KpiCard
              icon={AlertTriangle}
              label={t('grid.tickets.kpis.urgent')}
              value={urgentCount}
              variant="senai"
              sparkline={spark?.urgent ?? []}
            />
            <KpiCard
              icon={Wrench}
              label={t('grid.tickets.kpis.inProgress')}
              value={kpis.in_progress}
              variant="coral"
              sparkline={spark?.in_progress ?? []}
            />
            <KpiCard
              icon={CheckCircle2}
              label={t('grid.tickets.kpis.completedMonth')}
              value={kpis.completed_month}
              variant="green"
              sparkline={spark?.completed_month ?? []}
            />
          </>
        )}
      </div>

      <ConnectCard className="mb-4 p-4">
        <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label={t('grid.tickets.filters.search')}>
            <input
              className={inputClass}
              placeholder={t('grid.tickets.filters.search')}
              value={search}
              onChange={(e) => {
                setPage(1)
                setSearch(e.target.value)
              }}
            />
          </FormField>
          <FormField label={t('grid.tickets.filters.block')}>
            <select className={selectClass} value={block} onChange={(e) => { setPage(1); setBlock(e.target.value) }}>
              <option value="">{t('grid.tickets.filters.all')}</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </FormField>
          <FormField label={t('grid.tickets.filters.priority')}>
            <select className={selectClass} value={priority} onChange={(e) => { setPage(1); setPriority(e.target.value) }}>
              <option value="">{t('grid.tickets.filters.all')}</option>
              <option value="alta">{t('grid.tasks.form.priorityHigh')}</option>
              <option value="media">{t('grid.tasks.form.priorityMedium')}</option>
              <option value="baixa">{t('grid.tasks.form.priorityLow')}</option>
            </select>
          </FormField>
          <FormField label={t('grid.tickets.filters.status')}>
            <select className={selectClass} value={status} onChange={(e) => { setPage(1); setStatus(e.target.value) }}>
              <option value="">{t('grid.tickets.filters.all')}</option>
              <option value="aberto">{t('grid.tickets.columns.open')}</option>
              <option value="pendente">{t('grid.tickets.columns.pending')}</option>
              <option value="em_atendimento">{t('grid.tickets.columns.inService')}</option>
              <option value="aguardando_aprovacao">{t('grid.tickets.columns.awaitingApproval')}</option>
              <option value="avaliacao_pendente">{t('grid.tickets.columns.awaitingEvaluation')}</option>
              <option value="concluido">{t('grid.tickets.columns.finished')}</option>
            </select>
          </FormField>
          <div className="flex items-end justify-end sm:col-span-2 lg:col-span-4">
            <OutlineButton
              onClick={() => {
                setSearch('')
                setBlock('')
                setPriority('')
                setStatus('')
                setPage(1)
              }}
            >
              <Filter className="h-4 w-4" /> {t('connect.common.clearFilters')}
            </OutlineButton>
          </div>
        </div>
      </ConnectCard>

      {viewMode === 'board' ? (
        loading ? (
          <ConnectLoadingSpinner label={t('grid.dashboard.recentTickets.loading')} className="min-h-[400px]" />
        ) : (
          <>
            <p className="mb-3 text-sm text-hub-text-muted">
              {t('grid.tickets.count.board', { count: meta?.total ?? tickets.length })}
            </p>
            <div className="scrollbar-minimal-x -mx-1 overflow-x-auto pb-2 xl:mx-0 xl:overflow-visible">
            <GridKanbanBoard
              columns={ticketColumns}
              columnsGridClass="min-w-[min(100%,88rem)] lg:grid-cols-2 xl:min-w-0 xl:grid-cols-3 2xl:grid-cols-6"
              items={tickets}
              getColumnId={(item) => item.status}
              applyColumn={applyTicketStatus}
              onItemsChange={setTickets}
              onItemMove={handleTicketMove}
              confirmColumnMove={confirmTicketColumnMove}
              canDragItem={canDragTicket}
              canDropToColumn={(ticket, from, to) => ticketKanbanDropAllowed(ticket, from, to)}
              renderCard={(ticket, { isDragging }) => (
                <GridTicketKanbanCard
                  ticket={ticket}
                  isDragging={isDragging || movingId === ticket.id}
                  onEdit={() => openEdit(ticket)}
                  onAssign={() => openAssign(ticket)}
                  onApprove={() => setApproveTarget(ticket)}
                  onEvaluate={() => setEvaluateTarget(ticket)}
                  onDelete={() => void handleDelete(ticket)}
                />
              )}
            />
            </div>
          </>
        )
      ) : (
        <ConnectCard>
          <p className="border-b border-hub-border/60 px-4 py-3 text-sm text-hub-text-muted sm:px-6">
            {loading ? t('common.loading') : t('grid.tickets.count.list', { count: meta?.total ?? 0 })}
          </p>
          {loading ? (
            <ConnectLoadingSpinner label={t('grid.dashboard.recentTickets.loading')} className="min-h-[280px]" />
          ) : (
            <>
              <div className="grid gap-4 p-4 lg:hidden">
                {tickets.map((item) => (
                  <GridTicketCard
                    key={item.id}
                    ticket={item}
                    onView={() => openView(item)}
                    onEdit={() => openEdit(item)}
                    onAssign={() => openAssign(item)}
                    onDelete={() => void handleDelete(item)}
                  />
                ))}
              </div>

              <div className="hidden lg:block">
                <ConnectTableScroll>
                  <table className="w-full min-w-[900px] text-sm">
                    <thead className="glass-thead text-hub-text-muted">
                      <tr>
                        <th className="px-4 py-3 text-left">{t('grid.tickets.table.id')}</th>
                        <th className="px-4 py-3 text-left">{t('grid.tickets.table.requester')}</th>
                        <th className="px-4 py-3 text-left">{t('grid.tickets.table.title')}</th>
                        <th className="px-4 py-3 text-left">{t('grid.tickets.table.summary')}</th>
                        <th className="px-4 py-3 text-left">{t('grid.tickets.table.roomBlock')}</th>
                        <th className="px-4 py-3 text-left">{t('grid.tickets.table.priority')}</th>
                        <th className="px-4 py-3 text-left">{t('grid.tickets.table.openedAt')}</th>
                        <th className="px-4 py-3 text-left">{t('connect.table.status')}</th>
                        <th className="px-4 py-3 text-left">{t('grid.tickets.table.assignee')}</th>
                        <th className="px-4 py-3">{t('connect.common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((item) => (
                        <tr key={item.id} className="border-t border-hub-border/40">
                          <td className="whitespace-nowrap px-4 py-3 font-medium">{item.code}</td>
                          <td className="px-4 py-3">{item.requester}</td>
                          <td className="px-4 py-3 font-medium">{item.title}</td>
                          <td className="max-w-[200px] truncate px-4 py-3 text-hub-text-muted">{item.summary}</td>
                          <td className="px-4 py-3">
                            {item.room} / {item.block}
                          </td>
                          <td className="px-4 py-3">
                            <GridPriorityBadge priority={item.priority} />
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">{formatDateTime(item.opened_at)}</td>
                          <td className="px-4 py-3">
                            <GridTicketStatusBadge status={item.status} />
                          </td>
                          <td className="px-4 py-3">{item.assignee || '—'}</td>
                          <td className="px-4 py-3 text-right">
                            <ConnectRowActionsMenu
                              ariaLabel={t('connect.common.actionsOf', { name: item.code })}
                              actions={[
                                { key: 'view', label: t('connect.common.view'), icon: Eye, onClick: () => openView(item) },
                                { key: 'edit', label: t('connect.common.edit'), icon: Pencil, onClick: () => openEdit(item) },
                                { key: 'assign', label: t('grid.tickets.actions.assign'), icon: UserCheck, onClick: () => openAssign(item) },
                                { key: 'delete', label: t('connect.common.delete'), icon: Trash2, variant: 'danger', onClick: () => void handleDelete(item) },
                              ]}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ConnectTableScroll>
              </div>
              <ConnectPagination meta={meta} onPageChange={setPage} />
            </>
          )}
        </ConnectCard>
      )}

      <ConnectDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingId ? t('grid.tickets.drawer.edit') : t('grid.tickets.drawer.new')}
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
          <FormField label={t('grid.control.form.requester')} required>
            <input className={inputClass} value={form.requester} onChange={(e) => setForm({ ...form, requester: e.target.value })} />
          </FormField>
          <FormField label={t('grid.control.form.title')} required>
            <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label={t('grid.control.form.summary')}>
              <textarea className={`${inputClass} min-h-[80px] py-2`} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
            </FormField>
          </div>
          <FormField label={t('grid.control.form.room')}>
            <input className={inputClass} value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
          </FormField>
          <FormField label={t('grid.control.form.block')}>
            <select className={selectClass} value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })}>
              <option value="">—</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </FormField>
          <FormField label={t('grid.control.form.priority')}>
            <select className={selectClass} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as typeof form.priority })}>
              <option value="alta">{t('grid.tasks.form.priorityHigh')}</option>
              <option value="media">{t('grid.tasks.form.priorityMedium')}</option>
              <option value="baixa">{t('grid.tasks.form.priorityLow')}</option>
            </select>
          </FormField>
          <FormField label={t('grid.tickets.filters.status')}>
            <select className={selectClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as GridTicketStatus })}>
              <option value="aberto">{t('grid.tickets.columns.open')}</option>
              <option value="em_atendimento">{t('grid.tickets.columns.inService')}</option>
              <option value="aguardando_aprovacao">{t('grid.tickets.columns.awaitingApproval')}</option>
              <option value="avaliacao_pendente">{t('grid.tickets.columns.awaitingEvaluation')}</option>
              <option value="concluido">{t('grid.tickets.columns.finished')}</option>
              <option value="pendente">{t('grid.tickets.columns.pending')}</option>
            </select>
          </FormField>
          <FormField label={t('grid.tickets.table.assignee')}>
            <select className={selectClass} value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })}>
              <option value="">{t('grid.common.noResponsible')}</option>
              {technicians.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </FormField>
          <GridTicketAttachmentsPanel
            ticketId={editingId}
            attachments={ticketAttachments}
            pendingFiles={pendingAttachments}
            onPendingFilesChange={setPendingAttachments}
            onAttachmentsChange={setTicketAttachments}
          />

          {editingId && (
            <>
              <div className="sm:col-span-2">
                <FormField label={t('grid.control.form.fixedDescription')}>
                  <textarea
                    className={`${inputClass} min-h-[72px] py-2`}
                    value={form.fixed_description ?? ''}
                    onChange={(e) => setForm({ ...form, fixed_description: e.target.value })}
                  />
                </FormField>
              </div>
              <div className="sm:col-span-2">
                <FormField label={t('grid.control.form.considerations')}>
                  <textarea
                    className={`${inputClass} min-h-[72px] py-2`}
                    value={form.considerations ?? ''}
                    onChange={(e) => setForm({ ...form, considerations: e.target.value })}
                  />
                </FormField>
              </div>
            </>
          )}
        </div>
      </ConnectDrawer>

      <ConnectDrawer
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title={t('grid.tickets.assign.title')}
        subtitle={assignTarget ? assignTarget.code : ''}
        footer={
          <div className="flex justify-end gap-2">
            <OutlineButton onClick={() => setAssignOpen(false)}>{t('common.cancel')}</OutlineButton>
            <PrimaryButton onClick={() => void handleAssign()} disabled={saving}>{t('common.save')}</PrimaryButton>
          </div>
        }
      >
        <FormField label={t('grid.tickets.assign.technician')}>
          <select className={selectClass} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">{t('grid.common.noResponsible')}</option>
            {technicians.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </FormField>
      </ConnectDrawer>

      <GridApproveServiceDrawer
        ticket={approveTarget}
        open={approveTarget !== null}
        onClose={() => setApproveTarget(null)}
        onApproved={() => {
          load()
          loadDashboard()
        }}
        approverName={user?.name ?? t('grid.tickets.defaultApprover')}
      />

      <GridEvaluateTicketDrawer
        ticket={evaluateTarget}
        open={evaluateTarget !== null}
        onClose={() => setEvaluateTarget(null)}
        onEvaluated={() => {
          load()
          loadDashboard()
        }}
      />

      <ConnectEntityViewDrawer
        kind="grid-ticket"
        entityId={null}
        open={viewSnapshot !== null}
        onClose={closeView}
        snapshot={viewSnapshot ?? undefined}
      />

      <GridKanbanMoveConfirmModal
        open={moveConfirm != null}
        itemLabel={moveConfirm ? `${moveConfirm.ticket.code} — ${moveConfirm.ticket.title}` : ''}
        fromLabel={moveConfirmFromLabel ?? ''}
        toLabel={moveConfirmToLabel ?? ''}
        warning={moveConfirmNeedsAssignee ? t('grid.kanban.confirmMove.noAssigneeTicket') : null}
        showAssignAction={moveConfirmNeedsAssignee}
        assignActionLabel={t('grid.tickets.actions.assign')}
        confirmDisabled={!moveConfirmCanProceed}
        onConfirm={() => closeMoveConfirm(true)}
        onCancel={() => closeMoveConfirm(false)}
        onAssign={handleMoveConfirmAssign}
      />
    </div>
  )
}
