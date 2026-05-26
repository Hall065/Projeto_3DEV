import { Filter, Minus, Package, Pencil, Plus, TrendingDown, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ConnectDrawer } from '../../components/connect/ConnectDrawer'
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
  PrimaryButton,
  selectClass,
} from '../../components/connect/ConnectShared'
import { GridInventoryStatusBadge } from '../../components/grid/GridBadges'
import { gridService } from '../../services/gridService'
import type { GridInventoryItem, PaginatedMeta } from '../../types/grid'

export function GridInventoryPage() {
  const [items, setItems] = useState<GridInventoryItem[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | undefined>()
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [viewSnapshot, setViewSnapshot] = useState<GridInventoryItem | null>(null)

  const load = () => {
    setLoading(true)
    gridService
      .getInventory({ page, per_page: 8 })
      .then((res) => {
        setItems(res.data)
        setMeta(res.meta)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page])

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Estoque"
        subtitle="Gerencie e acompanhe todos os itens do estoque da instituição."
        actions={
          <PrimaryButton onClick={() => setDrawerOpen(true)}>
            <Plus className="h-4 w-4" /> Adicionar item ao estoque
          </PrimaryButton>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Package} label="Total de itens" value="1.248" trend={{ direction: 'up', value: '8%', label: 'vs. mês anterior' }} />
        <KpiCard icon={TrendingUp} label="Valor total" value="R$ 487.360" trend={{ direction: 'up', value: '12%', label: 'vs. mês anterior' }} />
        <KpiCard icon={TrendingDown} label="Itens com estoque baixo" value={23} trend={{ direction: 'up', value: '4%', label: 'vs. mês anterior' }} />
        <KpiCard icon={Package} label="Itens reservados" value={56} trend={{ direction: 'down', value: '8%', label: 'vs. mês anterior' }} />
      </div>

      <ConnectCard className="mb-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <FormField label="Categoria">
            <select className={selectClass}>
              <option value="">Todas as categorias</option>
              <option>Informática</option>
            </select>
          </FormField>
          <FormField label="Status">
            <select className={selectClass}>
              <option value="">Todos</option>
              <option value="disponivel">Disponível</option>
            </select>
          </FormField>
          <FormField label="Nome do item">
            <input className={inputClass} placeholder="Buscar por nome..." />
          </FormField>
          <FormField label="Custo mín.">
            <input type="number" className={inputClass} placeholder="0,00" />
          </FormField>
          <FormField label="Custo máx.">
            <input type="number" className={inputClass} placeholder="999,00" />
          </FormField>
          <div className="flex items-end">
            <OutlineButton>
              <Filter className="h-4 w-4" /> Limpar filtros
            </OutlineButton>
          </div>
        </div>
      </ConnectCard>

      <ConnectCard>
        {loading ? (
          <ConnectLoadingSpinner label="Carregando estoque..." className="min-h-[320px]" />
        ) : (
          <>
            <ConnectTableScroll>
              <table className="w-full min-w-[1000px] text-sm">
                <thead className="bg-hub-bg/60 text-hub-text-muted">
                  <tr>
                    <th className="px-4 py-3 text-left">Título</th>
                    <th className="px-4 py-3 text-left">Descrição</th>
                    <th className="px-4 py-3 text-left">Categoria</th>
                    <th className="px-4 py-3 text-left">Qtd. disponível</th>
                    <th className="px-4 py-3 text-left">Qtd. mínima</th>
                    <th className="px-4 py-3 text-left">Localização</th>
                    <th className="px-4 py-3 text-left">Distribuidora</th>
                    <th className="px-4 py-3 text-left">Custo</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t border-hub-border/40">
                      <td className="px-4 py-3 font-medium">{item.title}</td>
                      <td className="max-w-[180px] truncate px-4 py-3 text-hub-text-muted">{item.description}</td>
                      <td className="px-4 py-3">{item.category}</td>
                      <td className={`px-4 py-3 font-semibold ${item.qty_available < item.qty_min ? 'text-red-600' : ''}`}>
                        {item.qty_available}
                      </td>
                      <td className="px-4 py-3">{item.qty_min}</td>
                      <td className="px-4 py-3">{item.location}</td>
                      <td className="px-4 py-3">{item.supplier}</td>
                      <td className="px-4 py-3">R$ {item.cost.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <GridInventoryStatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ConnectRowActionsMenu
                          ariaLabel={`Ações de ${item.title}`}
                          actions={[
                            viewRowAction(() => setViewSnapshot(item)),
                            {
                              key: 'add',
                              label: 'Adicionar quantidade',
                              icon: Plus,
                              onClick: () => window.alert(`Entrada de estoque para "${item.title}" em breve.`),
                            },
                            {
                              key: 'remove',
                              label: 'Remover quantidade',
                              icon: Minus,
                              onClick: () => window.alert(`Saída de estoque para "${item.title}" em breve.`),
                            },
                            {
                              key: 'edit',
                              label: 'Editar item',
                              icon: Pencil,
                              onClick: () => window.alert(`Edição de "${item.title}" em breve.`),
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

      <ConnectDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Adicionar item ao estoque"
        subtitle="Preencha os dados do novo item."
        footer={
          <>
            <OutlineButton onClick={() => setDrawerOpen(false)}>Cancelar</OutlineButton>
            <PrimaryButton onClick={() => setDrawerOpen(false)}>Salvar item</PrimaryButton>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nome" required>
            <input className={inputClass} placeholder="Ex: Teclado USB ABNT2" />
          </FormField>
          <FormField label="Categoria" required>
            <select className={selectClass}>
              <option value="">Selecione a categoria</option>
              <option>Informática</option>
              <option>Elétrica</option>
            </select>
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Descrição" required>
              <textarea className={`${inputClass} min-h-[80px] py-2`} placeholder="Descreva o item..." />
            </FormField>
          </div>
          <FormField label="Quantidade disponível" required>
            <input type="number" className={inputClass} placeholder="Ex: 50" min={0} />
          </FormField>
          <FormField label="Quantidade mínima" required>
            <input type="number" className={inputClass} placeholder="Ex: 10" min={0} />
          </FormField>
          <FormField label="Localização (Sala - Bloco)" required>
            <input className={inputClass} placeholder="Ex: Almoxarifado - Bloco A" />
          </FormField>
          <FormField label="Empresa distribuidora" required>
            <select className={selectClass}>
              <option value="">Selecione o fornecedor</option>
              <option>TechSupply Ltda</option>
            </select>
          </FormField>
          <FormField label="Custo do item (R$)" required>
            <input type="number" className={inputClass} placeholder="Ex: 29,90" step="0.01" min={0} />
          </FormField>
          <FormField label="Status" required>
            <select className={selectClass} defaultValue="disponivel">
              <option value="disponivel">Disponível</option>
              <option value="baixo">Estoque baixo</option>
              <option value="reservado">Reservado</option>
            </select>
          </FormField>
        </div>
      </ConnectDrawer>

      <ConnectEntityViewDrawer
        kind="grid-inventory"
        entityId={null}
        open={viewSnapshot !== null}
        onClose={() => setViewSnapshot(null)}
        snapshot={viewSnapshot ?? undefined}
      />
    </div>
  )
}
