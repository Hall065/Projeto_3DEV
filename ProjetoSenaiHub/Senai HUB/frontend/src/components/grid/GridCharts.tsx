import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  chartColorByIndex,
  chartColorForTheme,
  chartGradientByIndex,
  resolveChartGradient,
  sanitizeChartSegmentKey,
} from '../../constants/chartPalette'
import { useAppearance } from '../../contexts/AppearanceContext'
import i18n, { intlLocale, normalizeLocale } from '../../i18n'
import { TICKET_WORKFLOW_ORDER } from '../../utils/gridTicketWorkflow'
import { getTicketStatusLabel } from './GridBadges'
import { IsometricDistributionDonut, type IsometricDonutSegmentInput } from '../connect/ConnectCharts'
import { ConnectLoadingSpinner } from '../connect/ConnectShared'

const CHART_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const CHART_REVEAL_MS = 620

export type GridChartBreakdownItem = { label: string; value: number; count?: number; color: string }

export function breakdownTotalCount(items: GridChartBreakdownItem[]): number {
  return items.reduce((sum, item) => sum + (item.count ?? 0), 0)
}

export function breakdownFinishedCount(items: GridChartBreakdownItem[], finishedLabel?: string): number {
  const candidates = new Set([
    finishedLabel ?? i18n.t('gridComponents.charts.finishedLabel'),
    getTicketStatusLabel('concluido'),
  ])
  return items.find((item) => candidates.has(item.label))?.count ?? 0
}

function ChartPanel({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <section className="chart-panel flex min-w-0 w-full flex-col overflow-visible rounded-2xl border border-hub-border/50 p-4 sm:p-5">
      <header className="mb-4 shrink-0 border-b border-hub-border/30 pb-3">
        <h3 className="text-base font-semibold text-hub-navy sm:text-lg">{title}</h3>
        <p className="mt-0.5 text-xs text-hub-text-muted sm:text-sm">{subtitle}</p>
      </header>
      <div className="min-h-[180px] min-w-0 w-full flex-1">{children}</div>
    </section>
  )
}

function ChartReveal({ children, delayMs = 0 }: { children: React.ReactNode; delayMs?: number }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), delayMs)
    return () => window.clearTimeout(timer)
  }, [delayMs])

  return (
    <div
      className={`isolate w-full min-w-0 transition-[opacity,transform] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
      style={{ transitionDuration: `${CHART_REVEAL_MS}ms` }}
    >
      {children}
    </div>
  )
}

function gridDonutShortLabel(label: string, t: (key: string, options?: { defaultValue?: string }) => string): string {
  for (const status of TICKET_WORKFLOW_ORDER) {
    if (label === getTicketStatusLabel(status)) {
      return t(`gridComponents.charts.shortLabels.${status}`, { defaultValue: label })
    }
  }
  if (label.length <= 16) return label
  return `${label.slice(0, 15)}…`
}

/** Donut isométrico — mesmo componente visual do Connect */
export function GridDistributionDonut({
  items,
  centerLabel,
  centerValue,
  loading,
  emptyMessage,
}: {
  items: GridChartBreakdownItem[]
  centerLabel: string
  centerValue: string | number
  loading?: boolean
  emptyMessage?: string
}) {
  const { t, i18n: i18nInstance } = useTranslation()
  const { wallpaperTone } = useAppearance()
  const isDark = wallpaperTone === 'dark'
  const numberLocale = intlLocale(normalizeLocale(i18nInstance.language))
  const resolvedEmptyMessage = emptyMessage ?? t('gridComponents.charts.emptyData')
  const totalCount = breakdownTotalCount(items)
  const pctSum = items.reduce((sum, item) => sum + item.value, 0) || 1

  const segments: IsometricDonutSegmentInput[] = items.map((item, index) => {
    const lightColor = item.color?.trim() ? item.color : chartColorByIndex(index, false)
    const color = chartColorForTheme(lightColor, index, isDark)
    return {
      key: sanitizeChartSegmentKey(item.label, index),
      label: item.label,
      short: gridDonutShortLabel(item.label, t),
      pct: item.count != null && totalCount > 0 ? (item.count / totalCount) * 100 : (item.value / pctSum) * 100,
      color,
      gradient: resolveChartGradient(lightColor, index, isDark),
      count: item.count,
    }
  })

  return (
    <IsometricDistributionDonut
      segments={segments}
      centerValue={centerValue}
      centerLabel={centerLabel}
      centerSubtitle={
        totalCount > 0
          ? t('gridComponents.charts.ticketsTotal', { count: totalCount.toLocaleString(numberLocale) })
          : undefined
      }
      loading={loading}
      loadingLabel={t('gridComponents.charts.loadingChart')}
      emptyMessage={resolvedEmptyMessage}
      ariaLabel={t('gridComponents.charts.distributionAria', { label: centerLabel })}
    />
  )
}

/** @deprecated use GridDistributionDonut */
export const GridDonutChart = GridDistributionDonut

export function GridMonthlyBarChart({
  items,
  loading,
}: {
  items: { label: string; count: number }[]
  loading?: boolean
}) {
  const { t } = useTranslation()
  const { wallpaperTone } = useAppearance()
  const isDark = wallpaperTone === 'dark'
  const [animated, setAnimated] = useState(false)
  const max = Math.max(...items.map((i) => i.count), 1)

  useEffect(() => {
    if (loading) {
      setAnimated(false)
      return
    }
    const timer = window.setTimeout(() => setAnimated(true), 150)
    return () => window.clearTimeout(timer)
  }, [loading, items])

  if (loading) return <ConnectLoadingSpinner label={t('gridComponents.charts.loadingData')} className="min-h-[180px]" />

  if (items.length === 0) {
    return <p className="py-10 text-center text-sm text-hub-text-muted">{t('gridComponents.charts.noRecordsInPeriod')}</p>
  }

  return (
    <ChartReveal delayMs={100}>
      <ul className="flex w-full min-w-0 flex-col gap-3 xl:hidden">
        {items.map((item, index) => {
          const widthPct = (item.count / max) * 100
          const { from, to } = chartGradientByIndex(index, isDark)
          const color = chartColorByIndex(index, isDark)
          return (
            <li key={item.label} className="min-w-0">
              <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                <span className="truncate font-medium text-hub-text">{item.label}</span>
                <span className="shrink-0 font-bold tabular-nums" style={{ color }}>
                  {item.count}
                </span>
              </div>
              <div className="chart-bar-track h-3 overflow-hidden rounded-full">
                <div
                  className="h-full origin-left rounded-full motion-reduce:transition-none"
                  style={{
                    width: `${Math.max(widthPct, 8)}%`,
                    background: `linear-gradient(to right, ${from}, ${to})`,
                    transform: animated ? 'scaleX(1)' : 'scaleX(0)',
                    transition: `transform 0.68s ${CHART_EASE}`,
                    transitionDelay: `${index * 55}ms`,
                  }}
                />
              </div>
            </li>
          )
        })}
      </ul>

      <div className="hidden w-full min-w-0 xl:block">
        <div className="scrollbar-minimal-x -mx-1 overflow-x-auto pb-2">
          <div
            className="flex h-52 min-w-full items-end justify-center gap-4 px-2 sm:gap-6"
            style={{ minWidth: `${Math.max(items.length * 72, 280)}px` }}
          >
            {items.map((item, index) => {
              const heightPct = Math.max((item.count / max) * 100, 12)
              const { from, to } = chartGradientByIndex(index, isDark)
              return (
                <div
                  key={item.label}
                  className="flex w-14 shrink-0 flex-col items-center gap-2 sm:w-16"
                  title={`${item.label}: ${item.count}`}
                >
                  <div className="relative flex h-36 w-full items-end justify-center">
                    <div className="relative w-10 sm:w-12" style={{ height: `${heightPct}%` }}>
                      <span className="absolute -top-5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-xs font-bold tabular-nums text-hub-text">
                        {item.count}
                      </span>
                      <div
                        className="h-full w-full origin-bottom overflow-hidden rounded-t-lg motion-reduce:transition-none"
                        style={{
                          transform: animated ? 'scaleY(1)' : 'scaleY(0)',
                          transition: `transform 0.72s ${CHART_EASE}`,
                          transitionDelay: `${index * 60}ms`,
                        }}
                      >
                        <div
                          className="h-full w-full shadow-sm"
                          style={{ background: `linear-gradient(to top, ${from}, ${to})` }}
                        />
                      </div>
                    </div>
                  </div>
                  <span className="line-clamp-2 w-full text-center text-[11px] font-medium leading-tight text-hub-text">
                    {item.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </ChartReveal>
  )
}

export function GridHorizontalBarChart({
  items,
  loading,
  valueLabel,
}: {
  items: { name: string; count: number }[]
  loading?: boolean
  valueLabel?: string
}) {
  const { t } = useTranslation()
  const { wallpaperTone } = useAppearance()
  const isDark = wallpaperTone === 'dark'
  const [animated, setAnimated] = useState(false)
  const max = Math.max(...items.map((i) => i.count), 1)
  const resolvedValueLabel = valueLabel ?? t('gridComponents.charts.ticketsValueLabel')

  useEffect(() => {
    if (loading) {
      setAnimated(false)
      return
    }
    const timer = window.setTimeout(() => setAnimated(true), 200)
    return () => window.clearTimeout(timer)
  }, [loading, items])

  if (loading) return <ConnectLoadingSpinner label={t('gridComponents.charts.loading')} className="min-h-[160px]" />

  if (items.length === 0) {
    return <p className="py-10 text-center text-sm text-hub-text-muted">{t('gridComponents.charts.noDataAvailable')}</p>
  }

  return (
    <ChartReveal delayMs={150}>
      <ul className="flex w-full min-w-0 flex-col gap-3 sm:gap-3.5">
        {items.map((item, index) => {
          const widthPct = (item.count / max) * 100
          const { from, to } = chartGradientByIndex(index, isDark)
          const color = chartColorByIndex(index, isDark)
          return (
            <li key={item.name} className="min-w-0">
              <div className="mb-2 flex items-start justify-between gap-3">
                <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-hub-text" title={item.name}>
                  {item.name}
                </span>
                <span className="chart-stat-badge shrink-0 rounded-lg px-2.5 py-1 text-sm font-bold tabular-nums">
                  {item.count} {resolvedValueLabel}
                </span>
              </div>
              <div className="chart-bar-track relative h-3 overflow-hidden rounded-full sm:h-3.5">
                <div
                  className="absolute inset-y-0 left-0 origin-left rounded-full motion-reduce:transition-none"
                  style={{
                    width: `${Math.max(widthPct, 4)}%`,
                    background: isDark ? color : `linear-gradient(to right, ${from}, ${to})`,
                    transform: animated ? 'scaleX(1)' : 'scaleX(0)',
                    transition: `transform 0.68s ${CHART_EASE}`,
                    transitionDelay: `${index * 55}ms`,
                  }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </ChartReveal>
  )
}

export function GridQuickReportsSection({
  loading,
  maintenanceBreakdown,
  priorityBreakdown,
  ticketsByMonth,
  ticketsByTechnician,
  topInventory,
  tasksByColumn,
}: {
  loading: boolean
  maintenanceBreakdown: GridChartBreakdownItem[]
  priorityBreakdown: GridChartBreakdownItem[]
  ticketsByMonth: { label: string; count: number }[]
  ticketsByTechnician: { name: string; count: number }[]
  topInventory: { name: string; count: number }[]
  tasksByColumn?: { label: string; count: number }[]
}) {
  const { t } = useTranslation()
  const statusTotal = breakdownTotalCount(maintenanceBreakdown)
  const priorityTotal = breakdownTotalCount(priorityBreakdown)

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 sm:gap-8">
      <ChartPanel title={t('gridComponents.charts.statusTitle')} subtitle={t('gridComponents.charts.statusSubtitle')}>
        <GridDistributionDonut
          items={maintenanceBreakdown}
          centerValue={statusTotal || '—'}
          centerLabel={t('gridComponents.charts.ticketsLabel')}
          loading={loading}
        />
      </ChartPanel>
      <ChartPanel title={t('gridComponents.charts.priorityTitle')} subtitle={t('gridComponents.charts.prioritySubtitle')}>
        <GridDistributionDonut
          items={priorityBreakdown}
          centerValue={priorityTotal || '—'}
          centerLabel={t('gridComponents.charts.ticketsLabel')}
          loading={loading}
        />
      </ChartPanel>
      {tasksByColumn && tasksByColumn.some((c) => c.count > 0) && (
        <ChartPanel title={t('gridComponents.charts.tasksByColumnTitle')} subtitle={t('gridComponents.charts.tasksByColumnSubtitle')}>
          <GridMonthlyBarChart items={tasksByColumn.map((c) => ({ label: c.label, count: c.count }))} loading={loading} />
        </ChartPanel>
      )}
      <ChartPanel title={t('gridComponents.charts.ticketsByMonthTitle')} subtitle={t('gridComponents.charts.ticketsByMonthSubtitle')}>
        <GridMonthlyBarChart items={ticketsByMonth} loading={loading} />
      </ChartPanel>
      <ChartPanel title={t('gridComponents.charts.byTechnicianTitle')} subtitle={t('gridComponents.charts.byTechnicianSubtitle')}>
        <GridHorizontalBarChart items={ticketsByTechnician} loading={loading} valueLabel={t('gridComponents.charts.ticketsValueLabel')} />
      </ChartPanel>
      {topInventory.length > 0 && (
        <ChartPanel title={t('gridComponents.charts.criticalItemsTitle')} subtitle={t('gridComponents.charts.criticalItemsSubtitle')}>
          <GridHorizontalBarChart items={topInventory} loading={loading} valueLabel={t('gridComponents.charts.unitsValueLabel')} />
        </ChartPanel>
      )}
    </div>
  )
}
