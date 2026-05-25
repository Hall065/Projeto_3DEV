import { AlertTriangle, CheckCircle2, Download, Filter, Package, RefreshCw, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'
import { GridDonutChart } from '../../components/grid/GridCharts'
import { GridTicketStatusBadge } from '../../components/grid/GridBadges'
import {
  ConnectCard,
  ConnectLoadingSpinner,
  ConnectPageHeader,
  ConnectTableScroll,
  FormField,
  KpiCard,
  OutlineButton,
  PrimaryButton,
  selectClass,
} from '../../components/connect/ConnectShared'
import { gridService } from '../../services/gridService'
import type { GridDashboardData } from '../../types/grid'

const months = ['Dez/25', 'Jan/26', 'Fev/26', 'Mar/26', 'Abr/26', 'Mai/26']
const barHeights = [55, 62, 70, 68, 75, 82]

export function GridReportsPage() {
  const [data, setData] = useState<GridDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    gridService
      .getDashboard()
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Relatórios"
        subtitle="Visão executiva da gestão de manutenção e infraestrutura."
        actions={
          <>
            <OutlineButton>
              <Filter className="h-4 w-4" /> Filtros avançados
            </OutlineButton>
            <PrimaryButton>
              <Download className="h-4 w-4" /> Exportar relatório
            </PrimaryButton>
          </>
        }
      />

      <ConnectCard className="mb-6 p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Período">
            <select className={selectClass}>
              <option>Últimos 30 dias</option>
              <option>Este mês</option>
            </select>
          </FormField>
          <FormField label="Bloco">
            <select className={selectClass}>
              <option value="">Todos</option>
            </select>
          </FormField>
          <FormField label="Categoria">
            <select className={selectClass}>
              <option value="">Todas</option>
            </select>
          </FormField>
          <FormField label="Responsável">
            <select className={selectClass}>
              <option value="">Todos</option>
            </select>
          </FormField>
        </div>
      </ConnectCard>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard icon={Wrench} label="Manutenções no mês" value={342} trend={{ direction: 'up', value: '12%', label: 'vs. mês anterior' }} />
        <KpiCard icon={Package} label="Itens comprados" value={128} trend={{ direction: 'up', value: '8%', label: 'vs. mês anterior' }} />
        <KpiCard icon={Download} label="Custo total das manutenções" value="R$ 98.752" trend={{ direction: 'up', value: '15%', label: 'vs. mês anterior' }} />
        <KpiCard icon={CheckCircle2} label="Chamados concluídos" value={274} trend={{ direction: 'up', value: '18%', label: 'vs. mês anterior' }} />
        <KpiCard icon={AlertTriangle} label="Chamados urgentes" value={24} trend={{ direction: 'down', value: '5%', label: 'vs. mês anterior' }} />
        <KpiCard icon={Package} label="Estoque baixo" value={23} trend={{ direction: 'neutral', value: '5', label: 'novos desde ontem' }} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ConnectCard className="p-4 sm:p-6">
          <h2 className="mb-4 font-semibold text-hub-navy">Manutenções por mês</h2>
          {loading ? (
            <ConnectLoadingSpinner className="min-h-[180px]" />
          ) : (
            <div className="flex h-44 items-end justify-between gap-2">
              {months.map((m, i) => (
                <div key={m} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full max-w-[40px] rounded-t-lg bg-blue-500 transition-all"
                    style={{ height: `${barHeights[i]}%` }}
                  />
                  <span className="text-[10px] text-hub-text-muted">{m}</span>
                </div>
              ))}
            </div>
          )}
        </ConnectCard>
        <ConnectCard className="p-4 sm:p-6">
          <h2 className="mb-4 font-semibold text-hub-navy">Tipos de manutenção</h2>
          <GridDonutChart
            loading={loading}
            items={data?.maintenance_breakdown ?? []}
            centerValue={342}
            centerLabel="Total"
          />
        </ConnectCard>
        <ConnectCard className="p-4 sm:p-6">
          <h2 className="mb-4 font-semibold text-hub-navy">Custo mensal (R$)</h2>
          {loading ? (
            <ConnectLoadingSpinner className="min-h-[180px]" />
          ) : (
            <div className="flex h-44 items-end gap-1">
              {barHeights.map((h, i) => (
                <div key={i} className="flex-1 rounded-t bg-blue-400/80" style={{ height: `${h}%` }} />
              ))}
            </div>
          )}
        </ConnectCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ConnectCard className="p-4 sm:p-6">
          <h2 className="mb-4 font-semibold text-hub-navy">Itens mais utilizados</h2>
          {loading ? (
            <ConnectLoadingSpinner />
          ) : (
            <ul className="space-y-3">
              {['Lâmpada LED 18W', 'Filtro de ar', 'Cabo HDMI 2m'].map((name, i) => (
                <li key={name} className="flex items-center gap-3 text-sm">
                  <span className="min-w-0 flex-1 truncate">{name}</span>
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-hub-bg">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${90 - i * 20}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ConnectCard>

        <ConnectCard className="min-w-0">
          <h2 className="border-b border-hub-border/60 px-4 py-4 font-semibold text-hub-navy sm:px-6">
            Custo por manutenção
          </h2>
          {loading ? (
            <ConnectLoadingSpinner label="Carregando relatório..." className="min-h-[240px]" />
          ) : (
            <ConnectTableScroll>
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-hub-bg/60 text-hub-text-muted">
                  <tr>
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Título</th>
                    <th className="px-4 py-3 text-left">Técnico</th>
                    <th className="px-4 py-3 text-left">Custo (R$)</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.recent_tickets.map((t) => (
                    <tr key={t.id} className="border-t border-hub-border/40">
                      <td className="px-4 py-3">{t.code}</td>
                      <td className="px-4 py-3">{t.title}</td>
                      <td className="px-4 py-3">{t.assignee}</td>
                      <td className="px-4 py-3">R$ {(1200 + Number(t.id) * 150).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <GridTicketStatusBadge status={t.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ConnectTableScroll>
          )}
        </ConnectCard>
      </div>

      <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-hub-text-muted">
        <RefreshCw className="h-3.5 w-3.5" />
        Relatórios atualizados em 31/05/2025 às 08:30
      </p>
    </div>
  )
}
