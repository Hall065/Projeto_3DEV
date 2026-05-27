import { AlertTriangle, Ban } from 'lucide-react'
import type { InventoryLineCheck } from '../../utils/gridInventoryAvailability'

export function GridInventoryStockAlert({ lines }: { lines: InventoryLineCheck[] }) {
  const blocked = lines.filter((l) => l.level === 'out')
  const low = lines.filter((l) => l.level === 'low')

  if (blocked.length === 0 && low.length === 0) return null

  return (
    <div className="space-y-2">
      {blocked.map((line) => (
        <div
          key={`out-${line.inventory_item_id}`}
          className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
          role="alert"
        >
          <Ban className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <span className="font-semibold">{line.title}</span> está sem estoque (zerado). Remova o item ou escolha
            outro — não será possível reservar na execução.
          </p>
        </div>
      ))}
      {low.map((line) => (
        <div
          key={`low-${line.inventory_item_id}`}
          className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
          role="status"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <span className="font-semibold">{line.title}</span> está acabando: {line.available} un. disponíveis
            {line.minimum > 0 ? ` (mínimo: ${line.minimum})` : ''}.
          </p>
        </div>
      ))}
    </div>
  )
}
