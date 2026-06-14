import { BarChart3, Download, FileSpreadsheet, FileText, Printer } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../services/api'
import { CustomReportBuilder } from '../../components/reports/CustomReportBuilder'
import { useCrudToast } from '../../hooks/useCrudToast'
import { parseApiError } from '../../utils/parseApiError'
import { downloadCsv, printHtmlDocument } from '../../utils/downloadFile'
import {
  ConnectCard,
  ConnectLoadingSpinner,
  ConnectPageHeader,
  OutlineButton,
  PrimaryButton,
} from '../../components/connect/ConnectShared'

type ConnectSummary = {
  summary: string
  students_by_status: Record<string, number>
  attendance_by_status: Record<string, number>
  active_contracts: number
  active_classes: number
  attendance_rate?: number
  generated_at: string
}

function ConnectReportsSummary() {
  const { t, i18n } = useTranslation()
  const crudToast = useCrudToast()
  const [data, setData] = useState<ConnectSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exportingXlsx, setExportingXlsx] = useState(false)

  useEffect(() => {
    api
      .get<{ data: ConnectSummary }>('/connect/reports/summary')
      .then((res) => setData(res.data.data))
      .catch((err) => setError(parseApiError(err, t('connect.reports.summary.loadError'))))
      .finally(() => setLoading(false))
  }, [t])

  const exportSummary = () => {
    if (!data) return
    const stamp = new Date(data.generated_at).toISOString().slice(0, 10)
    const rows: string[][] = [
      [t('connect.reports.export.field'), t('connect.reports.export.value')],
      [t('connect.reports.export.summary'), data.summary],
      [t('connect.reports.summary.activeContracts'), String(data.active_contracts)],
      [t('connect.reports.summary.activeClasses'), String(data.active_classes)],
    ]
    if (data.attendance_rate != null) {
      rows.push([t('connect.reports.summary.attendanceRate'), String(data.attendance_rate)])
    }
    Object.entries(data.students_by_status).forEach(([status, total]) => {
      rows.push([`${t('connect.personKind.student')} (${status})`, String(total)])
    })
    Object.entries(data.attendance_by_status).forEach(([status, total]) => {
      rows.push([`${t('connect.attendance.title')} (${status})`, String(total)])
    })
    downloadCsv(`connect-resumo-${stamp}.csv`, rows)
  }

  const exportSummaryXlsx = async () => {
    if (!data) return
    setExportingXlsx(true)
    try {
      const stamp = new Date(data.generated_at).toISOString().slice(0, 10)
      const response = await api.get('/connect/reports/summary/xlsx', { responseType: 'blob' })
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `connect-resumo-${stamp}.xlsx`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      crudToast.notifyError(err, t('connect.reports.summary.exportXlsxError'))
    } finally {
      setExportingXlsx(false)
    }
  }

  const exportSummaryPdf = () => {
    if (!data) return
    const stamp = new Date(data.generated_at).toLocaleString(i18n.language)
    const rows = [
      ...Object.entries(data.students_by_status).map(([status, total]) => `<tr><td>${t('connect.personKind.student')} (${status})</td><td>${total}</td></tr>`),
      ...Object.entries(data.attendance_by_status).map(([status, total]) => `<tr><td>${t('connect.attendance.title')} (${status})</td><td>${total}</td></tr>`),
      `<tr><td>${t('connect.reports.summary.activeContracts')}</td><td>${data.active_contracts}</td></tr>`,
      `<tr><td>${t('connect.reports.summary.activeClasses')}</td><td>${data.active_classes}</td></tr>`,
      data.attendance_rate != null ? `<tr><td>${t('connect.reports.summary.attendanceRate')}</td><td>${data.attendance_rate}</td></tr>` : '',
    ].join('')
    printHtmlDocument(
      t('connect.reports.pdf.title'),
      `<h1>${t('connect.reports.pdf.title')}</h1><p class="muted">${data.summary}</p><p class="muted">${t('connect.reports.export.generatedAt', { date: stamp })}</p><table><thead><tr><th>${t('connect.reports.export.indicator')}</th><th>${t('connect.reports.export.value')}</th></tr></thead><tbody>${rows}</tbody></table>`,
    )
  }

  if (loading) {
    return (
      <ConnectCard>
        <ConnectLoadingSpinner label={t('connect.reports.summary.loading')} />
      </ConnectCard>
    )
  }

  if (error || !data) {
    return (
      <ConnectCard className="p-6">
        <p className="text-sm text-red-700">{error ?? t('connect.reports.summary.unavailable')}</p>
      </ConnectCard>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <OutlineButton type="button" onClick={exportSummary}>
          <Download className="h-4 w-4" /> {t('connect.reports.summary.exportCsv')}
        </OutlineButton>
        <OutlineButton type="button" onClick={() => void exportSummaryXlsx()} disabled={exportingXlsx}>
          <FileSpreadsheet className="h-4 w-4" /> {exportingXlsx ? t('connect.common.saving') : t('connect.reports.summary.exportXlsx')}
        </OutlineButton>
        <OutlineButton type="button" onClick={exportSummaryPdf}>
          <Printer className="h-4 w-4" /> {t('connect.reports.summary.exportPdf')}
        </OutlineButton>
      </div>
      <ConnectCard className="p-6">
        <p className="text-sm text-hub-text-muted">{data.summary}</p>
        <p className="mt-2 text-xs text-hub-text-muted">
          {t('connect.common.updatedAt', { date: new Date(data.generated_at).toLocaleString(i18n.language) })}
        </p>
      </ConnectCard>

      <div className="grid gap-4 md:grid-cols-2">
        <ConnectCard className="p-4">
          <h3 className="mb-3 font-semibold text-hub-navy">{t('connect.reports.summary.studentsByStatus')}</h3>
          <ul className="space-y-1 text-sm">
            {Object.entries(data.students_by_status).map(([status, total]) => (
              <li key={status} className="flex justify-between">
                <span className="capitalize">{status}</span>
                <strong>{total}</strong>
              </li>
            ))}
          </ul>
        </ConnectCard>

        <ConnectCard className="p-4">
          <h3 className="mb-3 font-semibold text-hub-navy">{t('connect.reports.summary.attendanceMarks')}</h3>
          <ul className="space-y-1 text-sm">
            {Object.entries(data.attendance_by_status).map(([status, total]) => (
              <li key={status} className="flex justify-between">
                <span className="capitalize">{status}</span>
                <strong>{total}</strong>
              </li>
            ))}
          </ul>
        </ConnectCard>

        <ConnectCard className="p-4">
          <h3 className="mb-3 font-semibold text-hub-navy">{t('connect.reports.summary.activeContracts')}</h3>
          <p className="text-3xl font-bold text-hub-navy">{data.active_contracts}</p>
        </ConnectCard>

        <ConnectCard className="p-4">
          <h3 className="mb-3 font-semibold text-hub-navy">{t('connect.reports.summary.activeClasses')}</h3>
          <p className="text-3xl font-bold text-hub-navy">{data.active_classes}</p>
        </ConnectCard>

        {data.attendance_rate != null && (
          <ConnectCard className="p-4 md:col-span-2">
            <h3 className="mb-3 font-semibold text-hub-navy">{t('connect.reports.summary.attendanceRate')}</h3>
            <p className="text-3xl font-bold text-hub-navy">{data.attendance_rate}%</p>
          </ConnectCard>
        )}
      </div>
    </div>
  )
}

export function ConnectReportsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<'summary' | 'builder'>('builder')

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title={t('connect.reports.title')}
        subtitle={t('connect.reports.subtitle')}
        actions={
          <div className="flex flex-wrap gap-2">
            <OutlineButton type="button" onClick={() => setTab('summary')}>
              <BarChart3 className="h-4 w-4" /> {t('connect.reports.tabs.summary')}
            </OutlineButton>
            <PrimaryButton type="button" onClick={() => setTab('builder')}>
              <FileText className="h-4 w-4" /> {t('connect.reports.tabs.builder')}
            </PrimaryButton>
          </div>
        }
      />

      {tab === 'summary' ? <ConnectReportsSummary /> : <CustomReportBuilder module="connect" embedded />}
    </div>
  )
}
