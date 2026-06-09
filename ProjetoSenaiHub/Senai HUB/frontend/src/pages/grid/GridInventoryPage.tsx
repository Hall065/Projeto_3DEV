import { Eye, Filter, Globe, ImageIcon, Minus, Package, Pencil, Plus, Trash2, TrendingDown, TrendingUp, Upload } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { ConnectDrawer } from '../../components/connect/ConnectDrawer'
import { GridInventoryDetailDrawer } from '../../components/grid/GridInventoryDetailDrawer'
import { ConnectRowActionsMenu } from '../../components/connect/ConnectRowActionsMenu'
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
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus'
import type { GridDashboardData, GridInventoryItem, PaginatedMeta } from '../../types/grid'
import { prepareAvatarFile, readAvatarPreview, validateAvatarFile } from '../../utils/avatarImage'
import { parseApiError } from '../../utils/parseApiError'

type InventoryImageSource = 'auto' | 'upload' | 'url'

function isStoredInventoryImage(url: string | null | undefined): boolean {
  if (!url) return false
  return /\/storage\/inventory\//.test(url)
}

function detectImageSource(url: string | null | undefined): InventoryImageSource {
  if (!url) return 'auto'
  if (isStoredInventoryImage(url)) return 'upload'
  if (/wikimedia\.org/i.test(url)) return 'auto'
  return 'url'
}

const emptyForm = {
  title: '',
  description: '',
  category: '',
  sku: '',
  purchased_at: '',
  qty_available: '0',
  qty_min: '0',
  location: '',
  supplier: '',
  cost: '0',
  status: 'disponivel',
}

export function GridInventoryPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
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
  const [imageSource, setImageSource] = useState<InventoryImageSource>('auto')
  const [initialImageSource, setInitialImageSource] = useState<InventoryImageSource>('auto')
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [detailItemId, setDetailItemId] = useState<number | null>(null)
  const [syncingImageId, setSyncingImageId] = useState<number | null>(null)

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

  const loadDashboard = useCallback(() => gridService.getDashboard().then(setDashboard), [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  useRefetchOnFocus(loadDashboard)

  const resetImageFields = () => {
    setImageSource('auto')
    setInitialImageSource('auto')
    setImageUrl('')
    setImageFile(null)
    setImagePreview(null)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    resetImageFields()
    setDrawerOpen(true)
  }

  const openEdit = (item: GridInventoryItem) => {
    setEditingId(item.id)
    setForm({
      title: item.title,
      description: item.description,
      category: item.category,
      sku: item.sku ?? '',
      purchased_at: item.purchased_at ?? '',
      qty_available: String(item.qty_available),
      qty_min: String(item.qty_min),
      location: item.location,
      supplier: item.supplier,
      cost: String(item.cost),
      status: item.status,
    })
    const source = detectImageSource(item.image_url)
    setImageSource(source)
    setInitialImageSource(source)
    setImageUrl(source === 'url' ? (item.image_url ?? '') : '')
    setImageFile(null)
    setImagePreview(item.image_url ?? null)
    if (imageInputRef.current) imageInputRef.current.value = ''
    setDrawerOpen(true)
  }

  const openAdjust = (item: GridInventoryItem, type: 'in' | 'out') => {
    setAdjustTarget(item)
    setAdjustType(type)
    setAdjustQty('1')
    setAdjustOpen(true)
  }

  const handleImageFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validation = validateAvatarFile(file)
    if (validation) {
      window.alert(validation)
      event.target.value = ''
      return
    }

    try {
      const prepared = await prepareAvatarFile(file)
      const preview = await readAvatarPreview(prepared)
      setImageFile(prepared)
      setImagePreview(preview)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : t('common.error'))
      event.target.value = ''
    }
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      window.alert(t('grid.inventory.alert.nameRequired'))
      return
    }

    if (imageSource === 'upload' && !imageFile && !imagePreview) {
      window.alert(t('grid.inventory.alert.photoRequired'))
      return
    }

    if (imageSource === 'url' && !imageUrl.trim()) {
      window.alert(t('grid.inventory.alert.photoRequired'))
      return
    }

    setSaving(true)
    try {
      const payload: Partial<GridInventoryItem> = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        sku: form.sku.trim() || undefined,
        purchased_at: form.purchased_at || undefined,
        qty_available: Number(form.qty_available) || 0,
        qty_min: Number(form.qty_min) || 0,
        location: form.location.trim(),
        supplier: form.supplier.trim(),
        cost: Number(form.cost) || 0,
        status: form.status as GridInventoryItem['status'],
      }

      if (imageSource === 'url') {
        payload.image_url = imageUrl.trim()
      }

      let itemId = editingId

      if (editingId) {
        await gridService.updateInventory(editingId, payload)
      } else {
        const created = await gridService.createInventory(payload)
        itemId = created.item.id
        if (created.merged) {
          window.alert(created.message)
        }
      }

      if (itemId) {
        if (imageSource === 'upload' && imageFile) {
          await gridService.uploadInventoryImage(itemId, imageFile)
        } else if (imageSource === 'auto' && editingId && initialImageSource !== 'auto') {
          await gridService.syncInventoryImage(itemId)
        }
      }

      setDrawerOpen(false)
      load()
      loadDashboard()
    } catch (err: unknown) {
      window.alert(parseApiError(err, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  const handleAdjust = async () => {
    if (!adjustTarget) return
    const qty = Number(adjustQty)
    if (!qty || qty < 1) {
      window.alert(t('grid.inventory.alert.qtyInvalid'))
      return
    }
    setSaving(true)
    try {
      await gridService.adjustInventory(adjustTarget.id, adjustType, qty)
      setAdjustOpen(false)
      load()
      loadDashboard()
    } catch (err: unknown) {
      window.alert(parseApiError(err, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item: GridInventoryItem) => {
    if (!window.confirm(t('connect.confirm.delete', { entity: `o item "${item.title}"` }))) return
    try {
      await gridService.deleteInventory(item.id)
      load()
    } catch (err: unknown) {
      window.alert(parseApiError(err, t('common.error')))
    }
  }

  const handleSyncImage = async (itemId: number) => {
    setSyncingImageId(itemId)
    try {
      const updated = await gridService.syncInventoryImage(itemId)
      setItems((prev) => prev.map((i) => (i.id === itemId ? updated : i)))
    } catch (err: unknown) {
      window.alert(parseApiError(err, t('common.error')))
    } finally {
      setSyncingImageId(null)
    }
  }

  const openDetail = (item: GridInventoryItem | number) => {
    const id = typeof item === 'number' ? item : item.id
    setDetailItemId(id)
    setSearchParams({ id: String(id) }, { replace: true })
  }

  const closeDetail = () => {
    setDetailItemId(null)
    if (searchParams.has('id')) {
      setSearchParams({}, { replace: true })
    }
  }

  useEffect(() => {
    const paramId = searchParams.get('id')
    if (!paramId) return
    const id = Number(paramId)
    if (Number.isNaN(id)) return
    setDetailItemId(id)
  }, [searchParams])

  const totalValue = items.reduce((sum, i) => sum + i.cost * i.qty_available, 0)

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title={t('grid.inventory.title')}
        subtitle={t('grid.inventory.subtitle')}
        actions={
          <PrimaryButton onClick={openCreate}>
            <Plus className="h-4 w-4" /> {t('grid.inventory.add')}
          </PrimaryButton>
        }
      />

      <div className="mb-6 grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {!meta && loading ? (
          Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
        ) : (
          <>
            <KpiCard icon={Package} label={t('grid.inventory.kpis.totalItems')} value={meta?.total ?? 0} variant="blue" to="/grid/estoque" />
            <KpiCard
              icon={TrendingUp}
              label={t('grid.inventory.kpis.pageValue')}
              value={`R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
              variant="green"
            />
            <KpiCard
              icon={TrendingDown}
              label={t('grid.inventory.kpis.lowStock')}
              value={dashboard?.kpis.low_stock ?? 0}
              variant="amber"
              sparkline={dashboard?.kpi_sparklines?.low_stock ?? []}
            />
            <KpiCard
              icon={Package}
              label={t('grid.inventory.kpis.reserved')}
              value={dashboard?.kpis.reserved_inventory ?? 0}
              variant="violet"
            />
          </>
        )}
      </div>

      <ConnectCard className="mb-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label={t('grid.inventory.filters.itemName')}>
            <input
              className={inputClass}
              placeholder={t('common.search')}
              value={search}
              onChange={(e) => {
                setPage(1)
                setSearch(e.target.value)
              }}
            />
          </FormField>
          <FormField label={t('grid.inventory.filters.category')}>
            <select className={selectClass} value={category} onChange={(e) => { setPage(1); setCategory(e.target.value) }}>
              <option value="">{t('connect.common.all')}</option>
              <option value="Informática">Informática</option>
              <option value="Elétrica">Elétrica</option>
              <option value="Climatização">Climatização</option>
              <option value="Hidráulica">Hidráulica</option>
            </select>
          </FormField>
          <FormField label={t('grid.inventory.filters.status')}>
            <select className={selectClass} value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value) }}>
              <option value="">{t('connect.common.all')}</option>
              <option value="disponivel">{t('grid.inventory.filters.available')}</option>
              <option value="baixo">{t('grid.inventory.filters.lowStock')}</option>
              <option value="reservado">{t('grid.inventory.filters.reserved')}</option>
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
              <Filter className="h-4 w-4" /> {t('connect.common.clearFilters')}
            </OutlineButton>
          </div>
        </div>
      </ConnectCard>

      <ConnectCard>
        {loading ? (
          <ConnectLoadingSpinner label={t('common.loading')} className="min-h-[320px]" />
        ) : (
          <>
            <ConnectTableScroll>
              <table className="w-full min-w-[1000px] text-sm">
                <thead className="glass-thead text-hub-text-muted">
                  <tr>
                    <th className="w-16 px-4 py-3 text-left">{t('grid.inventory.table.photo')}</th>
                    <th className="px-4 py-3 text-left">{t('grid.inventory.table.title')}</th>
                    <th className="px-4 py-3 text-left">{t('grid.inventory.table.description')}</th>
                    <th className="px-4 py-3 text-left">{t('grid.inventory.table.category')}</th>
                    <th className="px-4 py-3 text-left">{t('grid.inventory.table.qtyAvailable')}</th>
                    <th className="px-4 py-3 text-left">{t('grid.inventory.table.qtyMinimum')}</th>
                    <th className="px-4 py-3 text-left">{t('grid.inventory.table.location')}</th>
                    <th className="px-4 py-3 text-left">{t('grid.inventory.table.distributor')}</th>
                    <th className="px-4 py-3 text-left">{t('grid.inventory.table.cost')}</th>
                    <th className="px-4 py-3 text-left">{t('connect.table.status')}</th>
                    <th className="px-4 py-3 text-left">{t('connect.common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="cursor-pointer border-t border-hub-border/40 transition hover:bg-hub-bg/50"
                      onClick={() => openDetail(item)}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <GridInventoryThumb title={item.title} imageUrl={item.image_url} category={item.category} size="sm" />
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
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <ConnectRowActionsMenu
                          ariaLabel={t('connect.common.actionsOf', { name: item.title })}
                          actions={[
                            { key: 'view', label: t('connect.common.view'), icon: Eye, onClick: () => openDetail(item) },
                            { key: 'add', label: t('grid.inventory.actions.addQty'), icon: Plus, onClick: () => openAdjust(item, 'in') },
                            { key: 'remove', label: t('grid.inventory.actions.removeQty'), icon: Minus, onClick: () => openAdjust(item, 'out') },
                            {
                              key: 'image',
                              label: t('grid.inventory.actions.searchImage'),
                              icon: ImageIcon,
                              onClick: () => void handleSyncImage(item.id),
                            },
                            { key: 'edit', label: t('grid.inventory.actions.editItem'), icon: Pencil, onClick: () => openEdit(item) },
                            { key: 'delete', label: t('connect.common.delete'), icon: Trash2, variant: 'danger', onClick: () => void handleDelete(item) },
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
        title={editingId ? t('grid.inventory.drawer.edit') : t('grid.inventory.drawer.add')}
        footer={
          <>
            <OutlineButton onClick={() => setDrawerOpen(false)}>{t('common.cancel')}</OutlineButton>
            <PrimaryButton onClick={() => void handleSave()} disabled={saving}>
              {saving ? t('connect.common.saving') : t('common.save')}
            </PrimaryButton>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t('connect.table.name')} required>
            <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </FormField>
          <FormField label={t('grid.inventory.table.category')} required>
            <input className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </FormField>
          <FormField label={t('grid.inventory.formExtra.sku')}>
            <input className={inputClass} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </FormField>
          <FormField label={t('grid.inventory.formExtra.purchaseDate')}>
            <input type="date" className={inputClass} value={form.purchased_at} onChange={(e) => setForm({ ...form, purchased_at: e.target.value })} />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label={t('grid.inventory.table.description')}>
              <textarea className={`${inputClass} min-h-[80px] py-2`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </FormField>
          </div>

          <div className="sm:col-span-2">
            <FormField label={t('grid.inventory.table.photo')}>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setImageSource('auto')}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                      imageSource === 'auto'
                        ? 'border-hub-accent bg-hub-accent/10 text-hub-accent'
                        : 'border-hub-border/60 text-hub-text-muted hover:border-hub-border'
                    }`}
                  >
                    <Globe className="h-4 w-4" />
                    {t('grid.inventory.actions.searchImage')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageSource('upload')}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                      imageSource === 'upload'
                        ? 'border-hub-accent bg-hub-accent/10 text-hub-accent'
                        : 'border-hub-border/60 text-hub-text-muted hover:border-hub-border'
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    {t('grid.inventory.formExtra.upload')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageSource('url')}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                      imageSource === 'url'
                        ? 'border-hub-accent bg-hub-accent/10 text-hub-accent'
                        : 'border-hub-border/60 text-hub-text-muted hover:border-hub-border'
                    }`}
                  >
                    <ImageIcon className="h-4 w-4" />
                    {t('grid.inventory.formExtra.url')}
                  </button>
                </div>

                {imageSource === 'upload' && (
                  <div className="flex flex-wrap items-center gap-4">
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => void handleImageFileChange(e)}
                    />
                    <OutlineButton type="button" onClick={() => imageInputRef.current?.click()}>
                      <Upload className="h-4 w-4" />
                      {imagePreview ? t('connect.common.edit') : t('connect.common.new')}
                    </OutlineButton>
                  </div>
                )}

                {imageSource === 'url' && (
                  <input
                    className={inputClass}
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value)
                      setImagePreview(e.target.value.trim() || null)
                    }}
                    placeholder={t('grid.inventory.formExtra.urlPlaceholder')}
                  />
                )}

                {imagePreview && (
                  <div className="flex items-center gap-3">
                    <img
                      src={imagePreview}
                      alt=""
                      className="h-20 w-20 rounded-lg border border-hub-border/60 object-cover"
                    />
                  </div>
                )}
              </div>
            </FormField>
          </div>

          <FormField label={t('grid.inventory.table.qtyAvailable')} required>
            <input type="number" className={inputClass} min={0} value={form.qty_available} onChange={(e) => setForm({ ...form, qty_available: e.target.value })} />
          </FormField>
          <FormField label={t('grid.inventory.table.qtyMinimum')} required>
            <input type="number" className={inputClass} min={0} value={form.qty_min} onChange={(e) => setForm({ ...form, qty_min: e.target.value })} />
          </FormField>
          <FormField label={t('grid.inventory.table.location')} required>
            <input className={inputClass} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </FormField>
          <FormField label={t('grid.inventory.table.distributor')}>
            <input className={inputClass} value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
          </FormField>
          <FormField label={t('grid.inventory.table.cost')}>
            <input type="number" className={inputClass} step="0.01" min={0} value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
          </FormField>
          <FormField label={t('connect.table.status')}>
            <select className={selectClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="disponivel">{t('grid.inventory.filters.available')}</option>
              <option value="baixo">{t('grid.inventory.filters.lowStock')}</option>
              <option value="reservado">{t('grid.inventory.filters.reserved')}</option>
            </select>
          </FormField>
        </div>
      </ConnectDrawer>

      <ConnectDrawer
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        title={t('grid.inventory.adjust.title')}
        subtitle={adjustTarget?.title}
        footer={
          <>
            <OutlineButton onClick={() => setAdjustOpen(false)}>{t('common.cancel')}</OutlineButton>
            <PrimaryButton onClick={() => void handleAdjust()} disabled={saving}>{t('grid.inventory.adjust.confirm')}</PrimaryButton>
          </>
        }
      >
        <FormField label={t('grid.inventory.table.qtyAvailable')}>
          <input type="number" className={inputClass} min={1} value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} />
        </FormField>
      </ConnectDrawer>

      <GridInventoryDetailDrawer
        itemId={detailItemId}
        open={detailItemId !== null}
        onClose={closeDetail}
        onSyncImage={(id) => void handleSyncImage(id)}
        syncingImage={syncingImageId !== null}
      />
    </div>
  )
}
