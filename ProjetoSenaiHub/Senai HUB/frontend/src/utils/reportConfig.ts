import type { ReportBuildConfig, ReportSchema, ReportSectionDef } from '../types/reports'

export function defaultColumnsForSection(section: ReportSectionDef): string[] {
  return (section.columns ?? []).filter((c) => c.default !== false).map((c) => c.key)
}

export function mergeSystemPreset(schema: ReportSchema, presetSectionIds: string[], base: ReportBuildConfig): ReportBuildConfig {
  const sections = presetSectionIds.includes('cover') ? presetSectionIds : ['cover', ...presetSectionIds]
  const columns = { ...base.columns }

  schema.sections.forEach((section) => {
    if (sections.includes(section.id) && section.has_columns && section.columns) {
      columns[section.id] = defaultColumnsForSection(section)
    }
  })

  return { ...base, sections, columns }
}

export function sanitizeReportConfig(schema: ReportSchema, raw: ReportBuildConfig): ReportBuildConfig {
  const validSectionIds = new Set(schema.sections.map((s) => s.id))
  const sections = raw.sections.filter((id) => validSectionIds.has(id))
  if (!sections.includes('cover')) {
    sections.unshift('cover')
  }

  const columns: Record<string, string[]> = {}
  schema.sections.forEach((section) => {
    if (!sections.includes(section.id) || !section.has_columns || !section.columns) {
      return
    }
    const allowed = new Set(section.columns.map((c) => c.key))
    const picked = (raw.columns[section.id] ?? []).filter((k) => allowed.has(k))
    columns[section.id] = picked.length > 0 ? picked : defaultColumnsForSection(section)
  })

  return {
    title: raw.title || schema.default_title,
    subtitle: raw.subtitle ?? '',
    from_date: raw.from_date,
    to_date: raw.to_date,
    filters: raw.filters ?? {},
    sections,
    columns,
  }
}
