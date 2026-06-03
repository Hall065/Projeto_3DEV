import { BookmarkPlus, ChevronDown, Download, FileJson, FileSpreadsheet, FileText, Printer, Save, Sparkles, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ConnectCard,
  ConnectLoadingSpinner,
  ConnectPageHeader,
  FormField,
  inputClass,
  OutlineButton,
  PrimaryButton,
  selectClass,
} from '../connect/ConnectShared'
import { ReportPreview } from './ReportPreview'
import { reportPresetService, type ReportPreset } from '../../services/reportPresetService'
import { reportService, type ReportExportFormat } from '../../services/reportService'
import type {
  BuiltReport,
  ConnectFilterOptions,
  GridFilterOptions,
  ReportBuildConfig,
  ReportModule,
  ReportSchema,
} from '../../types/reports'
import { mergeSystemPreset, sanitizeReportConfig } from '../../utils/reportConfig'

const EXPORT_OPTIONS: { id: ReportExportFormat; label: string; icon: typeof Download }[] = [
  { id: 'csv', label: 'CSV (planilha)', icon: Download },
  { id: 'xlsx', label: 'Excel (.xlsx)', icon: FileSpreadsheet },
  { id: 'json', label: 'JSON (dados brutos)', icon: FileJson },
  { id: 'html', label: 'PDF / Imprimir', icon: Printer },
  { id: 'html-download', label: 'HTML (arquivo)', icon: FileText },
]

/** Estado inicial vazio — modelos completos apenas via presets */
function emptyConfig(): ReportBuildConfig {
  const today = new Date()
  const from = new Date(today)
  from.setMonth(from.getMonth() - 3)

  return {
    title: '',
    subtitle: '',
    from_date: from.toISOString().slice(0, 10),
    to_date: today.toISOString().slice(0, 10),
    filters: {},
    sections: ['cover'],
    columns: {},
  }
}

export function CustomReportBuilder({ module, embedded = false }: { module: ReportModule; embedded?: boolean }) {
  const [schema, setSchema] = useState<ReportSchema | null>(null)
  const [filterOptions, setFilterOptions] = useState<ConnectFilterOptions | GridFilterOptions | null>(null)
  const [config, setConfig] = useState<ReportBuildConfig | null>(null)
  const [report, setReport] = useState<BuiltReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [building, setBuilding] = useState(false)
  const [exporting, setExporting] = useState<ReportExportFormat | null>(null)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [serverPresets, setServerPresets] = useState<ReportPreset[]>([])
  const [presetName, setPresetName] = useState('')
  const [savingPreset, setSavingPreset] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([reportService.getSchema(module), reportService.getFilterOptions(module)])
      .then(([schemaData, options]) => {
        setSchema(schemaData)
        setFilterOptions(options)
        setConfig(emptyConfig())
        setReport(null)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Nao foi possivel carregar o construtor de relatorios.')
      })
      .finally(() => setLoading(false))
  }, [module])

  useEffect(() => {
    reportPresetService.list(module).then(setServerPresets).catch(() => setServerPresets([]))
  }, [module])

  useEffect(() => {
    if (!exportMenuOpen) return
    const onClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [exportMenuOpen])

  const runBuild = useCallback(
    async (cfg: ReportBuildConfig) => {
      setBuilding(true)
      setError(null)
      setSuccess(null)
      try {
        const built = await reportService.build(module, cfg)
        setReport(built)
        setSuccess(`Relatorio gerado com ${built.meta.sections_count} secao(oes).`)
        window.setTimeout(() => setSuccess(null), 4000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao gerar o relatorio.')
      } finally {
        setBuilding(false)
      }
    },
    [module],
  )

  const handleBuild = useCallback(() => {
    if (!config) return
    void runBuild(config)
  }, [config, runBuild])

  const toggleSection = (id: string) => {
    if (!config || id === 'cover') return
    setConfig((prev) => {
      if (!prev) return prev
      const has = prev.sections.includes(id)
      return {
        ...prev,
        sections: has ? prev.sections.filter((s) => s !== id) : [...prev.sections, id],
      }
    })
    setReport(null)
  }

  const toggleColumn = (sectionId: string, columnKey: string) => {
    setConfig((prev) => {
      if (!prev) return prev
      const current = prev.columns[sectionId] ?? []
      const next = current.includes(columnKey)
        ? current.filter((k) => k !== columnKey)
        : [...current, columnKey]
      return { ...prev, columns: { ...prev.columns, [sectionId]: next } }
    })
    setReport(null)
  }

  const applyPreset = (presetId: string) => {
    const preset = schema?.presets.find((p) => p.id === presetId)
    if (!preset || !config || !schema) return
    const next = mergeSystemPreset(schema, preset.sections, config)
    setConfig(next)
    setReport(null)
    void runBuild(next)
  }

  const handleExport = async (format: ReportExportFormat) => {
    if (!config) return
    setExportMenuOpen(false)
    setExporting(format)
    setError(null)
    try {
      await reportService.export(module, config, format)
      if (format !== 'html') {
        setSuccess('Arquivo exportado com sucesso.')
        window.setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel exportar o relatorio.')
    } finally {
      setExporting(null)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleSavePreset = async () => {
    if (!config || !presetName.trim()) return
    setSavingPreset(true)
    try {
      const created = await reportPresetService.create(module, {
        name: presetName.trim(),
        config,
      })
      setServerPresets((prev) => [...prev, created])
      setPresetName('')
      setSuccess('Preset salvo no servidor.')
      window.setTimeout(() => setSuccess(null), 3000)
    } catch {
      setError('Nao foi possivel salvar o preset.')
    } finally {
      setSavingPreset(false)
    }
  }

  const loadServerPreset = (preset: ReportPreset) => {
    if (!schema) return
    const next = sanitizeReportConfig(schema, preset.config)
    setConfig(next)
    setReport(null)
    void runBuild(next)
  }

  const handleDeletePreset = async (id: number) => {
    try {
      await reportPresetService.remove(module, id)
      setServerPresets((prev) => prev.filter((p) => p.id !== id))
    } catch {
      setError('Nao foi possivel remover o preset.')
    }
  }

  if (loading || !schema || !config) {
    return (
      <ConnectCard>
        <ConnectLoadingSpinner label="Carregando construtor de relatorios..." className="min-h-[400px]" />
      </ConnectCard>
    )
  }

  const connectOptions = module === 'connect' ? (filterOptions as ConnectFilterOptions | null) : null
  const gridOptions = module === 'grid' ? (filterOptions as GridFilterOptions | null) : null

  const filteredClasses =
    connectOptions
      ? connectOptions.classes.filter(
          (c) =>
            !config.filters.connect_course_id ||
            String(c.connect_course_id) === String(config.filters.connect_course_id),
        )
      : []

  const headerActions = (
    <>
      <div className="relative" ref={exportMenuRef}>
        <OutlineButton type="button" onClick={() => setExportMenuOpen((o) => !o)} disabled={Boolean(exporting)}>
          <Download className="h-4 w-4" />
          {exporting ? 'Exportando...' : 'Exportar'}
          <ChevronDown className="h-4 w-4 opacity-70" />
        </OutlineButton>
        {exportMenuOpen && (
          <div className="glass-panel-solid absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-xl py-1 shadow-xl">
            {EXPORT_OPTIONS.map((opt) => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.id}
                  type="button"
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-hub-text hover:bg-hub-bg disabled:opacity-50"
                  disabled={exporting === opt.id}
                  onClick={() => handleExport(opt.id)}
                >
                  <Icon className="h-4 w-4 text-hub-text-muted" />
                  {opt.label}
                </button>
              )
            })}
          </div>
        )}
      </div>
      <OutlineButton type="button" onClick={handlePrint} disabled={!report}>
        <Printer className="h-4 w-4" /> Preview local
      </OutlineButton>
      <PrimaryButton type="button" onClick={handleBuild} disabled={building}>
        <Sparkles className="h-4 w-4" />
        {building ? 'Gerando...' : report ? 'Atualizar preview' : 'Gerar preview'}
      </PrimaryButton>
    </>
  )

  return (
    <div className="w-full min-w-0">
      {!embedded && (
        <ConnectPageHeader
          title={module === 'connect' ? 'Relatorios personalizados' : 'Relatorios Grid'}
          subtitle="Monte o relatorio escolhendo secoes, colunas e filtros. Exporte em CSV, Excel, JSON ou PDF."
          actions={headerActions}
        />
      )}

      {embedded && (
        <div className="mb-4 flex w-full min-w-0 flex-wrap items-center justify-end gap-2">{headerActions}</div>
      )}

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}
      {success && (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800" role="status">
          {success}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-4 print:hidden">
          <ConnectCard className="p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-hub-navy">
              <FileText className="h-4 w-4" /> Configuracao
            </h3>

            <div className="space-y-3">
              <FormField label="Modelo rapido (sistema)">
                <select
                  className={selectClass}
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) applyPreset(e.target.value)
                    e.target.value = ''
                  }}
                >
                  <option value="">Selecionar preset...</option>
                  {schema.presets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Meus presets salvos">
                {serverPresets.length === 0 ? (
                  <p className="text-xs text-hub-text-muted">Nenhum preset salvo no servidor.</p>
                ) : (
                  <ul className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-hub-border/50 p-2">
                    {serverPresets.map((preset) => (
                      <li key={preset.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          className="flex-1 rounded px-2 py-1 text-left text-xs hover:bg-hub-bg"
                          onClick={() => loadServerPreset(preset)}
                        >
                          <BookmarkPlus className="mr-1 inline h-3 w-3" />
                          {preset.name}
                          {preset.is_shared && ' (compartilhado)'}
                        </button>
                        {preset.is_owner && (
                          <button
                            type="button"
                            className="rounded p-1 text-red-600 hover:bg-red-50"
                            onClick={() => handleDeletePreset(preset.id)}
                            aria-label="Excluir preset"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </FormField>

              <div className="flex gap-2">
                <input
                  className={inputClass}
                  placeholder="Nome do novo preset..."
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                />
                <OutlineButton type="button" disabled={savingPreset || !presetName.trim()} onClick={handleSavePreset}>
                  <Save className="h-4 w-4" />
                </OutlineButton>
              </div>

              <FormField label="Titulo do relatorio">
                <input
                  className={inputClass}
                  value={config.title}
                  placeholder={schema.default_title}
                  onChange={(e) => {
                    setConfig({ ...config, title: e.target.value })
                    setReport(null)
                  }}
                />
              </FormField>

              <FormField label="Subtitulo (opcional)">
                <input
                  className={inputClass}
                  value={config.subtitle}
                  onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-2">
                <FormField label="Data inicial">
                  <input
                    type="date"
                    className={inputClass}
                    value={config.from_date}
                    onChange={(e) => {
                      setConfig({ ...config, from_date: e.target.value })
                      setReport(null)
                    }}
                  />
                </FormField>
                <FormField label="Data final">
                  <input
                    type="date"
                    className={inputClass}
                    value={config.to_date}
                    onChange={(e) => {
                      setConfig({ ...config, to_date: e.target.value })
                      setReport(null)
                    }}
                  />
                </FormField>
              </div>
            </div>
          </ConnectCard>

          {schema.filters.length > 0 && (
            <ConnectCard className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-hub-navy">Filtros</h3>
              <div className="space-y-3">
                {schema.filters.map((filter) => {
                  if (filter.type === 'course' && module === 'connect' && connectOptions) {
                    return (
                      <FormField key={filter.key} label={filter.label}>
                        <select
                          className={selectClass}
                          value={String(config.filters.connect_course_id ?? '')}
                          onChange={(e) => {
                            setConfig({
                              ...config,
                              filters: {
                                ...config.filters,
                                connect_course_id: e.target.value,
                                connect_class_id: '',
                              },
                            })
                            setReport(null)
                          }}
                        >
                          <option value="">Todos</option>
                          {connectOptions.courses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </FormField>
                    )
                  }

                  if (filter.type === 'class' && module === 'connect') {
                    return (
                      <FormField key={filter.key} label={filter.label}>
                        <select
                          className={selectClass}
                          value={String(config.filters.connect_class_id ?? '')}
                          onChange={(e) => {
                            setConfig({
                              ...config,
                              filters: { ...config.filters, connect_class_id: e.target.value },
                            })
                            setReport(null)
                          }}
                        >
                          <option value="">Todas</option>
                          {filteredClasses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </FormField>
                    )
                  }

                  if (filter.type === 'select' && filter.options) {
                    return (
                      <FormField key={filter.key} label={filter.label}>
                        <select
                          className={selectClass}
                          value={String(config.filters[filter.key] ?? '')}
                          onChange={(e) => {
                            setConfig({
                              ...config,
                              filters: { ...config.filters, [filter.key]: e.target.value },
                            })
                            setReport(null)
                          }}
                        >
                          {filter.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </FormField>
                    )
                  }

                  if (filter.key === 'block' && module === 'grid' && gridOptions?.blocks?.length) {
                    return (
                      <FormField key={filter.key} label={filter.label}>
                        <select
                          className={selectClass}
                          value={String(config.filters.block ?? '')}
                          onChange={(e) => {
                            setConfig({
                              ...config,
                              filters: { ...config.filters, block: e.target.value },
                            })
                            setReport(null)
                          }}
                        >
                          <option value="">Todos</option>
                          {gridOptions.blocks.map((block) => (
                            <option key={block} value={block}>
                              {block}
                            </option>
                          ))}
                        </select>
                      </FormField>
                    )
                  }

                  if (filter.type === 'text') {
                    return (
                      <FormField key={filter.key} label={filter.label}>
                        <input
                          className={inputClass}
                          value={String(config.filters[filter.key] ?? '')}
                          onChange={(e) => {
                            setConfig({
                              ...config,
                              filters: { ...config.filters, [filter.key]: e.target.value },
                            })
                            setReport(null)
                          }}
                        />
                      </FormField>
                    )
                  }

                  return null
                })}
              </div>
            </ConnectCard>
          )}

          <ConnectCard className="max-h-[420px] overflow-y-auto p-4">
            <h3 className="mb-3 text-sm font-semibold text-hub-navy">Secoes do relatorio</h3>
            <div className="space-y-3">
              {schema.sections.map((section) => {
                const enabled = config.sections.includes(section.id)
                const isCover = section.id === 'cover'

                return (
                  <div key={section.id} className="rounded-lg border border-hub-border/50 p-3">
                    <label className="flex cursor-pointer items-start gap-2">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={enabled}
                        disabled={isCover}
                        onChange={() => toggleSection(section.id)}
                      />
                      <span>
                        <span className="block text-sm font-medium text-hub-navy">{section.label}</span>
                        <span className="text-xs text-hub-text-muted">{section.description}</span>
                      </span>
                    </label>

                    {enabled && section.has_columns && section.columns && (
                      <div className="mt-3 border-t border-hub-border/40 pt-3">
                        <p className="mb-2 text-xs font-medium text-hub-text-muted">Colunas</p>
                        <div className="flex flex-wrap gap-2">
                          {section.columns.map((col) => {
                            const selected = (config.columns[section.id] ?? []).includes(col.key)
                            return (
                              <button
                                key={col.key}
                                type="button"
                                onClick={() => toggleColumn(section.id, col.key)}
                                className={`rounded-full border px-2.5 py-0.5 text-xs ${
                                  selected
                                    ? 'border-hub-red bg-hub-red/10 text-hub-red'
                                    : 'border-hub-border text-hub-text-muted'
                                }`}
                              >
                                {col.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </ConnectCard>
        </div>

        <ConnectCard className="min-h-[480px] overflow-hidden p-0 print:border-0 print:shadow-none">
          <div className="border-b border-hub-border/50 bg-hub-bg/50 px-4 py-2 text-xs text-hub-text-muted print:hidden">
            {building ? (
              <>Gerando relatorio com dados do servidor...</>
            ) : report ? (
              <>Preview atualizado — exporte em CSV, Excel, JSON ou PDF pelo menu Exportar.</>
            ) : (
              <>Selecione um preset ou configure as secoes e clique em Gerar preview.</>
            )}
          </div>
          {building && !report ? (
            <ConnectLoadingSpinner label="Montando secoes e tabelas..." className="min-h-[400px]" />
          ) : (
            <ReportPreview report={report} />
          )}
        </ConnectCard>
      </div>
    </div>
  )
}
