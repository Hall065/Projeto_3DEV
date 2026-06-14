import { Download, FileSpreadsheet, History, Upload } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ConnectCard,
  ConnectLoadingSpinner,
  ConnectPageHeader,
  OutlineButton,
  PrimaryButton,
} from '../../components/connect/ConnectShared'
import { useCrudToast } from '../../hooks/useCrudToast'
import { intlLocale, normalizeLocale } from '../../i18n'
import { spreadsheetService } from '../../services/spreadsheetService'
import { parseApiError } from '../../utils/parseApiError'
import type {
  SpreadsheetImportLog,
  SpreadsheetImportPreview,
  SpreadsheetImportResult,
  SpreadsheetTemplate,
} from '../../types/spreadsheet'

type SpreadsheetModule = 'connect' | 'grid'

export function SpreadsheetHubPage({ module }: { module: SpreadsheetModule }) {
  const { t, i18n } = useTranslation()
  const crudToast = useCrudToast()
  const locale = intlLocale(normalizeLocale(i18n.language))
  const copy = useMemo(
    () => ({
      title: t(module === 'connect' ? 'spreadsheet.connectTitle' : 'spreadsheet.gridTitle'),
      subtitle: t(module === 'connect' ? 'spreadsheet.connectSubtitle' : 'spreadsheet.gridSubtitle'),
      hint: t(module === 'connect' ? 'spreadsheet.connectHint' : 'spreadsheet.gridHint'),
    }),
    [module, t],
  )
  const fileRef = useRef<HTMLInputElement>(null)
  const [templates, setTemplates] = useState<SpreadsheetTemplate[]>([])
  const [selectedKey, setSelectedKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<'template' | 'export' | 'preview' | 'import' | null>(null)
  const [preview, setPreview] = useState<SpreadsheetImportPreview | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [result, setResult] = useState<SpreadsheetImportResult | null>(null)
  const [logs, setLogs] = useState<SpreadsheetImportLog[]>([])
  const [error, setError] = useState<string | null>(null)

  const loadLogs = () => {
    spreadsheetService.getImportLogs(module).then(setLogs).catch(() => setLogs([]))
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([spreadsheetService.listTemplates(module)])
      .then(([list]) => {
        setTemplates(list)
        setSelectedKey((prev) => prev || list[0]?.key || '')
        loadLogs()
      })
      .catch((err) => setError(parseApiError(err, t('spreadsheet.loadTemplatesError'))))
      .finally(() => setLoading(false))
  }, [module, t])

  const selected = templates.find((item) => item.key === selectedKey)

  const run = async (action: 'template' | 'export' | 'preview', file?: File) => {
    if (!selectedKey) return
    setError(null)
    if (action !== 'preview') {
      setResult(null)
      setPreview(null)
      setPendingFile(null)
    }
    setBusy(action === 'preview' ? 'preview' : action)
    try {
      if (action === 'template') {
        await spreadsheetService.downloadTemplate(module, selectedKey)
        crudToast.notifySuccess(t('spreadsheet.templateDownloaded'))
      } else if (action === 'export') {
        await spreadsheetService.exportData(module, selectedKey)
        crudToast.notifySuccess(t('spreadsheet.dataExported'))
      } else if (action === 'preview' && file) {
        const data = await spreadsheetService.previewFile(module, selectedKey, file)
        setPreview(data)
        setPendingFile(file)
        setResult(null)
      }
    } catch (err) {
      crudToast.notifyError(err, t('spreadsheet.operationFailed'))
    } finally {
      setBusy(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const confirmImport = async () => {
    if (!selectedKey || !pendingFile) return
    setBusy('import')
    setError(null)
    try {
      const data = await spreadsheetService.importFile(module, selectedKey, pendingFile)
      setResult(data)
      setPreview(null)
      setPendingFile(null)
      loadLogs()
      crudToast.notifySuccess(
        t('spreadsheet.importComplete', { created: data.created, updated: data.updated }),
      )
    } catch (err) {
      crudToast.notifyError(err, t('spreadsheet.importFailed'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader title={copy.title} subtitle={copy.subtitle} />

      <ConnectCard className="mb-4 p-4">
        <p className="text-sm text-hub-text-muted">{copy.hint}</p>
        <p className="mt-2 text-xs text-hub-text-muted">{t('spreadsheet.formatsHint')}</p>
      </ConnectCard>

      {loading ? (
        <ConnectCard>
          <ConnectLoadingSpinner label={t('spreadsheet.loadingTemplates')} />
        </ConnectCard>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <ConnectCard className="p-3">
            <h3 className="mb-3 flex items-center gap-2 px-2 text-sm font-semibold text-hub-navy">
              <FileSpreadsheet className="h-4 w-4" />
              {t('spreadsheet.availableTables')}
            </h3>
            <ul className="space-y-1">
              {templates.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedKey(item.key)
                      setResult(null)
                      setPreview(null)
                      setPendingFile(null)
                      setError(null)
                    }}
                    className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
                      selectedKey === item.key
                        ? 'bg-hub-red/10 font-medium text-hub-red'
                        : 'text-hub-navy hover:bg-hub-bg'
                    }`}
                  >
                    {item.label}
                    <span className="mt-0.5 block text-xs font-normal text-hub-text-muted">
                      {item.importable ? t('spreadsheet.importExport') : t('spreadsheet.exportOnly')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </ConnectCard>

          <div className="space-y-4">
            <ConnectCard className="p-4 sm:p-6">
              {selected ? (
                <>
                  <h3 className="text-lg font-semibold text-hub-navy">{selected.label}</h3>
                  <p className="mt-1 text-sm text-hub-text-muted">{selected.description}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <PrimaryButton type="button" disabled={busy !== null} onClick={() => run('template')}>
                      <Download className="h-4 w-4" />
                      {busy === 'template' ? t('spreadsheet.downloading') : t('spreadsheet.downloadTemplate')}
                    </PrimaryButton>

                    {selected.exportable && (
                      <OutlineButton type="button" disabled={busy !== null} onClick={() => run('export')}>
                        <Download className="h-4 w-4" />
                        {busy === 'export' ? t('spreadsheet.exporting') : t('spreadsheet.exportData')}
                      </OutlineButton>
                    )}

                    {selected.importable && (
                      <>
                        <input
                          ref={fileRef}
                          type="file"
                          accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) run('preview', file)
                          }}
                        />
                        <OutlineButton
                          type="button"
                          disabled={busy !== null}
                          onClick={() => fileRef.current?.click()}
                        >
                          <Upload className="h-4 w-4" />
                          {busy === 'preview' ? t('spreadsheet.analyzing') : t('spreadsheet.importFile')}
                        </OutlineButton>
                      </>
                    )}
                  </div>

                  <div className="mt-6">
                    <h4 className="mb-2 text-sm font-semibold text-hub-navy">{t('spreadsheet.modelColumns')}</h4>
                    <div className="overflow-x-auto rounded-lg border border-hub-border/60">
                      <table className="w-full min-w-[480px] text-sm">
                        <thead className="bg-hub-bg/80 text-left text-hub-text-muted">
                          <tr>
                            <th className="px-3 py-2">{t('spreadsheet.column')}</th>
                            <th className="px-3 py-2">{t('spreadsheet.required')}</th>
                            <th className="px-3 py-2">{t('spreadsheet.example')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selected.columns.map((col) => (
                            <tr key={col.key} className="border-t border-hub-border/40">
                              <td className="px-3 py-2 font-mono text-xs">{col.header}</td>
                              <td className="px-3 py-2">
                                {col.required ? t('connect.common.yes') : t('connect.common.no')}
                              </td>
                              <td className="px-3 py-2 text-hub-text-muted">{col.example || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {error && (
                    <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {error}
                    </p>
                  )}

                  {preview && (
                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                      <p className="font-semibold">{t('spreadsheet.previewTitle')}</p>
                      <p className="mt-1">
                        {t('spreadsheet.previewSummary', {
                          rows: preview.total_rows,
                          created: preview.created,
                          updated: preview.updated,
                          errors: preview.errors.length,
                        })}
                      </p>
                      {preview.errors.length > 0 && (
                        <ul className="mt-2 max-h-32 list-disc space-y-1 overflow-y-auto pl-5 text-red-800">
                          {preview.errors.slice(0, 15).map((err) => (
                            <li key={`${err.row}-${err.message}`}>
                              {t('spreadsheet.previewRow', { row: err.row, message: err.message })}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="mt-3 flex gap-2">
                        <PrimaryButton type="button" disabled={busy === 'import'} onClick={confirmImport}>
                          {busy === 'import' ? t('spreadsheet.importing') : t('spreadsheet.confirmImport')}
                        </PrimaryButton>
                        <OutlineButton
                          type="button"
                          onClick={() => {
                            setPreview(null)
                            setPendingFile(null)
                          }}
                        >
                          {t('common.cancel')}
                        </OutlineButton>
                      </div>
                    </div>
                  )}

                  {result && result.errors.length > 0 && (
                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
                      <p className="font-semibold">{t('spreadsheet.importErrorsTitle')}</p>
                      <ul className="mt-2 max-h-40 list-disc space-y-1 overflow-y-auto pl-5 text-red-700">
                        {result.errors.map((err) => (
                          <li key={`${err.row}-${err.message}`}>
                            {t('spreadsheet.previewRow', { row: err.row, message: err.message })}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-hub-text-muted">{t('spreadsheet.selectTable')}</p>
              )}
            </ConnectCard>

            <ConnectCard className="p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-hub-navy">
                <History className="h-4 w-4" />
                {t('spreadsheet.historyTitle')}
              </h3>
              {logs.length === 0 ? (
                <p className="text-sm text-hub-text-muted">{t('spreadsheet.noHistory')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead className="text-left text-hub-text-muted">
                      <tr>
                        <th className="py-2">{t('spreadsheet.historyDate')}</th>
                        <th className="py-2">{t('spreadsheet.historySheet')}</th>
                        <th className="py-2">{t('spreadsheet.historyUser')}</th>
                        <th className="py-2">{t('spreadsheet.historyResult')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id} className="border-t border-hub-border/40">
                          <td className="py-2 text-xs">
                            {log.created_at ? new Date(log.created_at).toLocaleString(locale) : '—'}
                          </td>
                          <td className="py-2">
                            {log.spreadsheet_key}
                            {log.filename && (
                              <span className="block text-xs text-hub-text-muted">{log.filename}</span>
                            )}
                          </td>
                          <td className="py-2">{log.user_name ?? '—'}</td>
                          <td className="py-2">
                            +{log.created_count} / ~{log.updated_count}
                            {log.errors_count > 0 && (
                              <span className="text-red-600">
                                {' '}
                                · {t('spreadsheet.historyErrors', { count: log.errors_count })}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ConnectCard>
          </div>
        </div>
      )}
    </div>
  )
}
