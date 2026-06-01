import { BookmarkPlus, Download, FileText, Printer, Save, Sparkles, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
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
import { reportService } from '../../services/reportService'
import type {
  BuiltReport,
  ConnectFilterOptions,
  GridFilterOptions,
  ReportBuildConfig,
  ReportModule,
  ReportSchema,
  ReportSectionDef,
} from '../../types/reports'
import { mergeSystemPreset, sanitizeReportConfig } from '../../utils/reportConfig'

const STORAGE_KEY = (module: ReportModule) => `senai_report_config_${module}`

function defaultColumns(section: ReportSectionDef): string[] {
  return (section.columns ?? []).filter((c) => c.default !== false).map((c) => c.key)
}

function initialConfig(schema: ReportSchema): ReportBuildConfig {
  const sections = schema.sections.filter((s) => s.default_enabled).map((s) => s.id)
  const columns: Record<string, string[]> = {}
  schema.sections.forEach((s) => {
    if (s.has_columns && s.columns) {
      columns[s.id] = defaultColumns(s)
    }
  })

  const today = new Date()
  const from = new Date(today)
  from.setMonth(from.getMonth() - 3)

  return {
    title: schema.default_title,
    subtitle: '',
    from_date: from.toISOString().slice(0, 10),
    to_date: today.toISOString().slice(0, 10),
    filters: {},
    sections: sections.includes('cover') ? sections : ['cover', ...sections],
    columns,
  }
}

export function CustomReportBuilder({ module }: { module: ReportModule }) {
  const [schema, setSchema] = useState<ReportSchema | null>(null)
  const [filterOptions, setFilterOptions] = useState<ConnectFilterOptions | GridFilterOptions | null>(null)
  const [config, setConfig] = useState<ReportBuildConfig | null>(null)
  const [report, setReport] = useState<BuiltReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [building, setBuilding] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [serverPresets, setServerPresets] = useState<ReportPreset[]>([])
  const [presetName, setPresetName] = useState('')
  const [savingPreset, setSavingPreset] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([reportService.getSchema(module), reportService.getFilterOptions(module)])
      .then(([schemaData, options]) => {
        setSchema(schemaData)
        setFilterOptions(options)
        const saved = localStorage.getItem(STORAGE_KEY(module))
        let base = initialConfig(schemaData)
        if (saved) {
          try {
            base = sanitizeReportConfig(schemaData, JSON.parse(saved) as ReportBuildConfig)
          } catch {
            /* ignore invalid draft */
          }
        }
        setConfig(base)
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
    if (config) {
      localStorage.setItem(STORAGE_KEY(module), JSON.stringify(config))
    }
  }, [config, module])

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
  }

  const applyPreset = (presetId: string) => {
    const preset = schema?.presets.find((p) => p.id === presetId)
    if (!preset || !config || !schema) return
    setConfig(mergeSystemPreset(schema, preset.sections, config))
    setReport(null)
  }

  const handleBuild = useCallback(async () => {
    if (!config) return
    setBuilding(true)
    setError(null)
    try {
      const built = await reportService.build(module, config)
      setReport(built)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao gerar o relatorio.')
    } finally {
      setBuilding(false)
    }
  }, [config, module])

  const handlePrint = () => {
    window.print()
  }

  const handleExportCsv = async () => {
    if (!config) return
    setExporting(true)
    try {
      await reportService.exportCsv(module, config)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel exportar CSV.')
    } finally {
      setExporting(false)
    }
  }

  const handleExportPdf = async () => {
    if (!config) return
    setExportingPdf(true)
    try {
      await reportService.exportHtml(module, config)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel abrir o documento para impressao/PDF.')
    } finally {
      setExportingPdf(false)
    }
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
    } catch {
      setError('Nao foi possivel salvar o preset.')
    } finally {
      setSavingPreset(false)
    }
  }

  const loadServerPreset = (preset: ReportPreset) => {
    if (!schema) return
    setConfig(sanitizeReportConfig(schema, preset.config))
    setReport(null)
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

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title={module === 'connect' ? 'Relatorios personalizados' : 'Relatorios Grid'}
        subtitle="Monte o relatorio escolhendo secoes, colunas e filtros. Ideal para reunioes, diretoria e auditoria."
        actions={
          <>
            <OutlineButton type="button" onClick={handleExportCsv} disabled={exporting || !config}>
              <Download className="h-4 w-4" />
              {exporting ? 'Exportando...' : 'Exportar CSV'}
            </OutlineButton>
            <OutlineButton type="button" onClick={handleExportPdf} disabled={exportingPdf || !config}>
              <Printer className="h-4 w-4" />
              {exportingPdf ? 'Abrindo...' : 'PDF / Imprimir'}
            </OutlineButton>
            <OutlineButton type="button" onClick={handlePrint} disabled={!report}>
              <Printer className="h-4 w-4" /> Preview local
            </OutlineButton>
            <PrimaryButton type="button" onClick={handleBuild} disabled={building}>
              <Sparkles className="h-4 w-4" />
              {building ? 'Gerando...' : 'Gerar preview'}
            </PrimaryButton>
          </>
        }
      />

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
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
                  onChange={(e) => setConfig({ ...config, title: e.target.value })}
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
                    onChange={(e) => setConfig({ ...config, from_date: e.target.value })}
                  />
                </FormField>
                <FormField label="Data final">
                  <input
                    type="date"
                    className={inputClass}
                    value={config.to_date}
                    onChange={(e) => setConfig({ ...config, to_date: e.target.value })}
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
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              filters: {
                                ...config.filters,
                                connect_course_id: e.target.value,
                                connect_class_id: '',
                              },
                            })
                          }
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
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              filters: { ...config.filters, connect_class_id: e.target.value },
                            })
                          }
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
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              filters: { ...config.filters, [filter.key]: e.target.value },
                            })
                          }
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
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              filters: { ...config.filters, block: e.target.value },
                            })
                          }
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
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              filters: { ...config.filters, [filter.key]: e.target.value },
                            })
                          }
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
            Preview — use Imprimir / PDF para salvar (Ctrl+P → Salvar como PDF)
          </div>
          <ReportPreview report={report} />
        </ConnectCard>
      </div>
    </div>
  )
}
