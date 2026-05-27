import type { GridInventoryItem, GridInventoryLine } from '../types/grid'

export type InventoryStockLevel = 'out' | 'low' | 'ok'

export function getInventoryStockLevel(item: Pick<GridInventoryItem, 'qty_available' | 'qty_min'>): InventoryStockLevel {
  if (item.qty_available <= 0) return 'out'
  if (item.qty_available <= item.qty_min) return 'low'
  return 'ok'
}

export function aggregateInventoryLines(lines: GridInventoryLine[]): Map<number, number> {
  const map = new Map<number, number>()
  for (const line of lines) {
    map.set(line.inventory_item_id, (map.get(line.inventory_item_id) ?? 0) + line.quantity)
  }
  return map
}

export interface InventoryLineCheck {
  inventory_item_id: number
  title: string
  quantity: number
  available: number
  minimum: number
  level: InventoryStockLevel
}

export interface InventoryValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  lines: InventoryLineCheck[]
}

export function validateInventoryRequest(
  lines: GridInventoryLine[],
  catalog: GridInventoryItem[],
): InventoryValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const checks: InventoryLineCheck[] = []

  if (lines.length === 0) {
    return { valid: true, errors, warnings, lines: checks }
  }

  const byId = new Map(catalog.map((item) => [item.id, item]))
  const aggregated = aggregateInventoryLines(lines)

  for (const [id, quantity] of aggregated) {
    const item = byId.get(id)
    const title = item?.title ?? lines.find((l) => l.inventory_item_id === id)?.title ?? `Item #${id}`

    if (!item) {
      errors.push(`"${title}" não foi encontrado no catálogo de estoque.`)
      continue
    }

    const level = getInventoryStockLevel(item)
    checks.push({
      inventory_item_id: id,
      title: item.title,
      quantity,
      available: item.qty_available,
      minimum: item.qty_min,
      level,
    })

    if (level === 'out') {
      errors.push(
        `"${item.title}": estoque zerado — não é possível usar este item na solicitação (disponível: 0).`,
      )
      continue
    }

    if (quantity > item.qty_available) {
      errors.push(
        `"${item.title}": quantidade solicitada (${quantity}) maior que o disponível (${item.qty_available}).`,
      )
      continue
    }

    if (level === 'low') {
      warnings.push(
        `"${item.title}": estoque baixo — restam ${item.qty_available} un. (mínimo recomendado: ${item.qty_min}).`,
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    lines: checks,
  }
}
