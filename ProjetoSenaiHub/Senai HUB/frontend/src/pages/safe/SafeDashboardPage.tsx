import { useTranslation } from 'react-i18next'
import { CheckCircle2, ClipboardList, DoorOpen, ShieldAlert, UserCheck, XCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KpiCard, KpiCardSkeleton } from '../../components/connect/ConnectKpiCard'
import {
  ConnectCard,
  ConnectLoadingSpinner,
  ConnectPageHeader,
  ConnectTableScroll,
  EMPTY,
  formatDateTime,
  OutlineButton,
} from '../../components/connect/ConnectShared'
import { SafeStatusBadge } from '../../components/safe/SafeStatusBadge'
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus'
import { safeService } from '../../services/safeService'
import type { SafeDashboardData } from '../../types/safe'
import { parseApiError } from '../../utils/parseApiError'

export function SafeDashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [data, setData] = useState<SafeDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoadError(null)
    return safeService
      .getDashboard()
      .then(setData)
      .catch((e: unknown) => setLoadError(parseApiError(e, t('safe.dashboard.loadError'))))
  }, [])
  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])
  useRefetchOnFocus(load)

  const view = data?.view ?? 'aqv'

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title={t('safe.dashboard.title')}
        subtitle={t('safe.dashboard.subtitle')}
      />

      {loadError && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</p>
      )}

      {view === 'aqv' && data?.view === 'aqv' && (
        <>
          <div className="mb-6 grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <KpiCardSkeleton key={i} />)
            ) : (
              <>
                <KpiCard icon={ClipboardList} label={t('safe.dashboard.kpis.requestsToday')} value={data.kpis.requests_today} variant="blue" to="/safe/autorizacoes" />
                <KpiCard icon={UserCheck} label={t('safe.dashboard.kpis.pendingTeacher')} value={data.kpis.pending_teacher} variant="coral" to="/safe/aprovacoes" />
                <KpiCard icon={CheckCircle2} label={t('safe.dashboard.kpis.approvedToday')} value={data.kpis.approved_today} variant="green" to="/safe/autorizacoes" />
                <KpiCard icon={DoorOpen} label={t('safe.dashboard.kpis.awaitingPortaria')} value={data.kpis.awaiting_portaria} variant="violet" to="/safe/portaria" />
                <KpiCard icon={ShieldAlert} label={t('safe.dashboard.kpis.finalizedToday')} value={data.kpis.finalized_today} variant="senai" to="/safe/autorizacoes" />
                <KpiCard icon={XCircle} label={t('safe.dashboard.kpis.denied')} value={data.kpis.denied} variant="amber" to="/safe/autorizacoes" />
              </>
            )}
          </div>

          <ConnectCard className="min-w-0 overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-hub-border/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <h2 className="text-lg font-semibold text-hub-navy">{t('safe.dashboard.recentAuthorizations')}</h2>
              <Link to="/safe/autorizacoes">
                <OutlineButton>{t('safe.dashboard.viewAll')}</OutlineButton>
              </Link>
            </div>
            {loading ? (
              <ConnectLoadingSpinner label={t('safe.dashboard.loadingAuthorizations')} />
            ) : data.recent_authorizations.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-hub-text-muted sm:px-6">{t('safe.dashboard.noAuthorizations')}</p>
            ) : (
              <ConnectTableScroll>
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="glass-thead text-hub-text-muted">
                    <tr>
                      <th className="px-4 py-3 text-left sm:px-6">{t('safe.table.protocol')}</th>
                      <th className="px-4 py-3 text-left sm:px-6">{t('safe.table.student')}</th>
                      <th className="px-4 py-3 text-left sm:px-6">{t('safe.table.type')}</th>
                      <th className="px-4 py-3 text-left sm:px-6">{t('safe.table.status')}</th>
                      <th className="px-4 py-3 text-left sm:px-6">{t('safe.table.scheduled')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_authorizations.map((auth) => (
                      <tr
                        key={auth.id}
                        className="cursor-pointer border-t border-hub-border/40 transition hover:bg-hub-bg/50"
                        onClick={() => navigate(`/safe/autorizacoes/${auth.id}`)}
                      >
                        <td className="px-4 py-3 font-medium text-hub-red sm:px-6">{auth.protocol}</td>
                        <td className="px-4 py-3 sm:px-6">{auth.student_name}</td>
                        <td className="px-4 py-3 sm:px-6">{auth.type_label}</td>
                        <td className="px-4 py-3 sm:px-6">
                          <SafeStatusBadge status={auth.status} label={auth.status_label} />
                        </td>
                        <td className="px-4 py-3 sm:px-6">{formatDateTime(auth.scheduled_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ConnectTableScroll>
            )}
          </ConnectCard>
        </>
      )}

      {view === 'professor' && data?.view === 'professor' && (
        <>
          <div className="mb-6 grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => <KpiCardSkeleton key={i} />)
            ) : (
              <>
                <KpiCard icon={ClipboardList} label={t('safe.dashboard.kpis.pendingApproval')} value={data.kpis.pending} variant="coral" to="/safe/aprovacoes" />
                <KpiCard icon={CheckCircle2} label={t('safe.dashboard.kpis.approvedByMe')} value={data.kpis.approved_by_me} variant="green" to="/safe/aprovacoes" />
              </>
            )}
          </div>
          <ConnectCard className="min-w-0 overflow-hidden">
            <div className="border-b border-hub-border/60 px-4 py-4 sm:px-6">
              <h2 className="text-lg font-semibold text-hub-navy">{t('safe.dashboard.approvalQueue')}</h2>
            </div>
            {loading ? (
              <ConnectLoadingSpinner />
            ) : data.authorizations.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-hub-text-muted sm:px-6">{t('safe.dashboard.noPending')}</p>
            ) : (
              <ConnectTableScroll>
                <table className="w-full min-w-[600px] text-sm">
                  <thead className="glass-thead text-hub-text-muted">
                    <tr>
                      <th className="px-4 py-3 text-left sm:px-6">Protocolo</th>
                      <th className="px-4 py-3 text-left sm:px-6">Aluno</th>
                      <th className="px-4 py-3 text-left sm:px-6">Motivo</th>
                      <th className="px-4 py-3 text-left sm:px-6">Agendado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.authorizations.map((auth) => (
                      <tr
                        key={auth.id}
                        className="cursor-pointer border-t border-hub-border/40 transition hover:bg-hub-bg/50"
                        onClick={() => navigate(`/safe/autorizacoes/${auth.id}`)}
                      >
                        <td className="px-4 py-3 font-medium text-hub-red sm:px-6">{auth.protocol}</td>
                        <td className="px-4 py-3 sm:px-6">{auth.student_name}</td>
                        <td className="max-w-[200px] truncate px-4 py-3 sm:px-6">{auth.reason}</td>
                        <td className="px-4 py-3 sm:px-6">{formatDateTime(auth.scheduled_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ConnectTableScroll>
            )}
          </ConnectCard>
        </>
      )}

      {view === 'portaria' && data?.view === 'portaria' && (
        <>
          <div className="mb-6 grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => <KpiCardSkeleton key={i} />)
            ) : (
              <>
                <KpiCard icon={DoorOpen} label={t('safe.dashboard.kpis.awaitingConfirmation')} value={data.kpis.awaiting_confirmation} variant="violet" to="/safe/portaria" />
                <KpiCard icon={CheckCircle2} label={t('safe.dashboard.kpis.finalizedToday')} value={data.kpis.finalized_today} variant="green" to="/safe/portaria" />
              </>
            )}
          </div>
          <ConnectCard className="min-w-0 overflow-hidden">
            <div className="border-b border-hub-border/60 px-4 py-4 sm:px-6">
              <h2 className="text-lg font-semibold text-hub-navy">{t('safe.dashboard.portariaQueue')}</h2>
            </div>
            {loading ? (
              <ConnectLoadingSpinner />
            ) : data.authorizations.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-hub-text-muted sm:px-6">{t('safe.dashboard.noPortaria')}</p>
            ) : (
              <ConnectTableScroll>
                <table className="w-full min-w-[600px] text-sm">
                  <thead className="glass-thead text-hub-text-muted">
                    <tr>
                      <th className="px-4 py-3 text-left sm:px-6">Protocolo</th>
                      <th className="px-4 py-3 text-left sm:px-6">Aluno</th>
                      <th className="px-4 py-3 text-left sm:px-6">Professor</th>
                      <th className="px-4 py-3 text-left sm:px-6">Agendado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.authorizations.map((auth) => (
                      <tr
                        key={auth.id}
                        className="cursor-pointer border-t border-hub-border/40 transition hover:bg-hub-bg/50"
                        onClick={() => navigate(`/safe/autorizacoes/${auth.id}`)}
                      >
                        <td className="px-4 py-3 font-medium text-hub-red sm:px-6">{auth.protocol}</td>
                        <td className="px-4 py-3 sm:px-6">{auth.student_name}</td>
                        <td className="px-4 py-3 sm:px-6">{auth.teacher_approver_name ?? EMPTY}</td>
                        <td className="px-4 py-3 sm:px-6">{formatDateTime(auth.scheduled_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ConnectTableScroll>
            )}
          </ConnectCard>
        </>
      )}
    </div>
  )
}
