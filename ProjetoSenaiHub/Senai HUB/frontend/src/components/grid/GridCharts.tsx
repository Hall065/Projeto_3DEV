import { ConnectLoadingSpinner } from '../connect/ConnectShared'

export function GridDonutChart({
  items,
  centerLabel,
  centerValue,
  loading,
}: {
  items: { label: string; value: number; color: string }[]
  centerLabel: string
  centerValue: string | number
  loading?: boolean
}) {
  if (loading) return <ConnectLoadingSpinner label="Carregando gráfico..." className="min-h-[180px]" />

  const total = items.reduce((s, i) => s + i.value, 0) || 1
  let offset = 0
  const segments = items.map((item) => {
    const pct = (item.value / total) * 100
    const seg = { ...item, pct, offset }
    offset += pct
    return seg
  })

  const gradient = segments
    .map((s) => `${s.color} ${s.offset}% ${s.offset + s.pct}%`)
    .join(', ')

  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-center">
      <div
        className="relative h-36 w-36 shrink-0 rounded-full sm:h-40 sm:w-40"
        style={{ background: `conic-gradient(${gradient})` }}
      >
        <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-white text-center">
          <span className="text-xl font-bold text-hub-navy sm:text-2xl">{centerValue}</span>
          <span className="text-xs text-hub-text-muted">{centerLabel}</span>
        </div>
      </div>
      <ul className="flex w-full min-w-0 flex-col gap-2 sm:max-w-[200px]">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-hub-text-muted">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="truncate">{s.label}</span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-hub-navy">{s.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
