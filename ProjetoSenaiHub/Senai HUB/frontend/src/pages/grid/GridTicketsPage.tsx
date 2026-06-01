import { AlertTriangle, CheckCircle2, ClipboardList, Filter, LayoutGrid, List, Pencil, Plus, Trash2, UserCheck, Wrench } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { ConnectDrawer } from '../../components/connect/ConnectDrawer'
import { ConnectEntityViewDrawer } from '../../components/connect/ConnectEntityViewDrawer'
import { ConnectRowActionsMenu } from '../../components/connect/ConnectRowActionsMenu'
import { viewRowAction } from '../../components/connect/connectViewActions'
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
import { GridApproveServiceDrawer } from '../../components/grid/GridApproveServiceDrawer'
import { GridEvaluateTicketDrawer } from '../../components/grid/GridEvaluateTicketDrawer'
import { canDragTicket, canMoveTicketTo, ticketMoveBlockedMessage } from '../../utils/gridTicketWorkflow'
import { applyTicketStatus, GridTicketKanbanCard } from '../../components/grid/GridTicketKanbanCard'
import { useAuth } from '../../contexts/AuthContext'
import { GridTicketCard } from '../../components/grid/GridTicketCard'
import { gridService } from '../../services/gridService'
import type { GridDashboardData, GridPriority, GridTicket, GridTicketStatus, PaginatedMeta } from '../../types/grid'
import { confirmDelete } from '../../utils/confirmAction'

const ticketColumns: KanbanColumnDef<GridTicketStatus>[] = [
  { id: 'aberto', label: 'Abertos', dot: 'bg-blue-500', headerBg: 'bg-blue-50' },
  { id: 'pendente', label: 'Pendentes', dot: 'bg-slate-400', headerBg: 'bg-slate-50' },
  { id: 'em_atendimento', label: 'Em atendimento', dot: 'bg-amber-500', headerBg: 'bg-amber-50' },
  { id: 'aguardando_aprovacao', label: 'Aprovação chefe', dot: 'bg-yellow-500', headerBg: 'bg-yellow-50' },
  { id: 'avaliacao_pendente', label: 'Avaliação solicitante', dot: 'bg-violet-500', headerBg: 'bg-violet-50' },
  { id: 'concluido', label: 'Finalizados', dot: 'bg-emerald-500', headerBg: 'bg-emerald-50' },
]

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
  const { user } = useAuth()
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
    gridService.getDashboard().then(setDashboard)
    gridService.getUsers({ per_page: 50, role: 'Técnico de manutenção' }).then((res) => {
      const names = res.data.map((u) => u.name)
      setTechnicians(names.length ? names : res.data.map((u) => u.name))
    })
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDrawerOpen(true)
  }

  const openEdit = (ticket: GridTicket) => {
    setEditingId(ticket.id)
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
      window.alert('Informe solicitante e título.')
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
      if (editingId) {
        await gridService.updateTicket(editingId, payload)
      } else {
        await gridService.createTicket(payload)
      }
      setDrawerOpen(false)
      load()
      gridService.getDashboard().then(setDashboard)
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
      load()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (ticket: GridTicket) => {
    if (!confirmDelete(`o chamado "${ticket.code}"`)) return
    await gridService.deleteTicket(ticket.id)
    load()
    gridService.getDashboard().then(setDashboard)
  }

  const handleTicketMove = useCallback(
    async (ticketId: number, newStatus: GridTicketStatus) => {
      const current = tickets.find((t) => t.id === ticketId)
      if (!current) return

      const blocked = ticketMoveBlockedMessage(current, newStatus)
      if (blocked && !canMoveTicketTo(current, newStatus)) {
        window.alert(blocked)
        return
      }

      if (!canMoveTicketTo(current, newStatus)) {
        window.alert(blocked ?? 'Movimento não permitido para este chamado.')
        return
      }

      const snapshot = tickets
      setMovingId(ticketId)
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? applyTicketStatus(t, newStatus) : t)))

      try {
        const payload: Partial<GridTicket> = { status: newStatus }
        if (newStatus === 'aberto' && current.status === 'pendente') {
          payload.assignee = ''
        }
        const updated = await gridService.updateTicket(ticketId, payload)
        setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)))
        gridService.getDashboard().then(setDashboard)
      } catch (e: unknown) {
        setTickets(snapshot)
        const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
        const msg =
          err?.response?.data?.errors?.status?.[0] ??
          err?.response?.data?.message ??
          'Não foi possível mover o chamado.'
        window.alert(msg)
      } finally {
        setMovingId(null)
      }
    },
    [tickets],
  )

  const kpis = dashboard?.kpis
  const spark = dashboard?.kpi_sparklines
  const urgentCount = dashboard?.kpis.urgent_tickets ?? dashboard?.report_kpis?.urgent ?? 0

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Chamados"
        subtitle={
          viewMode === 'board'
            ? 'Arraste os cards entre as colunas para alterar o status do chamado.'
            : 'Gerencie e acompanhe todos os chamados de manutenção.'
        }
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
                <LayoutGrid className="h-4 w-4" /> Quadro
              </button>
              <button
                type="button"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'list' ? 'bg-hub-navy text-white' : 'text-hub-text-muted hover:bg-white/60'
                }`}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" /> Lista
              </button>
            </div>
            <PrimaryButton onClick={openCreate}>
              <Plus className="h-4 w-4" /> Novo chamado
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
              label="Chamados abertos"
              value={kpis.open_tickets}
              variant="blue"
              sparkline={spark?.open_tickets ?? []}
            />
            <KpiCard
              icon={AlertTriangle}
              label="Urgentes (alta)"
              value={urgentCount}
              variant="senai"
              sparkline={spark?.urgent ?? []}
            />
            <KpiCard
              icon={Wrench}
              label="Em andamento"
              value={kpis.in_progress}
              variant="coral"
              sparkline={spark?.in_progress ?? []}
            />
            <KpiCard
              icon={CheckCircle2}
              label="Concluídos no mês"
              value={kpis.completed_month}
              variant="green"
              sparkline={spark?.completed_month ?? []}
            />
          </>
        )}
      </div>

      <ConnectCard className="mb-4 p-4">
        <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Busca">
            <input
              className={inputClass}
              placeholder="ID, título, solicitante..."
              value={search}
              onChange={(e) => {
                setPage(1)
                setSearch(e.target.value)
              }}
            />
          </FormField>
          <FormField label="Bloco">
            <select className={selectClass} value={block} onChange={(e) => { setPage(1); setBlock(e.target.value) }}>
              <option value="">Todos os blocos</option>
              <option value="A">Bloco A</option>
              <option value="B">Bloco B</option>
              <option value="C">Bloco C</option>
            </select>
          </FormField>
          <FormField label="Prioridade">
            <select className={selectClass} value={priority} onChange={(e) => { setPage(1); setPriority(e.target.value) }}>
              <option value="">Todas</option>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </FormField>
          <FormField label="Status">
            <select className={selectClass} value={status} onChange={(e) => { setPage(1); setStatus(e.target.value) }}>
              <option value="">Todos</option>
              <option value="aberto">Aberto</option>
              <option value="pendente">Pendente</option>
              <option value="em_atendimento">Em atendimento</option>
              <option value="aguardando_aprovacao">Aguardando aprovação</option>
              <option value="avaliacao_pendente">Avaliação pendente</option>
              <option value="concluido">Finalizado</option>
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
              <Filter className="h-4 w-4" /> Limpar filtros
            </OutlineButton>
          </div>
        </div>
      </ConnectCard>

      {viewMode === 'board' ? (
        loading ? (
          <ConnectLoadingSpinner label="Carregando chamados..." className="min-h-[400px]" />
        ) : (
          <>
            <p className="mb-3 text-sm text-hub-text-muted">{meta?.total ?? tickets.length} chamados no quadro</p>
            <div className="scrollbar-minimal-x -mx-1 overflow-x-auto pb-2 xl:mx-0 xl:overflow-visible">
            <GridKanbanBoard
              columns={ticketColumns}
              columnsGridClass="min-w-[min(100%,88rem)] lg:grid-cols-2 xl:min-w-0 xl:grid-cols-3 2xl:grid-cols-6"
              items={tickets}
              getColumnId={(t) => t.status}
              applyColumn={applyTicketStatus}
              onItemsChange={setTickets}
              onItemMove={handleTicketMove}
              canDragItem={canDragTicket}
              canDropToColumn={(ticket, from, to) => canMoveTicketTo(ticket, to, from)}
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
            {loading ? 'Carregando...' : `${meta?.total ?? 0} chamados encontrados`}
          </p>
          {loading ? (
            <ConnectLoadingSpinner label="Carregando chamados..." className="min-h-[280px]" />
          ) : (
            <>
              <div className="grid gap-4 p-4 lg:hidden">
                {tickets.map((t) => (
                  <GridTicketCard
                    key={t.id}
                    ticket={t}
                    onView={() => setViewSnapshot(t)}
                    onEdit={() => openEdit(t)}
                    onAssign={() => openAssign(t)}
                    onDelete={() => void handleDelete(t)}
                  />
                ))}
              </div>

              <div className="hidden lg:block">
                <ConnectTableScroll>
                  <table className="w-full min-w-[900px] text-sm">
                    <thead className="glass-thead text-hub-text-muted">
                      <tr>
                        <th className="px-4 py-3 text-left">ID</th>
                        <th className="px-4 py-3 text-left">Solicitante</th>
                        <th className="px-4 py-3 text-left">Título</th>
                        <th className="px-4 py-3 text-left">Descrição resumida</th>
                        <th className="px-4 py-3 text-left">Sala / Bloco</th>
                        <th className="px-4 py-3 text-left">Prioridade</th>
                        <th className="px-4 py-3 text-left">Data de abertura</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Responsável</th>
                        <th className="px-4 py-3">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((t) => (
                        <tr key={t.id} className="border-t border-hub-border/40">
                          <td className="whitespace-nowrap px-4 py-3 font-medium">{t.code}</td>
                          <td className="px-4 py-3">{t.requester}</td>
                          <td className="px-4 py-3 font-medium">{t.title}</td>
                          <td className="max-w-[200px] truncate px-4 py-3 text-hub-text-muted">{t.summary}</td>
                          <td className="px-4 py-3">
                            {t.room} / {t.block}
                          </td>
                          <td className="px-4 py-3">
                            <GridPriorityBadge priority={t.priority} />
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">{formatDateTime(t.opened_at)}</td>
                          <td className="px-4 py-3">
                            <GridTicketStatusBadge status={t.status} />
                          </td>
                          <td className="px-4 py-3">{t.assignee || '—'}</td>
                          <td className="px-4 py-3 text-right">
                            <ConnectRowActionsMenu
                              ariaLabel={`Ações do chamado ${t.code}`}
                              actions={[
                                viewRowAction(() => setViewSnapshot(t)),
                                { key: 'edit', label: 'Editar', icon: Pencil, onClick: () => openEdit(t) },
                                { key: 'assign', label: 'Atribuir técnico', icon: UserCheck, onClick: () => openAssign(t) },
                                { key: 'delete', label: 'Excluir', icon: Trash2, variant: 'danger', onClick: () => void handleDelete(t) },
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
        title={editingId ? 'Editar chamado' : 'Novo chamado'}
        subtitle="Preencha os dados do chamado de manutenção."
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
          <FormField label="Solicitante" required>
            <input className={inputClass} value={form.requester} onChange={(e) => setForm({ ...form, requester: e.target.value })} placeholder="Ex: Prof. Carlos Lima" />
          </FormField>
          <FormField label="Título" required>
            <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Ar-condicionado sem refrigeração" />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Resumo">
              <textarea className={`${inputClass} min-h-[80px] py-2`} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="Descreva o problema, localização e urgência..." />
            </FormField>
          </div>
          <FormField label="Sala">
            <input className={inputClass} value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="Ex: 204" />
          </FormField>
          <FormField label="Bloco">
            <select className={selectClass} value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })}>
              <option value="">Selecione</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </FormField>
          <FormField label="Prioridade">
            <select className={selectClass} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as typeof form.priority })}>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </FormField>
          <FormField label="Status">
            <select className={selectClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as GridTicketStatus })}>
              <option value="aberto">Aberto</option>
              <option value="em_atendimento">Em atendimento</option>
              <option value="aguardando_aprovacao">Aguardando aprovação</option>
              <option value="avaliacao_pendente">Avaliação pendente</option>
              <option value="concluido">Finalizado</option>
              <option value="pendente">Pendente</option>
            </select>
          </FormField>
          <FormField label="Responsável">
            <select className={selectClass} value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })}>
              <option value="">Sem responsável</option>
              {technicians.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </FormField>
          {editingId && (
            <>
              <div className="sm:col-span-2">
                <FormField label="O que foi consertado">
                  <textarea
                    className={`${inputClass} min-h-[72px] py-2`}
                    value={form.fixed_description ?? ''}
                    onChange={(e) => setForm({ ...form, fixed_description: e.target.value })}
                    placeholder="Descreva o reparo realizado..."
                  />
                </FormField>
              </div>
              <div className="sm:col-span-2">
                <FormField label="Considerações / resolução">
                  <textarea
                    className={`${inputClass} min-h-[72px] py-2`}
                    value={form.considerations ?? ''}
                    onChange={(e) => setForm({ ...form, considerations: e.target.value })}
                    placeholder="Observações finais do atendimento..."
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
        title="Atribuir técnico"
        subtitle={assignTarget ? `Chamado ${assignTarget.code}` : ''}
        footer={
          <div className="flex justify-end gap-2">
            <OutlineButton onClick={() => setAssignOpen(false)}>Cancelar</OutlineButton>
            <PrimaryButton onClick={() => void handleAssign()} disabled={saving}>Salvar</PrimaryButton>
          </div>
        }
      >
        <FormField label="Técnico responsável">
          <select className={selectClass} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">Sem responsável</option>
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
          gridService.getDashboard().then(setDashboard)
        }}
        approverName={user?.name ?? 'Chefe de Manutenção'}
      />

      <GridEvaluateTicketDrawer
        ticket={evaluateTarget}
        open={evaluateTarget !== null}
        onClose={() => setEvaluateTarget(null)}
        onEvaluated={() => {
          load()
          gridService.getDashboard().then(setDashboard)
        }}
      />

      <ConnectEntityViewDrawer
        kind="grid-ticket"
        entityId={null}
        open={viewSnapshot !== null}
        onClose={() => setViewSnapshot(null)}
        snapshot={viewSnapshot ?? undefined}
      />
    </div>
  )
}
