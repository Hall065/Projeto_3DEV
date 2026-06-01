export type ReportModule = 'connect' | 'grid'

export interface ReportFilterOption {
  value: string
  label: string
}

export interface ReportFilterDef {
  key: string
  label: string
  type: 'select' | 'course' | 'class' | 'text'
  options?: ReportFilterOption[]
}

export interface ReportColumnDef {
  key: string
  label: string
  default?: boolean
}

export interface ReportSectionDef {
  id: string
  label: string
  description: string
  type: string
  default_enabled: boolean
  has_columns: boolean
  columns?: ReportColumnDef[]
}

export interface ReportPreset {
  id: string
  label: string
  sections: string[]
}

export interface ReportSchema {
  module: ReportModule
  module_label: string
  default_title: string
  filters: ReportFilterDef[]
  sections: ReportSectionDef[]
  presets: ReportPreset[]
}

export interface ReportBuildConfig {
  title: string
  subtitle: string
  from_date: string
  to_date: string
  filters: Record<string, string | number>
  sections: string[]
  columns: Record<string, string[]>
}

export interface ReportMeta {
  module: ReportModule
  module_label: string
  title: string
  subtitle: string
  from_date?: string | null
  to_date?: string | null
  filters: Array<{ label: string; value: string }>
  generated_at: string
  sections_count: number
}

export interface ReportKpiItem {
  label: string
  value: string
  variant: string
}

export interface ReportChartItem {
  label: string
  value: number
  color?: string
}

export interface ReportTableColumn {
  key: string
  label: string
}

export interface ReportSection {
  id: string
  type: 'cover' | 'summary' | 'kpis' | 'chart' | 'table' | 'layout'
  title?: string
  paragraphs?: string[]
  items?: ReportKpiItem[] | ReportChartItem[]
  chart_kind?: 'donut' | 'bar' | 'bar_horizontal'
  columns?: ReportTableColumn[]
  rows?: Array<Record<string, string>>
  total_rows?: number
}

export interface BuiltReport {
  meta: ReportMeta
  sections: ReportSection[]
}

export interface ConnectFilterOptions {
  courses: Array<{ id: number; code: string; name: string }>
  classes: Array<{ id: number; code: string; name: string; connect_course_id?: number }>
}

export interface GridFilterOptions {
  blocks: string[]
}
