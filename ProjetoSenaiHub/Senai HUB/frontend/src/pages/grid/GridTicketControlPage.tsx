import { Plus, Search, Signpost } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { GRID_API_ROLE_TECHNICIAN } from '../../constants/gridRoles'
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
import { GridTicketAttachmentsPanel, uploadPendingTicketAttachments } from '../../components/grid/GridTicketAttachmentsPanel'
import { GridTicketControlPanel, GridTicketControlPanelSkeleton } from '../../components/grid/GridTicketControlPanel'
import { useAuth } from '../../contexts/AuthContext'
import { gridService } from '../../services/gridService'
import type { GridPriority, GridTicket, GridTicketReport } from '../../types/grid'
import { useCrudToast } from '../../hooks/useCrudToast'

export function GridTicketControlPage() {
  const { t } = useTranslation()
  const crudToast = useCrudToast()
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
  const [createAttachments, setCreateAttachments] = useState<File[]>([])

  const actorName = user?.name ?? t('grid.control.defaultActor')

  const loadList = useCallback(() => {
    setLoadingList(true)
    const params: Record<string, string | number> = { per_page: 150 }
    if (search.trim()) params.search = search.trim()
    gridService
      .getTickets(params)
      .then((res) => setTickets(res.data))
      .catch((err) => crudToast.notifyError(err, t('common.error')))
      .finally(() => setLoadingList(false))
  }, [search, t, crudToast])

  const loadDetail = useCallback(async (id: number) => {
    setLoadingDetail(true)
    try {
      const [ticketData, reportData] = await Promise.all([gridService.getTicket(id), gridService.getTicketReport(id)])
      setTicket(ticketData)
      setReport(reportData)
    } catch (err: unknown) {
      setTicket(null)
      setReport(null)
      crudToast.notifyError(err, t('common.error'))
    } finally {
      setLoadingDetail(false)
    }
  }, [t])

  useEffect(() => {
    loadList()
  }, [loadList])

  useEffect(() => {
    gridService.getUsers({ per_page: 50, role: GRID_API_ROLE_TECHNICIAN }).then((res) => {
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
    return tickets.filter((item) => includeFinished || item.status !== 'concluido')
  }, [tickets, includeFinished])

  const selectTicket = (item: GridTicket) => {
    setSelectedId(item.id)
  }

  const refreshDetail = async () => {
    if (!selectedId) return
    await loadDetail(selectedId)
    loadList()
  }

  const handleCreate = async () => {
    if (!createForm.requester.trim() || !createForm.title.trim()) {
      crudToast.notifyWarning(t('grid.control.alert.required'))
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
      if (createAttachments.length > 0) {
        await uploadPendingTicketAttachments(created.id, createAttachments)
      }
      setCreateOpen(false)
      setCreateForm({ requester: '', title: '', summary: '', room: '', block: '', priority: 'media' })
      setCreateAttachments([])
      loadList()
      setSelectedId(created.id)
      crudToast.notifySaved(false)
    } catch (err: unknown) {
      crudToast.notifyError(err, t('common.error'))
    } finally {
      setCreateSaving(false)
    }
  }

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title={t('grid.control.title')}
        subtitle={t('grid.control.subtitle')}
        actions={
          <>
            <Link to="/grid/chamados">
              <OutlineButton type="button">{t('grid.control.actions.viewKanban')}</OutlineButton>
            </Link>
            <PrimaryButton onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> {t('grid.control.actions.newTicket')}
            </PrimaryButton>
          </>
        }
      />

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-12">
        <ConnectCard className="flex min-h-[420px] flex-col lg:col-span-4 xl:col-span-3">
          <div className="border-b border-hub-border/60 p-4">
            <div className="flex items-center gap-2 text-hub-navy">
              <Signpost className="h-5 w-5 text-hub-red" />
              <h2 className="font-semibold">{t('grid.control.list.title')}</h2>
            </div>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-hub-text-muted" />
              <input
                className={`${inputClass} pl-9`}
                placeholder={t('grid.control.list.searchPlaceholder')}
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
              {t('grid.control.list.includeFinished')}
            </label>
          </div>

          <div className="scrollbar-minimal flex-1 overflow-y-auto p-2">
            {loadingList ? (
              <ConnectLoadingSpinner label={t('grid.map.loading.list')} className="min-h-[200px]" />
            ) : filteredTickets.length === 0 ? (
              <p className="p-4 text-center text-sm text-hub-text-muted">{t('grid.control.states.empty')}</p>
            ) : (
              <ul className="space-y-1">
                {filteredTickets.map((item) => {
                  const active = item.id === selectedId
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => selectTicket(item)}
                        className={`w-full rounded-xl px-3 py-3 text-left transition-colors ${
                          active ? 'bg-hub-red/10 ring-1 ring-hub-red/30' : 'hover:bg-hub-bg/80'
                        }`}
                      >
                        <p className="text-xs font-semibold text-hub-red">{item.code}</p>
                        <p className="mt-0.5 line-clamp-2 text-sm font-medium text-hub-navy">{item.title}</p>
                        <div className="mt-2">
                          <GridTicketStatusBadge status={item.status} />
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
              <p className="text-lg font-semibold text-hub-navy">{t('grid.control.states.selectTitle')}</p>
              <p className="mt-2 max-w-md text-sm text-hub-text-muted">{t('grid.control.states.selectHint')}</p>
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
        title={t('grid.control.create.title')}
        subtitle={t('grid.control.create.hint')}
        footer={
          <div className="flex justify-end gap-2">
            <OutlineButton onClick={() => setCreateOpen(false)}>{t('common.cancel')}</OutlineButton>
            <PrimaryButton onClick={() => void handleCreate()} disabled={createSaving}>
              {createSaving ? t('connect.common.saving') : t('grid.control.create.submit')}
            </PrimaryButton>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t('grid.control.form.requester')} required>
            <input
              className={inputClass}
              value={createForm.requester}
              onChange={(e) => setCreateForm({ ...createForm, requester: e.target.value })}
            />
          </FormField>
          <FormField label={t('grid.control.form.title')} required>
            <input
              className={inputClass}
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
            />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label={t('grid.control.form.summary')}>
              <textarea
                className={`${inputClass} min-h-[72px] py-2`}
                value={createForm.summary}
                onChange={(e) => setCreateForm({ ...createForm, summary: e.target.value })}
              />
            </FormField>
          </div>
          <FormField label={t('grid.control.form.room')}>
            <input
              className={inputClass}
              value={createForm.room}
              onChange={(e) => setCreateForm({ ...createForm, room: e.target.value })}
            />
          </FormField>
          <FormField label={t('grid.control.form.block')}>
            <select
              className={selectClass}
              value={createForm.block}
              onChange={(e) => setCreateForm({ ...createForm, block: e.target.value })}
            >
              <option value="">—</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </FormField>
          <FormField label={t('grid.control.form.priority')}>
            <select
              className={selectClass}
              value={createForm.priority}
              onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value as GridPriority })}
            >
              <option value="alta">{t('grid.tasks.form.priorityHigh')}</option>
              <option value="media">{t('grid.tasks.form.priorityMedium')}</option>
              <option value="baixa">{t('grid.tasks.form.priorityLow')}</option>
            </select>
          </FormField>
          <GridTicketAttachmentsPanel
            pendingFiles={createAttachments}
            onPendingFilesChange={setCreateAttachments}
          />
        </div>
      </ConnectDrawer>
    </div>
  )
}
