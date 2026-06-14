import { ImageIcon, Package } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConnectDrawer } from '../connect/ConnectDrawer'
import { ConnectDrawerHeroCard } from '../connect/ConnectDrawerHeroCard'
import { ConnectLoadingSpinner } from '../connect/ConnectShared'
import { GridInventoryStatusBadge } from './GridBadges'
import { GridInventoryThumb } from './GridInventoryThumb'
import { gridService } from '../../services/gridService'
import type { GridInventoryItemDetail } from '../../types/grid'

import { intlLocale, normalizeLocale } from '../../i18n'

function formatDate(value: string | undefined | null, locale: string) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString(locale)
  } catch {
    return value
  }
}

function formatDateTime(value: string | undefined | null, locale: string) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString(locale)
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
  const { t, i18n } = useTranslation()
  const locale = intlLocale(normalizeLocale(i18n.language))
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
      .catch(() => setError(t('gridComponents.shared.loadItemError')))
      .finally(() => setLoading(false))
  }, [open, itemId])

  return (
    <ConnectDrawer
      open={open}
      onClose={onClose}
      title={detail?.title ?? t('gridComponents.shared.stockItem')}
      subtitle={detail?.category ? `${detail.category}${detail.sku ? ` · SKU ${detail.sku}` : ''}` : t('common.loading')}
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
            {syncingImage ? t('gridComponents.shared.syncingImage') : t('gridComponents.shared.syncImage')}
          </button>
        ) : undefined
      }
    >
      {loading ? (
        <ConnectLoadingSpinner label={t('gridComponents.shared.loadingItem')} className="min-h-[320px]" />
      ) : error ? (
        <p className="py-12 text-center text-sm text-red-600">{error}</p>
      ) : detail ? (
        <div className="space-y-6">
          <ConnectDrawerHeroCard onBack={onClose}>
            <GridInventoryThumb title={detail.title} imageUrl={detail.image_url} category={detail.category} size="lg" />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h3 className="text-lg font-bold text-hub-navy">{detail.title}</h3>
              <p className="mt-1 text-sm text-hub-text-muted">{detail.description || t('gridComponents.shared.noDescription')}</p>
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
              {t('gridComponents.shared.overview')}
            </button>
            <button
              type="button"
              onClick={() => setTab('reservations')}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
                tab === 'reservations' ? 'border-hub-red text-hub-red' : 'border-transparent text-hub-text-muted hover:text-hub-navy'
              }`}
            >
              {t('gridComponents.shared.reservations', { count: detail.reservations?.length ?? 0 })}
            </button>
          </div>

          {tab === 'overview' ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StockKpi label={t('gridComponents.shared.available')} value={detail.qty_available} />
                <StockKpi
                  label={t('gridComponents.shared.inUse')}
                  value={detail.qty_in_use}
                  hint={t('gridComponents.shared.inUseHint')}
                  variant={detail.qty_in_use > 0 ? 'warn' : undefined}
                />
                <StockKpi
                  label={t('gridComponents.shared.committed')}
                  value={detail.qty_committed}
                  hint={t('gridComponents.shared.committedHint')}
                />
                <StockKpi label={t('gridComponents.shared.consumedQty')} value={detail.qty_consumed} variant="muted" />
              </div>

              <dl className="surface-inset rounded-2xl border border-hub-border/50 px-4">
                <DetailRow label={t('gridComponents.shared.totalQty')} value={detail.qty_total} />
                <DetailRow label={t('gridComponents.shared.minQty')} value={detail.qty_min} />
                <DetailRow label={t('gridComponents.shared.reserved')} value={detail.qty_reserved ?? detail.qty_committed} />
                <DetailRow label={t('gridComponents.shared.location')} value={detail.location || '—'} />
                <DetailRow label={t('gridComponents.shared.supplier')} value={detail.supplier || '—'} />
                <DetailRow label={t('gridComponents.shared.unitCost')} value={`R$ ${detail.cost.toFixed(2)}`} />
                <DetailRow
                  label={t('gridComponents.shared.stockValue')}
                  value={`R$ ${(detail.stock_value ?? detail.cost * detail.qty_available).toLocaleString(locale, { minimumFractionDigits: 2 })}`}
                />
                <DetailRow label={t('gridComponents.shared.purchaseDate')} value={formatDate(detail.purchased_at, locale)} />
                <DetailRow label={t('gridComponents.shared.registeredAt')} value={formatDateTime(detail.created_at, locale)} />
                <DetailRow label={t('gridComponents.shared.lastUpdate')} value={formatDateTime(detail.updated_at, locale)} />
              </dl>
            </>
          ) : (
            <div className="rounded-2xl border border-hub-border/50">
              {(detail.reservations?.length ?? 0) === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-hub-text-muted">{t('gridComponents.shared.noReservations')}</p>
              ) : (
                <ul className="divide-y divide-hub-border/40">
                  {detail.reservations?.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium text-hub-navy">
                          {t('gridComponents.shared.units', {
                            count: r.quantity,
                            status: r.status === 'consumed' ? t('gridComponents.shared.consumed') : t('gridComponents.shared.reserved'),
                          })}
                        </p>
                        <p className="text-xs text-hub-text-muted">
                          {r.task_code ? `${t('gridComponents.shared.task')} ${r.task_code}` : t('gridComponents.shared.task')}
                          {r.ticket_code ? ` · ${t('gridComponents.shared.ticket')} ${r.ticket_code}` : ''}
                        </p>
                      </div>
                      <span className="text-xs text-hub-text-muted">{formatDateTime(r.created_at, locale)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="flex items-center justify-center gap-2 py-12 text-sm text-hub-text-muted">
          <Package className="h-5 w-5" /> {t('gridComponents.shared.selectItem')}
        </p>
      )}
    </ConnectDrawer>
  )
}
