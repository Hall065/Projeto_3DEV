import i18n from '../i18n'
import type { ConnectCourse } from '../types/connect'

/** Imagens públicas (Unsplash) por área técnica SENAI */
const THEME_IMAGES = {
  automation: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=900&q=85&auto=format&fit=crop',
  electrical: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=900&q=85&auto=format&fit=crop',
  mechanicsCnc: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=900&q=85&auto=format&fit=crop',
  it: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=900&q=85&auto=format&fit=crop',
  logistics: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=900&q=85&auto=format&fit=crop',
  jewelry: 'https://images.unsplash.com/photo-1611591436355-9487e73f79e2?w=900&q=85&auto=format&fit=crop',
  welding: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=900&q=85&auto=format&fit=crop',
  chemistry: 'https://images.unsplash.com/photo-1532187863486-abf9db381cad?w=900&q=85&auto=format&fit=crop',
  default: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=900&q=85&auto=format&fit=crop',
} as const

const CODE_MAP: Record<string, keyof typeof THEME_IMAGES> = {
  AUT: 'automation',
  ELE: 'electrical',
  MEC: 'mechanicsCnc',
  INF: 'it',
  LOG: 'logistics',
  JOA: 'jewelry',
  SOL: 'welding',
  QUI: 'chemistry',
}

function matchKeyword(text: string, keywords: string[]): boolean {
  const normalized = text.toLowerCase()
  return keywords.some((k) => normalized.includes(k))
}

export function getCourseCoverImage(course: ConnectCourse): string {
  const code = (course.code ?? '').toUpperCase().slice(0, 3)
  const mapped = CODE_MAP[code]
  if (mapped) return THEME_IMAGES[mapped]

  const blob = `${course.name} ${course.area ?? ''} ${course.description ?? ''}`.toLowerCase()

  if (matchKeyword(blob, ['joalh', 'jewel', 'ourives'])) return THEME_IMAGES.jewelry
  if (matchKeyword(blob, ['eletrot', 'elétric', 'eletric', 'instalações elétr'])) return THEME_IMAGES.electrical
  if (matchKeyword(blob, ['automação', 'automacao', 'clp', 'indústria 4', 'industria 4'])) return THEME_IMAGES.automation
  if (matchKeyword(blob, ['mecân', 'mecan', 'usinagem', 'cnc', 'solda'])) {
    return matchKeyword(blob, ['solda']) ? THEME_IMAGES.welding : THEME_IMAGES.mechanicsCnc
  }
  if (matchKeyword(blob, ['informática', 'informatica', 'ti', 'redes', 'software', 'dados'])) return THEME_IMAGES.it
  if (matchKeyword(blob, ['logíst', 'logist', 'estoque', 'transporte', 'supply'])) return THEME_IMAGES.logistics
  if (matchKeyword(blob, ['químic', 'quimic'])) return THEME_IMAGES.chemistry

  return THEME_IMAGES.default
}

export function courseStatusLabel(status: string): string {
  const s = status.toLowerCase()
  if (s === 'active' || s.includes('ativ')) return i18n.t('courseThemes.active')
  if (s.includes('inactiv') || s.includes('inativ')) return i18n.t('courseThemes.inactive')
  return status
}
