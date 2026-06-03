import { ImageIcon, Package } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ConnectDrawer } from '../connect/ConnectDrawer'
import { ConnectDrawerHeroCard } from '../connect/ConnectDrawerHeroCard'
import { ConnectLoadingSpinner } from '../connect/ConnectShared'
import { GridInventoryStatusBadge } from './GridBadges'
import { GridInventoryThumb } from './GridInventoryThumb'
import { gridService } from '../../services/gridService'
import type { GridInventoryItemDetail } from '../../types/grid'

function formatDate(value?: string | null) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('pt-BR')
  } catch {
    return value
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('pt-BR')
  } catch {
    return value
  }
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-hub-border/30 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-hub-text-muted">{label}</dt>
      <dd className="text-sm font-medium text-hub-navy sm:text-right">{value}</dd>
    </div>
  )
}

function StockKpi({ label, value, hint, variant }: { label: string; value: number | string; hint?: string; variant?: string }) {
  const colors =
    variant === 'warn'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : variant === 'muted'
        ? 'border-hub-border/50 bg-hub-bg/60 text-hub-text-muted'
        : 'border-emerald-200 bg-emerald-50 text-emerald-900'

  return (
    <div className={`rounded-xl border px-4 py-3 ${colors}`}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] opacity-75">{hint}</p>}
    </div>
  )
}

export function GridInventoryDetailDrawer({
  itemId,
  open,
  onClose,
  onSyncImage,
  syncingImage,
}: {
  itemId: number | null
  open: boolean
  onClose: () => void
  onSyncImage?: (id: number) => void
  syncingImage?: boolean
}) {
  const [tab, setTab] = useState<'overview' | 'reservations'>('overview')
  const [detail, setDetail] = useState<GridInventoryItemDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !itemId) {
      setDetail(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    setTab('overview')

    gridService
      .getInventoryItem(itemId)
      .then(setDetail)
      .catch(() => setError('Não foi possível carregar os detalhes do item.'))
      .finally(() => setLoading(false))
  }, [open, itemId])

  return (
    <ConnectDrawer
      open={open}
      onClose={onClose}
      title={detail?.title ?? 'Item de estoque'}
      subtitle={detail?.category ? `${detail.category}${detail.sku ? ` · SKU ${detail.sku}` : ''}` : 'Carregando...'}
      width="2xl"
      footer={
        itemId && onSyncImage ? (
          <button
            type="button"
            disabled={syncingImage}
            onClick={() => onSyncImage(itemId)}
            className="inline-flex items-center gap-2 rounded-xl border border-hub-border px-4 py-2 text-sm font-medium text-hub-navy hover:bg-hub-bg disabled:opacity-50"
          >
            <ImageIcon className="h-4 w-4" />
            {syncingImage ? 'Buscando...' : 'Buscar foto no Wikimedia'}
          </button>
        ) : undefined
      }
    >
      {loading ? (
        <ConnectLoadingSpinner label="Carregando item..." className="min-h-[320px]" />
      ) : error ? (
        <p className="py-12 text-center text-sm text-red-600">{error}</p>
      ) : detail ? (
        <div className="space-y-6">
          <ConnectDrawerHeroCard onBack={onClose}>
            <GridInventoryThumb title={detail.title} imageUrl={detail.image_url} category={detail.category} size="lg" />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h3 className="text-lg font-bold text-hub-navy">{detail.title}</h3>
              <p className="mt-1 text-sm text-hub-text-muted">{detail.description || 'Sem descrição cadastrada.'}</p>
              <div className="mt-3">
                <GridInventoryStatusBadge status={detail.status} />
              </div>
            </div>
          </ConnectDrawerHeroCard>

          <div className="flex gap-2 border-b border-hub-border/50">
            <button
              type="button"
              onClick={() => setTab('overview')}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
                tab === 'overview' ? 'border-hub-red text-hub-red' : 'border-transparent text-hub-text-muted hover:text-hub-navy'
              }`}
            >
              Visão geral
            </button>
            <button
              type="button"
              onClick={() => setTab('reservations')}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
                tab === 'reservations' ? 'border-hub-red text-hub-red' : 'border-transparent text-hub-text-muted hover:text-hub-navy'
              }`}
            >
              Reservas ({detail.reservations?.length ?? 0})
            </button>
          </div>

          {tab === 'overview' ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StockKpi label="Disponível" value={detail.qty_available} />
                <StockKpi label="Em uso" value={detail.qty_in_use} hint="Tarefas em andamento" variant={detail.qty_in_use > 0 ? 'warn' : undefined} />
                <StockKpi label="Comprometido" value={detail.qty_committed} hint="Reservado em chamados" />
                <StockKpi label="Consumido" value={detail.qty_consumed} variant="muted" />
              </div>

              <dl className="rounded-2xl border border-hub-border/50 bg-white px-4">
                <DetailRow label="Quantidade total (estoque)" value={detail.qty_total} />
                <DetailRow label="Quantidade mínima" value={detail.qty_min} />
                <DetailRow label="Reservado" value={detail.qty_reserved ?? detail.qty_committed} />
                <DetailRow label="Localização" value={detail.location || '—'} />
                <DetailRow label="Fornecedor / distribuidora" value={detail.supplier || '—'} />
                <DetailRow label="Custo unitário" value={`R$ ${detail.cost.toFixed(2)}`} />
                <DetailRow label="Valor em estoque (disp.)" value={`R$ ${(detail.stock_value ?? detail.cost * detail.qty_available).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <DetailRow label="Data da compra" value={formatDate(detail.purchased_at)} />
                <DetailRow label="Cadastrado em" value={formatDateTime(detail.created_at)} />
                <DetailRow label="Última atualização" value={formatDateTime(detail.updated_at)} />
              </dl>
            </>
          ) : (
            <div className="rounded-2xl border border-hub-border/50">
              {(detail.reservations?.length ?? 0) === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-hub-text-muted">Nenhuma reserva ou consumo registrado.</p>
              ) : (
                <ul className="divide-y divide-hub-border/40">
                  {detail.reservations?.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium text-hub-navy">
                          {r.quantity} un. · {r.status === 'consumed' ? 'Consumido' : 'Reservado'}
                        </p>
                        <p className="text-xs text-hub-text-muted">
                          {r.task_code ? `Tarefa ${r.task_code}` : 'Tarefa'}
                          {r.ticket_code ? ` · Chamado ${r.ticket_code}` : ''}
                        </p>
                      </div>
                      <span className="text-xs text-hub-text-muted">{formatDateTime(r.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="flex items-center justify-center gap-2 py-12 text-sm text-hub-text-muted">
          <Package className="h-5 w-5" /> Selecione um item
        </p>
      )}
    </ConnectDrawer>
  )
}
