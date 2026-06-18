import i18n from 'i18next'

import { initReactI18next } from 'react-i18next'

import pt from './locales/pt.json'

import en from './locales/en.json'

import es from './locales/es.json'

import ptSupplement from './locales/supplement/pt.json'

import enSupplement from './locales/supplement/en.json'

import esSupplement from './locales/supplement/es.json'

import { notificationTypeLocales } from './notificationTypeLocales'

import { mergeLocales } from './mergeLocales'

import { intlLocale, normalizeLocale, type LocaleCode } from './locale'



const STORAGE_KEY = 'senai_hub_locale'



export const supportedLocales = [

  { code: 'pt', label: 'Português (BR)', flag: '🇧🇷' },

  { code: 'en', label: 'English', flag: '🇺🇸' },

  { code: 'es', label: 'Español', flag: '🇪🇸' },

] as const



export type { LocaleCode }



const saved = localStorage.getItem(STORAGE_KEY)

const initial = normalizeLocale(saved ?? undefined)



const resources = {

  pt: { translation: mergeLocales(mergeLocales(pt, ptSupplement), notificationTypeLocales.pt) },

  en: { translation: mergeLocales(mergeLocales(en, enSupplement), notificationTypeLocales.en) },

  es: { translation: mergeLocales(mergeLocales(es, esSupplement), notificationTypeLocales.es) },

}



void i18n.use(initReactI18next).init({

  resources,

  lng: initial,

  fallbackLng: 'pt',

  supportedLngs: ['pt', 'en', 'es'],

  nonExplicitSupportedLngs: true,

  load: 'languageOnly',

  interpolation: { escapeValue: false },

  react: { useSuspense: false },

})



export function setLocale(code: LocaleCode): void {

  const normalized = normalizeLocale(code)

  localStorage.setItem(STORAGE_KEY, normalized)

  void i18n.changeLanguage(normalized)

  document.documentElement.lang = intlLocale(normalized)

}



document.documentElement.lang = intlLocale(initial)



export { intlLocale, normalizeLocale }

export default i18n


