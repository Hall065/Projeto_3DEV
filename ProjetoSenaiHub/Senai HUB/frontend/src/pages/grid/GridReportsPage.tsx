import {
  AlertTriangle,
  BarChart3,
  ClipboardList,
  Download,
  FileText,
  Star,
  UserX,
  Wrench,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  breakdownFinishedCount,
  GridDistributionDonut,
  GridHorizontalBarChart,
  GridMonthlyBarChart,
} from '../../components/grid/GridCharts'
import { GridTicketStatusBadge } from '../../components/grid/GridBadges'
import { GridTicketReportPanel } from '../../components/grid/GridTicketReportPanel'
import { CustomReportBuilder } from '../../components/reports/CustomReportBuilder'
import { KpiCard, KpiCardSkeleton } from '../../components/connect/ConnectKpiCard'
import {
  ConnectCard,
  ConnectLoadingSpinner,
  ConnectPageHeader,
  ConnectTableScroll,
  OutlineButton,
  PrimaryButton,
} from '../../components/connect/ConnectShared'
import { gridService } from '../../services/gridService'
import type { GridDashboardData, GridTicket } from '../../types/grid'

function GridReportsDashboard() {
  const { t } = useTranslation()
  const [data, setData] = useState<GridDashboardData | null>(null)
  const [allTickets, setAllTickets] = useState<GridTicket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([gridService.getDashboard(), gridService.getTickets({ per_page: 200 })])
      .then(([dashboard, ticketsRes]) => {
        setData(dashboard)
        setAllTickets(ticketsRes.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const report = data?.report_kpis

  return (
    <>
      <div className="mb-6 grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading || !report ? (
          Array.from({ length: 6 }).map((_, i) => <KpiCardSkeleton key={i} />)
        ) : (
          <>
            <KpiCard icon={ClipboardList} label={t('grid.reports.kpis.created')} value={report.created} variant="blue" />
            <KpiCard icon={AlertTriangle} label={t('grid.reports.kpis.pending')} value={report.pending} variant="amber" />
            <KpiCard icon={UserX} label={t('grid.reports.kpis.withoutTechnician')} value={report.without_technician} variant="senai" />
            <KpiCard icon={Wrench} label={t('grid.reports.kpis.inProgress')} value={report.in_progress} variant="coral" />
            <KpiCard icon={Star} label={t('grid.reports.kpis.awaitingEvaluation')} value={report.awaiting_evaluation} variant="violet" />
            <KpiCard icon={Download} label={t('grid.reports.kpis.finished')} value={report.finished} variant="green" />
            {report.urgent != null && report.urgent > 0 ? (
              <KpiCard icon={AlertTriangle} label={t('grid.reports.kpis.urgentOpen')} value={report.urgent} variant="senai" />
            ) : null}
          </>
        )}
      </div>

      <GridTicketReportPanel tickets={allTickets} />

      <div className="mb-6 grid w-full min-w-0 grid-cols-1 gap-6 xl:grid-cols-2 2xl:grid-cols-3">
        <ConnectCard className="min-w-0 overflow-hidden p-4 sm:p-6">
          <h2 className="mb-4 font-semibold text-hub-navy sm:text-lg">{t('grid.reports.charts.byMonth')}</h2>
          <GridMonthlyBarChart items={data?.tickets_by_month ?? []} loading={loading} />
        </ConnectCard>
        <ConnectCard className="min-w-0 overflow-hidden p-4 sm:p-6">
          <h2 className="mb-4 font-semibold text-hub-navy sm:text-lg">{t('grid.reports.charts.byStatus')}</h2>
          <GridDistributionDonut
            loading={loading}
            items={data?.maintenance_breakdown ?? []}
            centerValue={breakdownFinishedCount(data?.maintenance_breakdown ?? []) || '—'}
            centerLabel={t('grid.reports.charts.finished')}
          />
        </ConnectCard>
        <ConnectCard className="min-w-0 overflow-hidden p-4 sm:p-6 xl:col-span-2 2xl:col-span-1">
          <h2 className="mb-4 font-semibold text-hub-navy sm:text-lg">{t('grid.reports.charts.byTechnician')}</h2>
          <GridHorizontalBarChart items={data?.tickets_by_technician ?? []} loading={loading} valueLabel={t('grid.reports.charts.tickets')} />
        </ConnectCard>
      </div>

      <ConnectCard className="mb-6 min-w-0 overflow-hidden">
        <h2 className="border-b border-hub-border/60 px-4 py-4 font-semibold text-hub-navy sm:px-6 sm:text-lg">
          {t('grid.dashboard.recentTickets.title')}
        </h2>
        {loading ? (
          <ConnectLoadingSpinner label={t('grid.reports.loading')} className="min-h-[200px]" />
        ) : (
          <ConnectTableScroll>
            <table className="w-full min-w-[640px] text-sm">
              <thead className="glass-thead text-hub-text-muted">
                <tr>
                  <th className="px-4 py-3 text-left sm:px-6">{t('grid.reports.recent.id')}</th>
                  <th className="px-4 py-3 text-left sm:px-6">{t('grid.reports.recent.title')}</th>
                  <th className="hidden px-4 py-3 text-left sm:table-cell sm:px-6">{t('grid.reports.recent.technician')}</th>
                  <th className="px-4 py-3 text-left sm:px-6">{t('grid.reports.recent.status')}</th>
                </tr>
              </thead>
              <tbody>
                {data?.recent_tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-t border-hub-border/40">
                    <td className="whitespace-nowrap px-4 py-3 sm:px-6">{ticket.code}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 sm:max-w-none sm:px-6">{ticket.title}</td>
                    <td className="hidden px-4 py-3 sm:table-cell sm:px-6">{ticket.assignee || '—'}</td>
                    <td className="px-4 py-3 sm:px-6">
                      <GridTicketStatusBadge status={ticket.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ConnectTableScroll>
        )}
      </ConnectCard>
    </>
  )
}

export function GridReportsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<'dashboard' | 'builder'>('builder')

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title={t('grid.reports.title')}
        subtitle={t('grid.reports.subtitle')}
        actions={
          <div className="flex flex-wrap gap-2">
            <OutlineButton type="button" onClick={() => setTab('dashboard')}>
              <BarChart3 className="h-4 w-4" /> {t('grid.reports.tabs.dashboard')}
            </OutlineButton>
            <PrimaryButton type="button" onClick={() => setTab('builder')}>
              <FileText className="h-4 w-4" /> {t('grid.reports.tabs.builder')}
            </PrimaryButton>
          </div>
        }
      />

      {tab === 'dashboard' ? <GridReportsDashboard /> : <CustomReportBuilder module="grid" embedded />}
    </div>
  )
}
