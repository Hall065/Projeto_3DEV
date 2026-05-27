import { Filter, ImageIcon, Minus, Package, Pencil, Plus, Trash2, TrendingDown, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ConnectDrawer } from '../../components/connect/ConnectDrawer'
import { ConnectEntityViewDrawer } from '../../components/connect/ConnectEntityViewDrawer'
import { ConnectRowActionsMenu } from '../../components/connect/ConnectRowActionsMenu'
import { viewRowAction } from '../../components/connect/connectViewActions'
import { KpiCard, KpiCardSkeleton } from '../../components/connect/ConnectKpiCard'
import {
  ConnectCard,
  ConnectLoadingSpinner,
  ConnectPageHeader,
  ConnectPagination,
  ConnectTableScroll,
  FormField,
  inputClass,
  OutlineButton,
  PrimaryButton,
  selectClass,
} from '../../components/connect/ConnectShared'
import { GridInventoryStatusBadge } from '../../components/grid/GridBadges'
import { GridInventoryThumb } from '../../components/grid/GridInventoryThumb'
import { gridService } from '../../services/gridService'
import type { GridDashboardData, GridInventoryItem, PaginatedMeta } from '../../types/grid'
import { confirmDelete } from '../../utils/confirmAction'

const emptyForm = {
  title: '',
  description: '',
  category: '',
  qty_available: '0',
  qty_min: '0',
  location: '',
  supplier: '',
  cost: '0',
  status: 'disponivel',
}

export function GridInventoryPage() {
  const [items, setItems] = useState<GridInventoryItem[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | undefined>()
  const [dashboard, setDashboard] = useState<GridDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [adjustType, setAdjustType] = useState<'in' | 'out'>('in')
  const [adjustQty, setAdjustQty] = useState('1')
  const [adjustTarget, setAdjustTarget] = useState<GridInventoryItem | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [viewSnapshot, setViewSnapshot] = useState<GridInventoryItem | null>(null)

  const load = () => {
    setLoading(true)
    const params: Record<string, string | number> = { page, per_page: 8, search }
    if (category) params.category = category
    if (statusFilter) params.status = statusFilter

    gridService
      .getInventory(params)
      .then((res) => {
        setItems(res.data)
        setMeta(res.meta)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page, search, category, statusFilter])

  useEffect(() => {
    gridService.getDashboard().then(setDashboard)
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDrawerOpen(true)
  }

  const openEdit = (item: GridInventoryItem) => {
    setEditingId(item.id)
    setForm({
      title: item.title,
      description: item.description,
      category: item.category,
      qty_available: String(item.qty_available),
      qty_min: String(item.qty_min),
      location: item.location,
      supplier: item.supplier,
      cost: String(item.cost),
      status: item.status,
    })
    setDrawerOpen(true)
  }

  const openAdjust = (item: GridInventoryItem, type: 'in' | 'out') => {
    setAdjustTarget(item)
    setAdjustType(type)
    setAdjustQty('1')
    setAdjustOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      window.alert('Informe o nome do item.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        qty_available: Number(form.qty_available) || 0,
        qty_min: Number(form.qty_min) || 0,
        location: form.location.trim(),
        supplier: form.supplier.trim(),
        cost: Number(form.cost) || 0,
        status: form.status as GridInventoryItem['status'],
      }
      if (editingId) {
        await gridService.updateInventory(editingId, payload)
      } else {
        await gridService.createInventory(payload)
      }
      setDrawerOpen(false)
      load()
      gridService.getDashboard().then(setDashboard)
    } finally {
      setSaving(false)
    }
  }

  const handleAdjust = async () => {
    if (!adjustTarget) return
    const qty = Number(adjustQty)
    if (!qty || qty < 1) {
      window.alert('Informe uma quantidade válida.')
      return
    }
    setSaving(true)
    try {
      await gridService.adjustInventory(adjustTarget.id, adjustType, qty)
      setAdjustOpen(false)
      load()
      gridService.getDashboard().then(setDashboard)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item: GridInventoryItem) => {
    if (!confirmDelete(`o item "${item.title}"`)) return
    await gridService.deleteInventory(item.id)
    load()
  }

  const handleSyncImage = async (item: GridInventoryItem) => {
    setSaving(true)
    try {
      const updated = await gridService.syncInventoryImage(item.id)
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)))
      if (viewSnapshot?.id === item.id) setViewSnapshot(updated)
    } finally {
      setSaving(false)
    }
  }

  const totalValue = items.reduce((sum, i) => sum + i.cost * i.qty_available, 0)

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Estoque"
        subtitle="Gerencie e acompanhe todos os itens do estoque da instituição."
        actions={
          <PrimaryButton onClick={openCreate}>
            <Plus className="h-4 w-4" /> Adicionar item ao estoque
          </PrimaryButton>
        }
      />

      <div className="mb-6 grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {!meta && loading ? (
          Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
        ) : (
          <>
            <KpiCard icon={Package} label="Total de itens" value={meta?.total ?? 0} variant="blue" to="/grid/estoque" />
            <KpiCard
              icon={TrendingUp}
              label="Valor (página)"
              value={`R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
              variant="green"
            />
            <KpiCard
              icon={TrendingDown}
              label="Estoque baixo"
              value={dashboard?.kpis.low_stock ?? 0}
              variant="amber"
              sparkline={dashboard?.kpi_sparklines?.low_stock ?? []}
            />
            <KpiCard
              icon={Package}
              label="Com reserva"
              value={dashboard?.kpis.reserved_inventory ?? 0}
              variant="violet"
            />
          </>
        )}
      </div>

      <ConnectCard className="mb-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Nome do item">
            <input
              className={inputClass}
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => {
                setPage(1)
                setSearch(e.target.value)
              }}
            />
          </FormField>
          <FormField label="Categoria">
            <select className={selectClass} value={category} onChange={(e) => { setPage(1); setCategory(e.target.value) }}>
              <option value="">Todas</option>
              <option value="Informática">Informática</option>
              <option value="Elétrica">Elétrica</option>
              <option value="Climatização">Climatização</option>
              <option value="Hidráulica">Hidráulica</option>
            </select>
          </FormField>
          <FormField label="Status">
            <select className={selectClass} value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value) }}>
              <option value="">Todos</option>
              <option value="disponivel">Disponível</option>
              <option value="baixo">Estoque baixo</option>
              <option value="reservado">Reservado</option>
            </select>
          </FormField>
          <div className="flex items-end">
            <OutlineButton
              onClick={() => {
                setSearch('')
                setCategory('')
                setStatusFilter('')
                setPage(1)
              }}
            >
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
                <thead className="glass-thead text-hub-text-muted">
                  <tr>
                    <th className="w-16 px-4 py-3 text-left">Foto</th>
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
                      <td className="px-4 py-3">
                        <GridInventoryThumb title={item.title} imageUrl={item.image_url} size="sm" />
                      </td>
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
                            { key: 'add', label: 'Adicionar quantidade', icon: Plus, onClick: () => openAdjust(item, 'in') },
                            { key: 'remove', label: 'Remover quantidade', icon: Minus, onClick: () => openAdjust(item, 'out') },
                            {
                              key: 'image',
                              label: 'Buscar imagem pública',
                              icon: ImageIcon,
                              onClick: () => void handleSyncImage(item),
                            },
                            { key: 'edit', label: 'Editar item', icon: Pencil, onClick: () => openEdit(item) },
                            { key: 'delete', label: 'Excluir', icon: Trash2, variant: 'danger', onClick: () => void handleDelete(item) },
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
        title={editingId ? 'Editar item' : 'Adicionar item ao estoque'}
        subtitle="Preencha os dados do item."
        footer={
          <>
            <OutlineButton onClick={() => setDrawerOpen(false)}>Cancelar</OutlineButton>
            <PrimaryButton onClick={() => void handleSave()} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar item'}
            </PrimaryButton>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nome" required>
            <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Lâmpada LED 9W" />
          </FormField>
          <FormField label="Categoria" required>
            <input className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex: Elétrica" />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Descrição">
              <textarea className={`${inputClass} min-h-[80px] py-2`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Especificações, modelo e observações..." />
            </FormField>
          </div>
          <FormField label="Quantidade disponível" required>
            <input type="number" className={inputClass} min={0} value={form.qty_available} onChange={(e) => setForm({ ...form, qty_available: e.target.value })} placeholder="Ex: 50" />
          </FormField>
          <FormField label="Quantidade mínima" required>
            <input type="number" className={inputClass} min={0} value={form.qty_min} onChange={(e) => setForm({ ...form, qty_min: e.target.value })} placeholder="Ex: 10" />
          </FormField>
          <FormField label="Localização" required>
            <input className={inputClass} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ex: Almoxarifado — Prateleira B3" />
          </FormField>
          <FormField label="Fornecedor">
            <input className={inputClass} value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="Ex: Fornecedor ABC Ltda." />
          </FormField>
          <FormField label="Custo (R$)">
            <input type="number" className={inputClass} step="0.01" min={0} value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="Ex: 12.90" />
          </FormField>
          <FormField label="Status">
            <select className={selectClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="disponivel">Disponível</option>
              <option value="baixo">Estoque baixo</option>
              <option value="reservado">Reservado</option>
            </select>
          </FormField>
        </div>
      </ConnectDrawer>

      <ConnectDrawer
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        title={adjustType === 'in' ? 'Entrada de estoque' : 'Saída de estoque'}
        subtitle={adjustTarget?.title}
        footer={
          <>
            <OutlineButton onClick={() => setAdjustOpen(false)}>Cancelar</OutlineButton>
            <PrimaryButton onClick={() => void handleAdjust()} disabled={saving}>Confirmar</PrimaryButton>
          </>
        }
      >
        <FormField label="Quantidade">
          <input type="number" className={inputClass} min={1} value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} placeholder="Ex: 5" />
        </FormField>
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
