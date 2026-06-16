import api from './api'
import { openHtmlInNewTab } from '../utils/downloadFile'
import type { BuiltReport, ConnectFilterOptions, GridFilterOptions, ReportBuildConfig, ReportModule, ReportSchema } from '../types/reports'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

export type ReportExportFormat = 'csv' | 'xlsx' | 'json' | 'html' | 'html-download'

function authHeaders(contentType = 'application/json'): HeadersInit {
  const token = localStorage.getItem('senai_hub_token')
  const headers: Record<string, string> = { 'Content-Type': contentType }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = await response.json()
    if (body.errors) {
      const first = Object.values(body.errors as Record<string, string[]>)[0]?.[0]
      if (first) return first
    }
    if (body.message) return body.message
  } catch {
    /* ignore */
  }
  return `Erro ${response.status}: nao foi possivel concluir a operacao.`
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

async function downloadPost(path: string, body: ReportBuildConfig, fallbackName: string) {
  const base = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL
  const response = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition')
  const match = disposition?.match(/filename="?([^";]+)"?/)
  const filename = match?.[1] ?? fallbackName
  triggerBlobDownload(blob, filename)
}

export const reportService = {
  async getSchema(module: ReportModule): Promise<ReportSchema> {
    const { data } = await api.get<{ data: ReportSchema }>(`/reports/${module}/schema`)
    return data.data
  },

  async getFilterOptions(module: ReportModule): Promise<ConnectFilterOptions | GridFilterOptions> {
    const { data } = await api.get<{ data: ConnectFilterOptions | GridFilterOptions }>(
      `/reports/${module}/filter-options`,
    )
    return data.data
  },

  async build(module: ReportModule, config: ReportBuildConfig): Promise<BuiltReport> {
    try {
      const { data } = await api.post<{ data: BuiltReport }>(`/reports/${module}/build`, config)
      return data.data
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const response = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response
        const payload = response?.data
        if (payload?.errors) {
          const first = Object.values(payload.errors)[0]?.[0]
          if (first) throw new Error(first)
        }
        if (payload?.message) throw new Error(payload.message)
      }
      throw new Error('Falha ao gerar o relatorio.')
    }
  },

  exportCsv(module: ReportModule, config: ReportBuildConfig) {
    return downloadPost(`/reports/${module}/export-csv`, config, `${module}_relatorio.csv`)
  },

  exportXlsx(module: ReportModule, config: ReportBuildConfig) {
    return downloadPost(`/reports/${module}/export-xlsx`, config, `${module}_relatorio.xlsx`)
  },

  async exportJson(module: ReportModule, config: ReportBuildConfig) {
    const { data } = await api.post<{ data: BuiltReport }>(`/reports/${module}/export-json`, config)
    const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' })
    triggerBlobDownload(blob, `${module}_relatorio_${new Date().toISOString().slice(0, 10)}.json`)
    return data.data
  },

  async exportHtml(module: ReportModule, config: ReportBuildConfig, options?: { download?: boolean; print?: boolean }) {
    const base = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL
    const query = options?.download ? '?download=1' : options?.print ? '?print=1' : ''
    const response = await fetch(`${base}/reports/${module}/export-html${query}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(config),
    })

    if (!response.ok) {
      throw new Error(await parseError(response))
    }

    if (options?.download) {
      const blob = await response.blob()
      triggerBlobDownload(blob, `${module}_relatorio.html`)
      return
    }

    const html = await response.text()
    openHtmlInNewTab(html)
  },

  async export(module: ReportModule, config: ReportBuildConfig, format: ReportExportFormat) {
    switch (format) {
      case 'csv':
        return reportService.exportCsv(module, config)
      case 'xlsx':
        return reportService.exportXlsx(module, config)
      case 'json':
        return reportService.exportJson(module, config)
      case 'html-download':
        return reportService.exportHtml(module, config, { download: true })
      case 'html':
        return reportService.exportHtml(module, config, { print: true })
      default:
        throw new Error('Formato de exportacao invalido.')
    }
  },
}
