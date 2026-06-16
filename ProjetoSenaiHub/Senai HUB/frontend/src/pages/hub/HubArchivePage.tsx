import { Archive, ClipboardList, GraduationCap, Loader2, RefreshCw, Shield, Wrench } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  ConnectCard,
  ConnectLoadingSpinner,
  ConnectPageHeader,
  ConnectPagination,
  ConnectTableScroll,
  EMPTY,
  formatDate,
  inputClass,
  OutlineButton,
  PrimaryButton,
  selectClass,
  StatusBadge,
} from '../../components/connect/ConnectShared'
import { GridTicketStatusBadge } from '../../components/grid/GridBadges'
import { SafeStatusBadge } from '../../components/safe/SafeStatusBadge'
import { useCrudToast } from '../../hooks/useCrudToast'
import { usePermissions } from '../../hooks/usePermissions'
import { archiveService, type ArchiveModuleKey, type ArchiveSummary } from '../../services/archiveService'
import type { ConnectClass, PaginatedMeta } from '../../types/connect'
import type { GridTicket } from '../../types/grid'
import type { SafeAuthorization } from '../../types/safe'

type TabKey = ArchiveModuleKey

export function HubArchivePage() {
  const { t } = useTranslation()
  const crudToast = useCrudToast()
  const { isAdmin, canAny } = usePermissions()
  const [summary, setSummary] = useState<ArchiveSummary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [runningAuto, setRunningAuto] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('connect')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<PaginatedMeta | undefined>()
  const [loadingList, setLoadingList] = useState(false)
  const [connectClasses, setConnectClasses] = useState<ConnectClass[]>([])
  const [gridTickets, setGridTickets] = useState<GridTicket[]>([])
  const [safeItems, setSafeItems] = useState<SafeAuthorization[]>([])
  const [safeStatus, setSafeStatus] = useState('')

  const availableTabs = useMemo((): TabKey[] => {
    if (!summary) return []
    return (['connect', 'grid', 'safe'] as const).filter((key) => summary.modules[key] != null)
  }, [summary])

  const { notifyError } = crudToast

  const loadSummary = useCallback(() => {
    setLoadingSummary(true)
    archiveService
      .getSummary()
      .then((data) => {
        setSummary(data)
        const tabs = (['connect', 'grid', 'safe'] as const).filter((key) => data.modules[key] != null)
        if (tabs.length > 0) {
          setActiveTab((current) => (tabs.includes(current) ? current : tabs[0]))
        }
      })
      .catch((err) => notifyError(err, t('archive.loadError')))
      .finally(() => setLoadingSummary(false))
  }, [notifyError, t])

  const loadList = useCallback(() => {
    if (!summary?.modules[activeTab]) return
    setLoadingList(true)
    const params: Record<string, string | number> = { page, per_page: 10, search }
    const request =
      activeTab === 'connect'
        ? archiveService.getConnectClasses(params)
        : activeTab === 'grid'
          ? archiveService.getGridTickets(params)
          : archiveService.getSafeAuthorizations({ ...params, ...(safeStatus ? { status: safeStatus } : {}) })

    request
      .then((res) => {
        setMeta(res.meta)
        if (activeTab === 'connect') setConnectClasses(res.data as ConnectClass[])
        else if (activeTab === 'grid') setGridTickets(res.data as GridTicket[])
        else setSafeItems(res.data as SafeAuthorization[])
      })
      .catch((err) => notifyError(err, t('archive.loadError')))
      .finally(() => setLoadingList(false))
  }, [activeTab, page, safeStatus, search, summary, notifyError, t])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  useEffect(() => {
    loadList()
  }, [loadList])

  const handleRunAutoArchive = async () => {
    setRunningAuto(true)
    try {
      const res = await archiveService.runAutoArchive()
      crudToast.notifySuccess(res.message)
      loadSummary()
      if (activeTab === 'connect') loadList()
    } catch (err) {
      crudToast.notifyError(err, t('archive.autoArchiveError'))
    } finally {
      setRunningAuto(false)
    }
  }

  const tabLabel = (key: TabKey) => t(`archive.tabs.${key}`)

  const canSeeArchive =
    isAdmin ||
    canAny('connect.classes.view', 'connect.classes.manage') ||
    canAny('grid.tickets.view', 'grid.tickets.manage') ||
    canAny('safe.access', 'safe.authorizations.manage', 'safe.approve', 'safe.portaria')

  if (!canSeeArchive) {
    return (
      <ConnectCard className="p-8 text-center text-sm text-hub-text-muted">
        {t('archive.noAccess')}
      </ConnectCard>
    )
  }

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title={t('archive.title')}
        subtitle={t('archive.subtitle')}
        actions={
          <OutlineButton onClick={() => { loadSummary(); loadList() }}>
            <RefreshCw className="h-4 w-4" />
            {t('archive.refresh')}
          </OutlineButton>
        }
      />

      {loadingSummary || !summary ? (
        <div className="flex items-center justify-center py-16 text-hub-text-muted">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          {t('common.loading')}
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summary.modules.connect && (
              <ConnectCard className="p-4">
                <div className="flex items-center gap-2 text-hub-navy">
                  <GraduationCap className="h-5 w-5 text-hub-red" />
                  <span className="font-semibold">{t('archive.summary.connectClasses')}</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-hub-navy">{summary.modules.connect.classes_count ?? 0}</p>
                <p className="mt-1 text-xs text-hub-text-muted">
                  {t('archive.summary.attendanceSessions', { count: summary.modules.connect.attendance_sessions_count ?? 0 })}
                </p>
              </ConnectCard>
            )}
            {summary.modules.grid && (
              <ConnectCard className="p-4">
                <div className="flex items-center gap-2 text-hub-navy">
                  <Wrench className="h-5 w-5 text-hub-red" />
                  <span className="font-semibold">{t('archive.summary.gridTickets')}</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-hub-navy">{summary.modules.grid.tickets_count ?? 0}</p>
              </ConnectCard>
            )}
            {summary.modules.safe && (
              <ConnectCard className="p-4">
                <div className="flex items-center gap-2 text-hub-navy">
                  <Shield className="h-5 w-5 text-hub-red" />
                  <span className="font-semibold">{t('archive.summary.safeAuthorizations')}</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-hub-navy">{summary.modules.safe.authorizations_count ?? 0}</p>
              </ConnectCard>
            )}
            {summary.auto_archive.can_run && summary.auto_archive.pending_classes > 0 && (
              <ConnectCard className="border-amber-200 bg-amber-50/80 p-4">
                <div className="flex items-center gap-2 text-amber-900">
                  <Archive className="h-5 w-5" />
                  <span className="font-semibold">{t('archive.autoArchive.pendingTitle')}</span>
                </div>
                <p className="mt-2 text-sm text-amber-900">
                  {t('archive.autoArchive.pendingBody', { count: summary.auto_archive.pending_classes })}
                </p>
                <div className="mt-3">
                  <PrimaryButton disabled={runningAuto} onClick={() => void handleRunAutoArchive()}>
                    {runningAuto ? t('archive.autoArchive.running') : t('archive.autoArchive.runNow')}
                  </PrimaryButton>
                </div>
              </ConnectCard>
            )}
          </div>

          {availableTabs.length === 0 ? (
            <ConnectCard className="p-8 text-center text-sm text-hub-text-muted">{t('archive.empty')}</ConnectCard>
          ) : (
            <ConnectCard className="min-w-0 overflow-hidden">
              <div className="flex flex-wrap gap-2 border-b border-hub-border/60 p-4">
                {availableTabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab)
                      setPage(1)
                      setSearch('')
                      setSafeStatus('')
                    }}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                      activeTab === tab ? 'bg-hub-navy text-white' : 'bg-hub-surface text-hub-text-muted hover:text-hub-navy'
                    }`}
                  >
                    {tabLabel(tab)}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 border-b border-hub-border/60 p-4">
                <input
                  className={`${inputClass} max-w-xs`}
                  placeholder={t('archive.searchPlaceholder')}
                  value={search}
                  onChange={(e) => {
                    setPage(1)
                    setSearch(e.target.value)
                  }}
                />
                {activeTab === 'safe' && (
                  <select
                    className={`${selectClass} max-w-xs`}
                    value={safeStatus}
                    onChange={(e) => {
                      setPage(1)
                      setSafeStatus(e.target.value)
                    }}
                  >
                    <option value="">{t('archive.safe.allArchived')}</option>
                    <option value="finalizado">{t('archive.safe.finalizado')}</option>
                    <option value="negado">{t('archive.safe.negado')}</option>
                  </select>
                )}
              </div>

              {loadingList ? (
                <ConnectLoadingSpinner className="min-h-[240px]" />
              ) : activeTab === 'connect' ? (
                <ConnectTableScroll>
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="glass-thead text-hub-text-muted">
                      <tr>
                        <th className="px-4 py-3 text-left">{t('connect.classes.table.className')}</th>
                        <th className="px-4 py-3 text-left">{t('connect.table.course')}</th>
                        <th className="px-4 py-3 text-left">{t('connect.classes.table.end')}</th>
                        <th className="px-4 py-3 text-left">{t('archive.columns.students')}</th>
                        <th className="px-4 py-3 text-left">{t('archive.columns.sessions')}</th>
                        <th className="px-4 py-3 text-left">{t('connect.table.status')}</th>
                        <th className="px-4 py-3 text-right">{t('connect.common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {connectClasses.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-10 text-center text-hub-text-muted">
                            {t('archive.noRecords')}
                          </td>
                        </tr>
                      ) : (
                        connectClasses.map((turma) => (
                          <tr key={turma.id} className="border-t border-hub-border/40">
                            <td className="px-4 py-3 font-medium">{turma.name}</td>
                            <td className="px-4 py-3">{turma.course?.name ?? EMPTY}</td>
                            <td className="px-4 py-3">{formatDate(turma.end_date)}</td>
                            <td className="px-4 py-3">{turma.students_count ?? '—'}</td>
                            <td className="px-4 py-3">{turma.attendance_sessions_count ?? '—'}</td>
                            <td className="px-4 py-3">
                              <StatusBadge status={turma.status} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Link
                                to={`/connect/turmas?status=finished&search=${encodeURIComponent(turma.name)}`}
                                className="text-sm font-medium text-hub-red hover:underline"
                              >
                                {t('archive.openRecord')}
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </ConnectTableScroll>
              ) : activeTab === 'grid' ? (
                <ConnectTableScroll>
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="glass-thead text-hub-text-muted">
                      <tr>
                        <th className="px-4 py-3 text-left">{t('archive.columns.code')}</th>
                        <th className="px-4 py-3 text-left">{t('grid.tickets.table.title')}</th>
                        <th className="px-4 py-3 text-left">{t('grid.tickets.table.requester')}</th>
                        <th className="px-4 py-3 text-left">{t('connect.table.status')}</th>
                        <th className="px-4 py-3 text-right">{t('connect.common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gridTickets.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-10 text-center text-hub-text-muted">
                            {t('archive.noRecords')}
                          </td>
                        </tr>
                      ) : (
                        gridTickets.map((ticket) => (
                          <tr key={ticket.id} className="border-t border-hub-border/40">
                            <td className="px-4 py-3 font-medium text-hub-red">{ticket.code}</td>
                            <td className="px-4 py-3">{ticket.title}</td>
                            <td className="px-4 py-3">{ticket.requester}</td>
                            <td className="px-4 py-3">
                              <GridTicketStatusBadge status={ticket.status} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Link
                                to={`/grid/controle?id=${ticket.id}`}
                                className="text-sm font-medium text-hub-red hover:underline"
                              >
                                {t('archive.openRecord')}
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </ConnectTableScroll>
              ) : (
                <ConnectTableScroll>
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="glass-thead text-hub-text-muted">
                      <tr>
                        <th className="px-4 py-3 text-left">{t('safe.table.protocol')}</th>
                        <th className="px-4 py-3 text-left">{t('safe.table.student')}</th>
                        <th className="px-4 py-3 text-left">{t('safe.table.type')}</th>
                        <th className="px-4 py-3 text-left">{t('safe.table.status')}</th>
                        <th className="px-4 py-3 text-right">{t('connect.common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safeItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-10 text-center text-hub-text-muted">
                            {t('archive.noRecords')}
                          </td>
                        </tr>
                      ) : (
                        safeItems.map((auth) => (
                          <tr key={auth.id} className="border-t border-hub-border/40">
                            <td className="px-4 py-3 font-medium text-hub-red">{auth.protocol}</td>
                            <td className="px-4 py-3">{auth.student_name}</td>
                            <td className="px-4 py-3">{auth.type_label}</td>
                            <td className="px-4 py-3">
                              <SafeStatusBadge status={auth.status} label={auth.status_label} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Link
                                to={`/safe/autorizacoes/${auth.id}`}
                                className="text-sm font-medium text-hub-red hover:underline"
                              >
                                {t('archive.openRecord')}
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </ConnectTableScroll>
              )}

              <ConnectPagination meta={meta} onPageChange={setPage} />
            </ConnectCard>
          )}

          <footer className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-hub-text-muted">
            <ClipboardList className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{t('archive.footerHint')}</p>
          </footer>
        </>
      )}
    </div>
  )
}
