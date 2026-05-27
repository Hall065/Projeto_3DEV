import { Plus, Search, Signpost } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ConnectDrawer } from '../../components/connect/ConnectDrawer'
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
import { GridTicketStatusBadge } from '../../components/grid/GridBadges'
import { GridTicketControlPanel, GridTicketControlPanelSkeleton } from '../../components/grid/GridTicketControlPanel'
import { useAuth } from '../../contexts/AuthContext'
import { gridService } from '../../services/gridService'
import type { GridPriority, GridTicket, GridTicketReport } from '../../types/grid'

export function GridTicketControlPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tickets, setTickets] = useState<GridTicket[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [search, setSearch] = useState('')
  const [includeFinished, setIncludeFinished] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [ticket, setTicket] = useState<GridTicket | null>(null)
  const [report, setReport] = useState<GridTicketReport | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [technicians, setTechnicians] = useState<string[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [createSaving, setCreateSaving] = useState(false)
  const [createForm, setCreateForm] = useState({
    requester: '',
    title: '',
    summary: '',
    room: '',
    block: '',
    priority: 'media' as GridPriority,
  })

  const actorName = user?.name ?? 'Operador Grid'

  const loadList = useCallback(() => {
    setLoadingList(true)
    const params: Record<string, string | number> = { per_page: 150 }
    if (search.trim()) params.search = search.trim()
    gridService
      .getTickets(params)
      .then((res) => setTickets(res.data))
      .finally(() => setLoadingList(false))
  }, [search])

  const loadDetail = useCallback(async (id: number) => {
    setLoadingDetail(true)
    try {
      const [t, r] = await Promise.all([gridService.getTicket(id), gridService.getTicketReport(id)])
      setTicket(t)
      setReport(r)
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  useEffect(() => {
    loadList()
  }, [loadList])

  useEffect(() => {
    gridService.getUsers({ per_page: 50, role: 'Técnico de manutenção' }).then((res) => {
      const names = res.data.map((u) => u.name)
      setTechnicians(names.length ? names : res.data.map((u) => u.name))
    })
  }, [])

  useEffect(() => {
    const paramId = searchParams.get('id')
    if (paramId) {
      const id = Number(paramId)
      if (!Number.isNaN(id)) setSelectedId(id)
    }
  }, [searchParams])

  useEffect(() => {
    if (!selectedId) {
      setTicket(null)
      setReport(null)
      return
    }
    void loadDetail(selectedId)
    setSearchParams({ id: String(selectedId) }, { replace: true })
  }, [selectedId, loadDetail, setSearchParams])

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => includeFinished || t.status !== 'concluido')
  }, [tickets, includeFinished])

  const selectTicket = (t: GridTicket) => {
    setSelectedId(t.id)
  }

  const refreshDetail = async () => {
    if (!selectedId) return
    await loadDetail(selectedId)
    loadList()
  }

  const handleCreate = async () => {
    if (!createForm.requester.trim() || !createForm.title.trim()) {
      window.alert('Informe solicitante e título.')
      return
    }
    setCreateSaving(true)
    try {
      const created = await gridService.createTicket({
        requester: createForm.requester.trim(),
        title: createForm.title.trim(),
        summary: createForm.summary.trim(),
        room: createForm.room.trim(),
        block: createForm.block.trim(),
        priority: createForm.priority,
      })
      setCreateOpen(false)
      setCreateForm({ requester: '', title: '', summary: '', room: '', block: '', priority: 'media' })
      loadList()
      setSelectedId(created.id)
    } finally {
      setCreateSaving(false)
    }
  }

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Controle de chamados"
        subtitle="Selecione um chamado e avance etapa a etapa, registrando observações em cada fase do fluxo."
        actions={
          <>
            <Link to="/grid/chamados">
              <OutlineButton type="button">Ver Kanban</OutlineButton>
            </Link>
            <PrimaryButton onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Novo chamado
            </PrimaryButton>
          </>
        }
      />

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-12">
        <ConnectCard className="flex min-h-[420px] flex-col lg:col-span-4 xl:col-span-3">
          <div className="border-b border-hub-border/60 p-4">
            <div className="flex items-center gap-2 text-hub-navy">
              <Signpost className="h-5 w-5 text-hub-red" />
              <h2 className="font-semibold">Chamados</h2>
            </div>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-hub-text-muted" />
              <input
                className={`${inputClass} pl-9`}
                placeholder="Buscar código, título..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-hub-text-muted">
              <input
                type="checkbox"
                checked={includeFinished}
                onChange={(e) => setIncludeFinished(e.target.checked)}
                className="rounded border-hub-border"
              />
              Incluir finalizados
            </label>
          </div>

          <div className="scrollbar-minimal flex-1 overflow-y-auto p-2">
            {loadingList ? (
              <ConnectLoadingSpinner label="Carregando lista..." className="min-h-[200px]" />
            ) : filteredTickets.length === 0 ? (
              <p className="p-4 text-center text-sm text-hub-text-muted">Nenhum chamado encontrado.</p>
            ) : (
              <ul className="space-y-1">
                {filteredTickets.map((t) => {
                  const active = t.id === selectedId
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => selectTicket(t)}
                        className={`w-full rounded-xl px-3 py-3 text-left transition-colors ${
                          active ? 'bg-hub-red/10 ring-1 ring-hub-red/30' : 'hover:bg-hub-bg/80'
                        }`}
                      >
                        <p className="text-xs font-semibold text-hub-red">{t.code}</p>
                        <p className="mt-0.5 line-clamp-2 text-sm font-medium text-hub-navy">{t.title}</p>
                        <div className="mt-2">
                          <GridTicketStatusBadge status={t.status} />
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </ConnectCard>

        <div className="min-w-0 lg:col-span-8 xl:col-span-9">
          {!selectedId ? (
            <ConnectCard className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
              <Signpost className="mb-4 h-12 w-12 text-hub-border" />
              <p className="text-lg font-semibold text-hub-navy">Selecione um chamado</p>
              <p className="mt-2 max-w-md text-sm text-hub-text-muted">
                Escolha um item na lista ao lado ou crie um novo chamado para conduzir o fluxo passo a passo.
              </p>
            </ConnectCard>
          ) : loadingDetail || !ticket ? (
            <ConnectCard className="p-6">
              <GridTicketControlPanelSkeleton />
            </ConnectCard>
          ) : (
            <ConnectCard className="p-4 sm:p-6">
              <GridTicketControlPanel
                ticket={ticket}
                report={report}
                technicians={technicians}
                actorName={actorName}
                saving={false}
                onRefresh={refreshDetail}
              />
            </ConnectCard>
          )}
        </div>
      </div>

      <ConnectDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Novo chamado"
        subtitle="O chamado será criado em Aberto (sem técnico)."
        footer={
          <div className="flex justify-end gap-2">
            <OutlineButton onClick={() => setCreateOpen(false)}>Cancelar</OutlineButton>
            <PrimaryButton onClick={() => void handleCreate()} disabled={createSaving}>
              {createSaving ? 'Salvando...' : 'Criar chamado'}
            </PrimaryButton>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Solicitante" required>
            <input
              className={inputClass}
              value={createForm.requester}
              onChange={(e) => setCreateForm({ ...createForm, requester: e.target.value })}
            />
          </FormField>
          <FormField label="Título" required>
            <input
              className={inputClass}
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
            />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Resumo">
              <textarea
                className={`${inputClass} min-h-[72px] py-2`}
                value={createForm.summary}
                onChange={(e) => setCreateForm({ ...createForm, summary: e.target.value })}
              />
            </FormField>
          </div>
          <FormField label="Sala">
            <input
              className={inputClass}
              value={createForm.room}
              onChange={(e) => setCreateForm({ ...createForm, room: e.target.value })}
            />
          </FormField>
          <FormField label="Bloco">
            <select
              className={selectClass}
              value={createForm.block}
              onChange={(e) => setCreateForm({ ...createForm, block: e.target.value })}
            >
              <option value="">—</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </FormField>
          <FormField label="Prioridade">
            <select
              className={selectClass}
              value={createForm.priority}
              onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value as GridPriority })}
            >
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </FormField>
        </div>
      </ConnectDrawer>
    </div>
  )
}
