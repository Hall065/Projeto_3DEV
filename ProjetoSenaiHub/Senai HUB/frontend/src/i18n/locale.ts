export type LocaleCode = 'pt' | 'en' | 'es'

export function normalizeLocale(lng: string | undefined): LocaleCode {
  if (!lng) return 'pt'
  if (lng.startsWith('pt')) return 'pt'
  if (lng.startsWith('en')) return 'en'
  if (lng.startsWith('es')) return 'es'
  return 'pt'
}

export function intlLocale(code: LocaleCode): string {
  return code === 'pt' ? 'pt-BR' : code
}
