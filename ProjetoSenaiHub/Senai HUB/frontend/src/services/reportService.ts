import api from './api'
import type { BuiltReport, ConnectFilterOptions, GridFilterOptions, ReportBuildConfig, ReportModule, ReportSchema } from '../types/reports'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('senai_hub_token')
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
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
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fallbackName
  anchor.click()
  URL.revokeObjectURL(url)
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

  async exportHtml(module: ReportModule, config: ReportBuildConfig) {
    const base = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL
    const response = await fetch(`${base}/reports/${module}/export-html`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(config),
    })

    if (!response.ok) {
      throw new Error(await parseError(response))
    }

    const html = await response.text()
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      throw new Error('Permita pop-ups para abrir o relatorio em PDF.')
    }
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
  },
}
