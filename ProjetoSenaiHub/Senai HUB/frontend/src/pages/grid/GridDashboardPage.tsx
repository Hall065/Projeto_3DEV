import {

  AlertTriangle,

  CheckCircle2,

  ClipboardList,

  Package,

  Wrench,

} from 'lucide-react'

import { useCallback, useEffect, useState } from 'react'

import { Link, useNavigate } from 'react-router-dom'

import { ConnectEntityViewDrawer } from '../../components/connect/ConnectEntityViewDrawer'

import { ConnectRowActionsMenu } from '../../components/connect/ConnectRowActionsMenu'

import { viewRowAction } from '../../components/connect/connectViewActions'

import { KpiCard, KpiCardSkeleton } from '../../components/connect/ConnectKpiCard'

import {

  breakdownTotalCount,

  GridDistributionDonut,

  GridQuickReportsSection,

} from '../../components/grid/GridCharts'

import { GridPriorityBadge, GridTicketStatusBadge } from '../../components/grid/GridBadges'

import { HorizontalAutoCarousel } from '../../components/connect/HorizontalAutoCarousel'

import {

  ConnectCard,

  ConnectLoadingSpinner,

  ConnectPageHeader,

  ConnectTableScroll,

  OutlineButton,

} from '../../components/connect/ConnectShared'

import { gridService } from '../../services/gridService'

import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus'

import type { GridDashboardData, GridTicket } from '../../types/grid'



const clickableRowClass =

  'cursor-pointer transition hover:border-hub-red/35 hover:bg-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hub-red'



export function GridDashboardPage() {

  const navigate = useNavigate()

  const [data, setData] = useState<GridDashboardData | null>(null)

  const [loading, setLoading] = useState(true)

  const [viewSnapshot, setViewSnapshot] = useState<GridTicket | null>(null)



  const loadDashboard = useCallback(() => gridService.getDashboard().then(setData), [])

  useEffect(() => {
    loadDashboard().finally(() => setLoading(false))
  }, [loadDashboard])

  useRefetchOnFocus(loadDashboard)



  const kpis = data?.kpis

  const spark = data?.kpi_sparklines



  return (

    <div className="w-full min-w-0">

      <ConnectPageHeader

        title="Dashboard"

        subtitle="Visão geral da gestão de manutenção e infraestrutura."

      />



      <div className="mb-6 grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {loading || !kpis ? (

          Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)

        ) : (

          <>

            <KpiCard

              icon={ClipboardList}

              label="Chamados abertos"

              value={kpis.open_tickets}

              variant="blue"

              sparkline={spark?.open_tickets ?? []}

              to="/grid/chamados"

            />

            <KpiCard

              icon={Wrench}

              label="Em andamento"

              value={kpis.in_progress}

              variant="coral"

              sparkline={spark?.in_progress ?? []}

              to="/grid/tarefas"

            />

            <KpiCard

              icon={CheckCircle2}

              label="Concluídos no mês"

              value={kpis.completed_month}

              variant="green"

              sparkline={spark?.completed_month ?? []}

              to="/grid/chamados"

            />

            <KpiCard

              icon={Package}

              label="Itens com estoque baixo"

              value={kpis.low_stock}

              variant="amber"

              sparkline={spark?.low_stock ?? []}

              to="/grid/estoque"

            />

          </>

        )}

      </div>



      <ConnectCard className="mb-6 min-w-0 overflow-hidden">

        <div className="flex flex-col gap-3 border-b border-hub-border/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

          <h2 className="text-lg font-semibold text-hub-navy">Chamados recentes</h2>

          <Link to="/grid/chamados">

            <OutlineButton>Ver todos</OutlineButton>

          </Link>

        </div>

        {loading ? (

          <ConnectLoadingSpinner label="Carregando chamados..." className="min-h-[140px]" />

        ) : (data?.recent_tickets.length ?? 0) === 0 ? (

          <p className="px-4 py-10 text-center text-sm text-hub-text-muted sm:px-6">

            Nenhum chamado recente. Crie um em Controle ou Chamados.

          </p>

        ) : (

          <HorizontalAutoCarousel className="px-4 py-4 sm:px-6">

            <ul className="flex gap-3 pb-1">

              {[...(data?.recent_tickets ?? []), ...(data?.recent_tickets ?? [])].map((t, index) => (

                <li key={`${t.id}-${index}`} className="w-[min(100%,280px)] shrink-0 sm:w-[300px]">

                  <article

                    role="button"

                    tabIndex={0}

                    className={`flex h-full min-w-0 items-center gap-2 rounded-xl border border-hub-border/50 bg-gradient-to-r from-white to-hub-bg/30 p-3 shadow-sm ${clickableRowClass}`}

                    onClick={() => navigate(`/grid/chamados?id=${t.id}`)}

                    onKeyDown={(e) => {

                      if (e.key === 'Enter' || e.key === ' ') {

                        e.preventDefault()

                        navigate(`/grid/chamados?id=${t.id}`)

                      }

                    }}

                  >

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-xs font-semibold text-hub-red">{t.code}</p>

                      <p className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug text-hub-navy">{t.title}</p>

                      <p className="mt-1 truncate text-xs text-hub-text-muted">

                        {t.room || '—'} / {t.block || '—'}

                      </p>

                      <div className="mt-2 flex flex-wrap gap-1.5">

                        <GridPriorityBadge priority={t.priority} />

                        <GridTicketStatusBadge status={t.status} />

                      </div>

                    </div>

                    <div className="shrink-0" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                      <ConnectRowActionsMenu
                        ariaLabel={`Ações do chamado ${t.code}`}
                        actions={[viewRowAction(() => setViewSnapshot(t))]}
                      />
                    </div>

                  </article>

                </li>

              ))}

            </ul>

          </HorizontalAutoCarousel>

        )}

      </ConnectCard>



      <div className="mb-6 grid w-full min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">

        <ConnectCard className="min-w-0 overflow-hidden">

          <h2 className="border-b border-hub-border/60 px-4 py-4 text-lg font-semibold text-hub-navy sm:px-6 sm:text-xl">

            Itens com estoque baixo

          </h2>

          {loading ? (

            <ConnectLoadingSpinner label="Carregando estoque..." className="min-h-[200px]" />

          ) : (data?.low_stock_items.length ?? 0) === 0 ? (

            <p className="px-4 py-10 text-center text-sm text-hub-text-muted sm:px-6">

              Nenhum item com estoque baixo no momento.

            </p>

          ) : (

            <ConnectTableScroll>

              <table className="w-full min-w-[400px] text-sm">

                <thead className="glass-thead text-hub-text-muted">

                  <tr>

                    <th className="px-4 py-3 text-left sm:px-6">Item</th>

                    <th className="px-4 py-3 text-left sm:px-6">Atual</th>

                    <th className="px-4 py-3 text-left sm:px-6">Mínimo</th>

                  </tr>

                </thead>

                <tbody>

                  {data?.low_stock_items.map((item) => (

                    <tr

                      key={item.id}

                      className={`border-t border-hub-border/40 ${clickableRowClass}`}

                      onClick={() => navigate(`/grid/estoque?id=${item.id}`)}

                    >

                      <td className="px-4 py-3 sm:px-6">{item.category}</td>

                      <td className="px-4 py-3 font-semibold text-red-600 sm:px-6">{item.current}</td>

                      <td className="px-4 py-3 sm:px-6">{item.minimum}</td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </ConnectTableScroll>

          )}

          <div className="border-t border-hub-border/40 px-4 py-3 sm:px-6">

            <Link to="/grid/estoque" className="text-sm font-medium text-hub-red hover:underline">

              Ver estoque completo

            </Link>

          </div>

        </ConnectCard>



        <div className="flex min-w-0 flex-col gap-6">

          <ConnectCard className="p-4 sm:p-6">

            <div className="mb-4 flex items-center justify-between gap-2">

              <h2 className="text-lg font-semibold text-hub-navy sm:text-xl">Itens urgentes</h2>

              <Link to="/grid/chamados" className="text-xs font-medium text-hub-red hover:underline">

                Ver chamados

              </Link>

            </div>

            {loading ? (

              <ConnectLoadingSpinner className="min-h-[160px]" />

            ) : (data?.urgent_items.length ?? 0) === 0 ? (

              <p className="py-6 text-center text-sm text-hub-text-muted">Nenhum chamado urgente no momento.</p>

            ) : (

              <ul className="scrollbar-glass-inset max-h-[320px] space-y-3 overflow-y-auto pr-1">

                {data?.urgent_items.map((item) => (

                  <li key={item.id}>

                    <button

                      type="button"

                      className={`flex w-full items-start gap-3 rounded-xl border border-hub-border/50 bg-gradient-to-r from-white to-hub-bg/30 p-3 text-left shadow-sm ${clickableRowClass}`}

                      onClick={() => navigate(`/grid/chamados?id=${item.id}`)}

                    >

                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

                      <div className="min-w-0 flex-1">

                        <p className="text-sm font-medium text-hub-text">{item.title}</p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">

                          <GridPriorityBadge priority={item.priority} />

                          <span className="text-xs text-hub-text-muted">{item.when}</span>

                        </div>

                      </div>

                    </button>

                  </li>

                ))}

              </ul>

            )}

          </ConnectCard>



          <ConnectCard className="p-4 sm:p-6">

            <div className="mb-4 flex items-center justify-between gap-2">

              <h2 className="text-lg font-semibold text-hub-navy sm:text-xl">Atividades em andamento</h2>

              <Link to="/grid/tarefas" className="text-xs font-medium text-hub-red hover:underline">

                Ver tarefas

              </Link>

            </div>

            {loading ? (

              <ConnectLoadingSpinner className="min-h-[160px]" />

            ) : (

              <ul className="scrollbar-glass-inset max-h-[320px] space-y-3 overflow-y-auto pr-1">

                {(data?.activities ?? []).length === 0 ? (

                  <li className="py-6 text-center text-sm text-hub-text-muted">Nenhuma tarefa em andamento no momento.</li>

                ) : (

                  data?.activities.map((a) => (

                    <li key={a.id}>

                      <button

                        type="button"

                        className={`w-full rounded-xl border border-hub-border/50 bg-gradient-to-r from-white to-hub-bg/30 p-3 text-left shadow-sm ${clickableRowClass}`}

                        onClick={() => navigate(`/grid/tarefas?id=${a.id}`)}

                      >

                        <div className="flex items-start justify-between gap-2">

                          <div className="min-w-0">

                            <p className="text-xs font-medium text-hub-text-muted">{a.code}</p>

                            <p className="text-sm font-medium text-hub-text">{a.title}</p>

                          </div>

                          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">

                            {a.status_label}

                          </span>

                        </div>

                        <p className="mt-2 text-xs text-hub-text-muted">

                          {a.room} / {a.block}

                          {a.assignee ? ` · ${a.assignee}` : ' · Sem técnico'}

                        </p>

                      </button>

                    </li>

                  ))

                )}

              </ul>

            )}

          </ConnectCard>

        </div>

      </div>



      <ConnectCard className="mb-6 min-w-0 p-4 sm:p-6 lg:p-8">

        <h2 className="mb-6 text-lg font-semibold text-hub-navy sm:mb-8 sm:text-xl">Relatórios rápidos</h2>

        <GridQuickReportsSection

          loading={loading}

          maintenanceBreakdown={data?.maintenance_breakdown ?? []}

          priorityBreakdown={data?.priority_breakdown ?? []}

          ticketsByMonth={data?.tickets_by_month ?? []}

          ticketsByTechnician={data?.tickets_by_technician ?? []}

          topInventory={data?.top_inventory ?? []}

          tasksByColumn={data?.tasks_by_column}

        />

      </ConnectCard>



      <ConnectCard className="mb-6 p-4 sm:p-6">

        <h2 className="mb-4 text-lg font-semibold text-hub-navy sm:text-xl">Prioridade dos chamados</h2>

        <GridDistributionDonut

          loading={loading}

          items={data?.priority_breakdown ?? []}

          centerValue={breakdownTotalCount(data?.priority_breakdown ?? []) || '—'}

          centerLabel="Chamados"

        />

      </ConnectCard>



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


