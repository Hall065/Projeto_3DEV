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
            <KpiCard icon={ClipboardList} label="Chamados criados" value={report.created} variant="blue" />
            <KpiCard icon={AlertTriangle} label="Pendentes" value={report.pending} variant="amber" />
            <KpiCard icon={UserX} label="Sem técnico" value={report.without_technician} variant="senai" />
            <KpiCard icon={Wrench} label="Em andamento" value={report.in_progress} variant="coral" />
            <KpiCard icon={Star} label="Avaliação pendente" value={report.awaiting_evaluation} variant="violet" />
            <KpiCard icon={Download} label="Finalizados" value={report.finished} variant="green" />
            {report.urgent != null && report.urgent > 0 ? (
              <KpiCard icon={AlertTriangle} label="Urgentes abertos" value={report.urgent} variant="senai" />
            ) : null}
          </>
        )}
      </div>

      <GridTicketReportPanel tickets={allTickets} />

      <div className="mb-6 grid w-full min-w-0 grid-cols-1 gap-6 xl:grid-cols-2 2xl:grid-cols-3">
        <ConnectCard className="min-w-0 overflow-hidden p-4 sm:p-6">
          <h2 className="mb-4 font-semibold text-hub-navy sm:text-lg">Chamados por mês</h2>
          <GridMonthlyBarChart items={data?.tickets_by_month ?? []} loading={loading} />
        </ConnectCard>
        <ConnectCard className="min-w-0 overflow-hidden p-4 sm:p-6">
          <h2 className="mb-4 font-semibold text-hub-navy sm:text-lg">Status dos chamados</h2>
          <GridDistributionDonut
            loading={loading}
            items={data?.maintenance_breakdown ?? []}
            centerValue={breakdownFinishedCount(data?.maintenance_breakdown ?? []) || '—'}
            centerLabel="Finalizados"
          />
        </ConnectCard>
        <ConnectCard className="min-w-0 overflow-hidden p-4 sm:p-6 xl:col-span-2 2xl:col-span-1">
          <h2 className="mb-4 font-semibold text-hub-navy sm:text-lg">Por técnico</h2>
          <GridHorizontalBarChart items={data?.tickets_by_technician ?? []} loading={loading} valueLabel="chamados" />
        </ConnectCard>
      </div>

      <ConnectCard className="mb-6 min-w-0 overflow-hidden">
        <h2 className="border-b border-hub-border/60 px-4 py-4 font-semibold text-hub-navy sm:px-6 sm:text-lg">
          Chamados recentes
        </h2>
        {loading ? (
          <ConnectLoadingSpinner label="Carregando..." className="min-h-[200px]" />
        ) : (
          <ConnectTableScroll>
            <table className="w-full min-w-[640px] text-sm">
              <thead className="glass-thead text-hub-text-muted">
                <tr>
                  <th className="px-4 py-3 text-left sm:px-6">ID</th>
                  <th className="px-4 py-3 text-left sm:px-6">Título</th>
                  <th className="hidden px-4 py-3 text-left sm:table-cell sm:px-6">Técnico</th>
                  <th className="px-4 py-3 text-left sm:px-6">Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.recent_tickets.map((t) => (
                  <tr key={t.id} className="border-t border-hub-border/40">
                    <td className="whitespace-nowrap px-4 py-3 sm:px-6">{t.code}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 sm:max-w-none sm:px-6">{t.title}</td>
                    <td className="hidden px-4 py-3 sm:table-cell sm:px-6">{t.assignee || '—'}</td>
                    <td className="px-4 py-3 sm:px-6">
                      <GridTicketStatusBadge status={t.status} />
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
  const [tab, setTab] = useState<'dashboard' | 'builder'>('builder')

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Relatórios"
        subtitle="Painel operacional ou construtor personalizado com secoes e colunas a sua escolha."
        actions={
          <div className="flex flex-wrap gap-2">
            <OutlineButton type="button" onClick={() => setTab('dashboard')}>
              <BarChart3 className="h-4 w-4" /> Painel
            </OutlineButton>
            <PrimaryButton type="button" onClick={() => setTab('builder')}>
              <FileText className="h-4 w-4" /> Construtor
            </PrimaryButton>
          </div>
        }
      />

      {tab === 'dashboard' ? <GridReportsDashboard /> : <CustomReportBuilder module="grid" embedded />}
    </div>
  )
}
