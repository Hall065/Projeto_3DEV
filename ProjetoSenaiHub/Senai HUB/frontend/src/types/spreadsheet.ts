export interface SpreadsheetColumn {
  key: string
  header: string
  required: boolean
  example: string
}

export interface SpreadsheetTemplate {
  key: string
  label: string
  description: string
  importable: boolean
  exportable: boolean
  columns: SpreadsheetColumn[]
}

export interface SpreadsheetImportResult {
  created: number
  updated: number
  errors: Array<{ row: number; message: string }>
}

export interface SpreadsheetImportPreview {
  total_rows: number
  created: number
  updated: number
  errors: Array<{ row: number; message: string }>
  preview: Array<Record<string, string>>
}

export interface SpreadsheetImportLog {
  id: number
  spreadsheet_key: string
  filename: string | null
  rows_total: number
  created_count: number
  updated_count: number
  errors_count: number
  status: string
  user_name?: string
  created_at?: string
}
