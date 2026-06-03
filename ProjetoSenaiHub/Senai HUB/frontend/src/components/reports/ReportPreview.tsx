import { chartColorByIndex } from '../../constants/chartPalette'
import { IsometricDistributionDonut, type IsometricDonutSegmentInput } from '../connect/ConnectCharts'
import type { BuiltReport, ReportChartItem, ReportKpiItem, ReportSection } from '../../types/reports'

const kpiVariantClass: Record<string, string> = {
  blue: 'border-blue-200 bg-blue-50 text-blue-900',
  green: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  coral: 'border-orange-200 bg-orange-50 text-orange-900',
  amber: 'border-amber-200 bg-amber-50 text-amber-900',
  violet: 'border-violet-200 bg-violet-50 text-violet-900',
  senai: 'border-red-200 bg-red-50 text-red-900',
}

function SimpleBarChart({ items, horizontal }: { items: ReportChartItem[]; horizontal?: boolean }) {
  const max = Math.max(...items.map((i) => i.value), 1)

  if (horizontal) {
    return (
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={item.label} className="grid grid-cols-[120px_1fr_40px] items-center gap-2 text-sm">
            <span className="truncate text-hub-text-muted">{item.label}</span>
            <div className="h-3 overflow-hidden rounded-full bg-hub-bg">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(item.value / max) * 100}%`,
                  background: item.color ?? chartColorByIndex(index),
                }}
              />
            </div>
            <span className="text-right font-medium text-hub-navy">{item.value}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex h-48 items-end justify-around gap-2 border-b border-hub-border/40 pb-2">
      {items.map((item, index) => (
        <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <span className="text-xs font-semibold text-hub-navy">{item.value}</span>
          <div
            className="w-full max-w-[48px] rounded-t-md"
            style={{
              height: `${Math.max(12, (item.value / max) * 140)}px`,
              background: item.color ?? chartColorByIndex(index),
            }}
          />
          <span className="max-w-full truncate text-center text-[10px] text-hub-text-muted">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function ReportDonutChart({ items }: { items: ReportChartItem[] }) {
  const total = items.reduce((sum, item) => sum + item.value, 0)

  if (total <= 0) {
    return <p className="py-6 text-center text-sm text-hub-text-muted">Sem dados para exibir.</p>
  }

  const segments: IsometricDonutSegmentInput[] = items.map((item, index) => ({
    key: item.label,
    label: item.label,
    short: item.label,
    pct: (item.value / total) * 100,
    color: item.color ?? chartColorByIndex(index),
    count: item.value,
  }))

  return (
    <IsometricDistributionDonut
      segments={segments}
      centerValue={total.toLocaleString('pt-BR')}
      centerLabel="Total"
      emptyMessage="Sem dados para exibir."
      ariaLabel="Distribuicao do relatorio"
    />
  )
}

function SectionBlock({ section, meta }: { section: ReportSection; meta: BuiltReport['meta'] }) {
  if (section.type === 'cover') {
    return (
      <div className="report-cover mb-8 rounded-2xl border border-hub-border bg-gradient-to-br from-[#002847] to-[#004a7c] p-8 text-white print:break-after-page">
        <p className="text-xs uppercase tracking-widest text-white/70">{meta.module_label}</p>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{meta.title}</h2>
        {meta.subtitle && <p className="mt-2 text-white/85">{meta.subtitle}</p>}
        <div className="mt-6 grid gap-2 text-sm text-white/80 sm:grid-cols-2">
          {(meta.from_date || meta.to_date) && (
            <p>
              <span className="text-white/60">Periodo:</span>{' '}
              {meta.from_date ?? '—'} ate {meta.to_date ?? '—'}
            </p>
          )}
          <p>
            <span className="text-white/60">Gerado em:</span> {meta.generated_at}
          </p>
          {meta.filters.map((f) => (
            <p key={f.label}>
              <span className="text-white/60">{f.label}:</span> {f.value}
            </p>
          ))}
        </div>
      </div>
    )
  }

  if (section.type === 'summary' && section.paragraphs) {
    return (
      <section className="mb-8">
        <h3 className="mb-3 text-lg font-semibold text-hub-navy">{section.title}</h3>
        <div className="space-y-3 rounded-xl border border-hub-border/60 bg-white/80 p-5 text-sm leading-relaxed text-hub-text">
          {section.paragraphs.map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}
        </div>
      </section>
    )
  }

  if (section.type === 'kpis' && section.items) {
    const items = section.items as ReportKpiItem[]

    return (
      <section className="mb-8">
        <h3 className="mb-3 text-lg font-semibold text-hub-navy">{section.title}</h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
          {items.map((kpi) => (
            <div
              key={kpi.label}
              className={`rounded-xl border px-4 py-3 ${kpiVariantClass[kpi.variant] ?? kpiVariantClass.blue}`}
            >
              <p className="text-xs font-medium opacity-80">{kpi.label}</p>
              <p className="mt-1 text-xl font-bold">{kpi.value}</p>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (section.type === 'chart' && section.items) {
    const items = section.items as ReportChartItem[]

    return (
      <section className="mb-8 break-inside-avoid">
        <h3 className="mb-3 text-lg font-semibold text-hub-navy">{section.title}</h3>
        <div className="rounded-xl border border-hub-border/60 bg-white p-5">
          {section.chart_kind === 'donut' ? (
            <ReportDonutChart items={items} />
          ) : (
            <SimpleBarChart items={items} horizontal={section.chart_kind === 'bar_horizontal'} />
          )}
        </div>
      </section>
    )
  }

  if (section.type === 'table' && section.columns) {
    return (
      <section className="mb-8 break-inside-avoid">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h3 className="text-lg font-semibold text-hub-navy">{section.title}</h3>
          {section.total_rows != null && (
            <span className="text-xs text-hub-text-muted">{section.total_rows} registro(s)</span>
          )}
        </div>
        <div className="overflow-x-auto rounded-xl border border-hub-border/60">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="bg-hub-bg/90 text-left text-hub-text-muted">
              <tr>
                {section.columns.map((col) => (
                  <th key={col.key} className="px-3 py-2.5 font-medium">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(section.rows ?? []).length === 0 ? (
                <tr>
                  <td colSpan={section.columns.length} className="px-3 py-8 text-center text-hub-text-muted">
                    Nenhum registro no periodo / filtros selecionados.
                  </td>
                </tr>
              ) : (
                section.rows?.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t border-hub-border/40">
                    {section.columns!.map((col) => (
                      <td key={col.key} className="px-3 py-2">
                        {row[col.key] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    )
  }

  return null
}

export function ReportPreview({ report, className = '' }: { report: BuiltReport | null; className?: string }) {
  if (!report) {
    return (
      <div className={`flex min-h-[320px] items-center justify-center rounded-xl border border-dashed border-hub-border text-sm text-hub-text-muted ${className}`}>
        Selecione um preset ou configure as secoes e clique em &quot;Gerar preview&quot;.
      </div>
    )
  }

  return (
    <div id="report-print-root" className={`report-preview bg-white p-6 sm:p-8 ${className}`}>
      {report.sections.map((section) => (
        <SectionBlock key={section.id} section={section} meta={report.meta} />
      ))}
      <footer className="mt-8 border-t border-hub-border/40 pt-4 text-center text-xs text-hub-text-muted print:fixed print:bottom-0 print:left-0 print:right-0">
        {report.meta.module_label} — documento gerado automaticamente — {report.meta.generated_at}
      </footer>
    </div>
  )
}
