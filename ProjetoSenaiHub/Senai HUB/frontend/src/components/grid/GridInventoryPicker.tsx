import { AlertTriangle, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { OutlineButton, selectClass } from '../connect/ConnectShared'
import i18n from '../../i18n'
import { gridService } from '../../services/gridService'
import type { GridInventoryItem, GridInventoryLine } from '../../types/grid'
import {
  getInventoryStockLevel,
  validateInventoryRequest,
} from '../../utils/gridInventoryAvailability'
import { GridInventoryStockAlert } from './GridInventoryStockAlert'
import { GridInventoryThumb } from './GridInventoryThumb'
import type { ConfirmOptions } from '../../contexts/ConfirmContext'
import { useCrudToast } from '../../hooks/useCrudToast'

export function GridInventoryPicker({
  value,
  onChange,
}: {
  value: GridInventoryLine[]
  onChange: (items: GridInventoryLine[]) => void
}) {
  const { t } = useTranslation()
  const crudToast = useCrudToast()
  const [catalog, setCatalog] = useState<GridInventoryItem[]>([])

  useEffect(() => {
    gridService
      .getInventory({ per_page: 100 })
      .then((res) => setCatalog(res.data))
      .catch((err) => crudToast.notifyError(err, t('gridComponents.inventoryPicker.loadError')))
  }, [crudToast, t])

  const validation = useMemo(() => validateInventoryRequest(value, catalog), [value, catalog])

  const addRow = () => {
    const first = catalog.find((c) => c.qty_available > 0) ?? catalog[0]
    if (!first) return
    if (first.qty_available <= 0) {
      crudToast.notifyWarning(t('gridComponents.inventoryPicker.noStock'))
      return
    }
    onChange([...value, { inventory_item_id: first.id, quantity: 1, title: first.title }])
  }

  const updateRow = (index: number, patch: Partial<GridInventoryLine>) => {
    const next = value.map((row, i) => {
      if (i !== index) return row
      const merged = { ...row, ...patch }
      if (patch.inventory_item_id) {
        const item = catalog.find((c) => c.id === patch.inventory_item_id)
        merged.title = item?.title ?? merged.title
        if (item && item.qty_available <= 0) {
          merged.quantity = 0
        } else if (item && merged.quantity > item.qty_available) {
          merged.quantity = Math.max(1, item.qty_available)
        }
      }
      if (patch.quantity !== undefined) {
        const item = catalog.find((c) => c.id === merged.inventory_item_id)
        if (item) {
          merged.quantity = Math.min(Math.max(0, patch.quantity), item.qty_available)
        }
      }
      return merged
    })
    onChange(next.filter((row) => row.quantity > 0))
  }

  return (
    <div className="space-y-3">
      {value.length > 0 && <GridInventoryStockAlert lines={validation.lines} />}

      {value.map((row, index) => {
        const item = catalog.find((c) => c.id === row.inventory_item_id)
        const level = item ? getInventoryStockLevel(item) : 'ok'
        const rowBorder =
          level === 'out'
            ? 'border-red-300 bg-red-50/50'
            : level === 'low'
              ? 'border-amber-300 bg-amber-50/40'
              : 'border-hub-border/50 bg-white/40'

        return (
          <div key={index} className={`flex flex-wrap items-end gap-2 rounded-lg border p-2 ${rowBorder}`}>
            {item ? <GridInventoryThumb title={item.title} imageUrl={item.image_url} category={item.category} size="sm" /> : null}
            <div className="min-w-[140px] flex-1">
              <label className="mb-1 block text-[10px] font-semibold uppercase text-hub-text-muted">
                {t('gridComponents.inventoryPicker.item')}
              </label>
              <select
                className={selectClass}
                value={row.inventory_item_id}
                onChange={(e) => updateRow(index, { inventory_item_id: Number(e.target.value), quantity: 1 })}
              >
                {catalog.map((c) => {
                  const stock = getInventoryStockLevel(c)
                  const label =
                    stock === 'out'
                      ? t('gridComponents.inventoryPicker.outOfStock', { title: c.title })
                      : stock === 'low'
                        ? t('gridComponents.inventoryPicker.lowStock', { title: c.title, qty: c.qty_available })
                        : t('gridComponents.inventoryPicker.available', { title: c.title, qty: c.qty_available })
                  return (
                    <option key={c.id} value={c.id} disabled={c.qty_available <= 0}>
                      {label}
                    </option>
                  )
                })}
              </select>
            </div>
            <div className="w-24">
              <label className="mb-1 block text-[10px] font-semibold uppercase text-hub-text-muted">
                {t('gridComponents.inventoryPicker.qty')}
              </label>
              <input
                type="number"
                min={item && item.qty_available > 0 ? 1 : 0}
                max={item?.qty_available ?? 0}
                disabled={!item || item.qty_available <= 0}
                className={selectClass}
                value={row.quantity || ''}
                onChange={(e) => updateRow(index, { quantity: Number(e.target.value) })}
              />
            </div>
            <button
              type="button"
              className="rounded p-2 text-hub-red hover:bg-red-50"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
              aria-label={t('gridComponents.inventoryPicker.removeItem')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
            {level === 'low' && item && (
              <p className="flex w-full items-start gap-1 text-[11px] text-amber-800">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {t('gridComponents.inventoryPicker.lowStockWarning', { qty: item.qty_available, min: item.qty_min })}
              </p>
            )}
            {level === 'out' && (
              <p className="w-full text-[11px] font-medium text-red-700">
                {t('gridComponents.inventoryPicker.zeroStock')}
              </p>
            )}
          </div>
        )
      })}
      <OutlineButton type="button" onClick={addRow}>
        <Plus className="h-4 w-4" /> {t('gridComponents.inventoryPicker.addItem')}
      </OutlineButton>
      <p className="text-xs text-hub-text-muted">{t('gridComponents.inventoryPicker.hint')}</p>
    </div>
  )
}

/** Valida antes de enviar a solicitação; retorna false se o usuário cancelar ou houver erro. */
export async function guardInventoryBeforeSubmit(
  lines: GridInventoryLine[],
  catalog: GridInventoryItem[],
  toast?: Pick<ReturnType<typeof useCrudToast>, 'notifyWarning'>,
  confirm?: (options: ConfirmOptions) => Promise<boolean>,
): Promise<boolean> {
  const result = validateInventoryRequest(lines, catalog)
  if (!result.valid) {
    const message = [
      i18n.t('gridComponents.inventoryPicker.cannotSaveTitle'),
      '',
      ...result.errors.map((e) => `• ${e}`),
    ].join('\n')
    if (toast) {
      toast.notifyWarning(message)
    }
    return false
  }
  if (result.warnings.length > 0) {
    if (!confirm) return false
    const list = result.warnings.map((w) => `• ${w}`).join('\n')
    return confirm({
      title: i18n.t('gridComponents.inventoryPicker.lowStockConfirmTitle'),
      message: `${list}\n\n${i18n.t('gridComponents.inventoryPicker.lowStockConfirmBody')}`,
    })
  }
  return true
}
