import api from './api'
import type {
  SpreadsheetImportLog,
  SpreadsheetImportPreview,
  SpreadsheetImportResult,
  SpreadsheetTemplate,
} from '../types/spreadsheet'

import i18n from '../i18n'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('senai_hub_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function filenameFromResponse(response: Response, fallback: string): string {
  const disposition = response.headers.get('Content-Disposition')
  const match = disposition?.match(/filename="?([^";]+)"?/)
  return match?.[1] ?? fallback
}

async function downloadAuthenticated(path: string, fallbackName: string) {
  const base = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL
  const response = await fetch(`${base}${path}`, { headers: authHeaders() })

  if (!response.ok) {
    let message = i18n.t('spreadsheet.downloadError')
    try {
      const body = await response.json()
      const errors = body.errors as Record<string, string[]> | undefined
      message = errors ? (Object.values(errors).flat()[0] ?? body.message) : (body.message ?? message)
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }

  const blob = await response.blob()
  triggerBlobDownload(blob, filenameFromResponse(response, fallbackName))
}

export const spreadsheetService = {
  async listTemplates(module: 'connect' | 'grid'): Promise<SpreadsheetTemplate[]> {
    const { data } = await api.get<{ data: SpreadsheetTemplate[] }>(`/spreadsheets/${module}`)
    return data.data
  },

  downloadTemplate(module: 'connect' | 'grid', key: string) {
    return downloadAuthenticated(`/spreadsheets/${module}/${key}/template`, `${module}_${key}_modelo.csv`)
  },

  exportData(module: 'connect' | 'grid', key: string, params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : ''
    return downloadAuthenticated(
      `/spreadsheets/${module}/${key}/export${query}`,
      `${module}_${key}_export.csv`,
    )
  },

  async previewFile(module: 'connect' | 'grid', key: string, file: File): Promise<SpreadsheetImportPreview> {
    const form = new FormData()
    form.append('file', file)

    const { data } = await api.post<{ data: SpreadsheetImportPreview }>(
      `/spreadsheets/${module}/${key}/preview`,
      form,
    )

    return data.data
  },

  async getImportLogs(module: 'connect' | 'grid'): Promise<SpreadsheetImportLog[]> {
    const { data } = await api.get<{ data: SpreadsheetImportLog[] }>(`/spreadsheets/${module}/import-logs`)
    return data.data
  },

  async importFile(module: 'connect' | 'grid', key: string, file: File): Promise<SpreadsheetImportResult> {
    const form = new FormData()
    form.append('file', file)

    const { data } = await api.post<{ data: SpreadsheetImportResult; message: string }>(
      `/spreadsheets/${module}/${key}/import`,
      form,
    )

    return data.data
  },
}
