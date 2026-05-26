import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Package,
  Pencil,
  Wrench,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ConnectEntityViewDrawer } from '../../components/connect/ConnectEntityViewDrawer'
import { ConnectRowActionsMenu } from '../../components/connect/ConnectRowActionsMenu'
import { viewRowAction } from '../../components/connect/connectViewActions'
import { GridDonutChart } from '../../components/grid/GridCharts'
import { GridPriorityBadge, GridTicketStatusBadge } from '../../components/grid/GridBadges'
import {
  ConnectCard,
  ConnectLoadingSpinner,
  ConnectPageHeader,
  ConnectTableScroll,
  KpiCard,
  OutlineButton,
} from '../../components/connect/ConnectShared'
import { gridService } from '../../services/gridService'
import type { GridDashboardData, GridTicket } from '../../types/grid'

export function GridDashboardPage() {
  const [data, setData] = useState<GridDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewSnapshot, setViewSnapshot] = useState<GridTicket | null>(null)

  useEffect(() => {
    gridService
      .getDashboard()
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  const kpis = data?.kpis
  const trends = data?.kpi_trends

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Dashboard"
        subtitle="Visão geral da gestão de manutenção e infraestrutura."
      />

      <div className="mb-6 grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading || !kpis ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-hub-border/60 bg-white" />
          ))
        ) : (
          <>
            <KpiCard icon={ClipboardList} label="Chamados abertos" value={kpis.open_tickets} trend={trends?.open_tickets} />
            <KpiCard icon={Wrench} label="Em andamento" value={kpis.in_progress} trend={trends?.in_progress} />
            <KpiCard icon={CheckCircle2} label="Concluídos no mês" value={kpis.completed_month} trend={trends?.completed_month} />
            <KpiCard icon={Package} label="Itens com estoque baixo" value={kpis.low_stock} trend={trends?.low_stock} />
          </>
        )}
      </div>

      <div className="mb-6 grid w-full min-w-0 grid-cols-1 gap-6 xl:grid-cols-3">
        <ConnectCard className="min-w-0 xl:col-span-2">
          <div className="flex flex-col gap-3 border-b border-hub-border/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <h2 className="text-lg font-semibold text-hub-navy">Chamados recentes</h2>
            <Link to="/grid/chamados">
              <OutlineButton>Ver todos</OutlineButton>
            </Link>
          </div>
          {loading ? (
            <ConnectLoadingSpinner label="Carregando chamados..." className="min-h-[240px]" />
          ) : (
            <ConnectTableScroll>
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-hub-bg/60 text-hub-text-muted">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">ID</th>
                    <th className="px-4 py-3 text-left font-medium">Título</th>
                    <th className="px-4 py-3 text-left font-medium">Bloco/Sala</th>
                    <th className="px-4 py-3 text-left font-medium">Prioridade</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Responsável</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {data?.recent_tickets.map((t) => (
                    <tr key={t.id} className="border-t border-hub-border/40">
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-hub-navy">{t.code}</td>
                      <td className="px-4 py-3">{t.title}</td>
                      <td className="px-4 py-3">
                        {t.room} / {t.block}
                      </td>
                      <td className="px-4 py-3">
                        <GridPriorityBadge priority={t.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <GridTicketStatusBadge status={t.status} />
                      </td>
                      <td className="px-4 py-3">{t.assignee}</td>
                      <td className="px-4 py-3 text-right">
                        <ConnectRowActionsMenu
                          ariaLabel={`Ações do chamado ${t.code}`}
                          actions={[
                            viewRowAction(() => setViewSnapshot(t)),
                            {
                              key: 'edit',
                              label: 'Editar',
                              icon: Pencil,
                              onClick: () => window.alert(`Edição do chamado ${t.code} em breve.`),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ConnectTableScroll>
          )}
        </ConnectCard>

        <ConnectCard className="min-w-0 p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-hub-navy">Resumo de manutenção</h2>
          <GridDonutChart
            loading={loading}
            items={data?.maintenance_breakdown ?? []}
            centerValue={data?.kpis.completed_month ?? 0}
            centerLabel="Concluídos"
          />
        </ConnectCard>
      </div>

      <div className="mb-6 grid w-full min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
        <ConnectCard className="p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-hub-navy">Tarefas por prioridade</h2>
          <GridDonutChart
            loading={loading}
            items={data?.priority_breakdown ?? []}
            centerValue="100%"
            centerLabel="Distribuição"
          />
        </ConnectCard>

        <ConnectCard className="min-w-0">
          <h2 className="border-b border-hub-border/60 px-4 py-4 text-lg font-semibold text-hub-navy sm:px-6">
            Itens com estoque baixo
          </h2>
          {loading ? (
            <ConnectLoadingSpinner label="Carregando estoque..." className="min-h-[200px]" />
          ) : (
            <ConnectTableScroll>
              <table className="w-full min-w-[480px] text-sm">
                <thead className="bg-hub-bg/60 text-hub-text-muted">
                  <tr>
                    <th className="px-4 py-3 text-left">Categoria</th>
                    <th className="px-4 py-3 text-left">Estoque atual</th>
                    <th className="px-4 py-3 text-left">Mínimo</th>
                    <th className="px-4 py-3 text-left">Un.</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.low_stock_items.map((item) => (
                    <tr key={item.id} className="border-t border-hub-border/40">
                      <td className="px-4 py-3">{item.category}</td>
                      <td className="px-4 py-3 font-semibold text-red-600">{item.current}</td>
                      <td className="px-4 py-3">{item.minimum}</td>
                      <td className="px-4 py-3">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ConnectTableScroll>
          )}
        </ConnectCard>
      </div>

      <div className="grid w-full min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
        <ConnectCard className="p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-hub-navy">Itens urgentes</h2>
          {loading ? (
            <ConnectLoadingSpinner className="min-h-[160px]" />
          ) : (
            <ul className="space-y-3">
              {data?.urgent_items.map((item) => (
                <li key={item.id} className="flex items-start gap-3 rounded-xl border border-hub-border/50 p-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-hub-text">{item.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <GridPriorityBadge priority={item.priority} />
                      <span className="text-xs text-hub-text-muted">{item.when}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ConnectCard>

        <ConnectCard className="p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-hub-navy">Atividades em andamento</h2>
          {loading ? (
            <ConnectLoadingSpinner className="min-h-[160px]" />
          ) : (
            <ul className="space-y-4">
              {data?.activities.map((a) => (
                <li key={a.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-hub-text">{a.title}</span>
                    <span className="font-semibold text-emerald-600">{a.progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-hub-bg">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${a.progress}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ConnectCard>
      </div>

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
