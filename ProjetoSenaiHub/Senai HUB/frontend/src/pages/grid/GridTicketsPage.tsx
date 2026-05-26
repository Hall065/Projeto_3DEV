import { AlertTriangle, CheckCircle2, ClipboardList, Filter, Pencil, Trash2, UserCheck, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ConnectEntityViewDrawer } from '../../components/connect/ConnectEntityViewDrawer'
import { ConnectRowActionsMenu } from '../../components/connect/ConnectRowActionsMenu'
import { viewRowAction } from '../../components/connect/connectViewActions'
import {
  ConnectCard,
  ConnectLoadingSpinner,
  ConnectPageHeader,
  ConnectPagination,
  ConnectTableScroll,
  FormField,
  inputClass,
  KpiCard,
  OutlineButton,
  selectClass,
} from '../../components/connect/ConnectShared'
import { GridPriorityBadge, GridTicketStatusBadge } from '../../components/grid/GridBadges'
import { gridService } from '../../services/gridService'
import type { GridTicket, PaginatedMeta } from '../../types/grid'

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
  const [tickets, setTickets] = useState<GridTicket[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | undefined>()
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [viewSnapshot, setViewSnapshot] = useState<GridTicket | null>(null)

  const load = () => {
    setLoading(true)
    gridService
      .getTickets({ page, per_page: 10, search })
      .then((res) => {
        setTickets(res.data)
        setMeta(res.meta)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page, search])

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Chamados"
        subtitle="Gerencie e acompanhe todos os chamados de manutenção."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={ClipboardList} label="Chamados abertos" value={128} trend={{ direction: 'down', value: '12%', label: 'vs. mês anterior' }} />
        <KpiCard icon={AlertTriangle} label="Urgentes" value={12} trend={{ direction: 'up', value: '33%', label: 'vs. mês anterior' }} />
        <KpiCard icon={Wrench} label="Em andamento" value={64} trend={{ direction: 'up', value: '8%', label: 'vs. mês anterior' }} />
        <KpiCard icon={CheckCircle2} label="Concluídos" value={342} trend={{ direction: 'up', value: '15%', label: 'vs. mês anterior' }} />
      </div>

      <ConnectCard className="mb-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <FormField label="Busca">
            <input
              className={inputClass}
              placeholder="Buscar por ID, título, descrição ou solicitante..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </FormField>
          <FormField label="Bloco">
            <select className={selectClass}>
              <option value="">Todos os blocos</option>
              <option value="A">Bloco A</option>
              <option value="B">Bloco B</option>
            </select>
          </FormField>
          <FormField label="Sala">
            <select className={selectClass}>
              <option value="">Todas as salas</option>
            </select>
          </FormField>
          <FormField label="Prioridade">
            <select className={selectClass}>
              <option value="">Todas</option>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
            </select>
          </FormField>
          <FormField label="Status">
            <select className={selectClass}>
              <option value="">Todos</option>
              <option value="aberto">Aberto</option>
              <option value="em_andamento">Em andamento</option>
            </select>
          </FormField>
          <FormField label="Data">
            <input type="date" className={inputClass} />
          </FormField>
        </div>
        <div className="mt-4 flex justify-end">
          <OutlineButton onClick={() => setSearch('')}>
            <Filter className="h-4 w-4" /> Limpar filtros
          </OutlineButton>
        </div>
      </ConnectCard>

      <ConnectCard>
        {loading ? (
          <ConnectLoadingSpinner label="Carregando chamados..." className="min-h-[280px]" />
        ) : (
          <>
            <ConnectTableScroll>
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-hub-bg/60 text-hub-text-muted">
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
                            {
                              key: 'assign',
                              label: 'Atribuir técnico',
                              icon: UserCheck,
                              onClick: () => window.alert(`Atribuição do chamado ${t.code} em breve.`),
                            },
                            {
                              key: 'delete',
                              label: 'Excluir',
                              icon: Trash2,
                              variant: 'danger',
                              onClick: () => window.alert(`Exclusão do chamado ${t.code} em breve.`),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ConnectTableScroll>
            <ConnectPagination meta={meta} onPageChange={setPage} />
          </>
        )}
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
