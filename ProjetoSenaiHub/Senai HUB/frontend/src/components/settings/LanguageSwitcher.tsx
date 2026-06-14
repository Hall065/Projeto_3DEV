import { useEffect, useState } from 'react'
import { Check, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '../connect/ConnectShared'
import { useCrudToast } from '../../hooks/useCrudToast'
import { normalizeLocale, setLocale, supportedLocales, type LocaleCode } from '../../i18n'

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  const crudToast = useCrudToast()
  const activeLocale = normalizeLocale(i18n.language)
  const [draft, setDraft] = useState<LocaleCode>(activeLocale)

  useEffect(() => {
    setDraft(normalizeLocale(i18n.language))
  }, [i18n.language])

  const dirty = draft !== activeLocale

  function handleApply() {
    setLocale(draft)
    crudToast.notifySuccess(t('settings.languageApplied'))
  }

  return (
    <div className="space-y-4">
      <header className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-hub-navy/10 text-hub-navy">
          <Globe className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-hub-navy">{t('settings.languageTitle')}</h2>
          <p className="mt-0.5 text-sm text-hub-text-muted">{t('settings.languageHint')}</p>
        </div>
      </header>

      <div className="grid gap-2 sm:grid-cols-3">
        {supportedLocales.map((locale) => {
          const selected = draft === locale.code
          return (
            <button
              key={locale.code}
              type="button"
              onClick={() => setDraft(locale.code)}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                selected
                  ? 'border-hub-red bg-hub-red/5 ring-2 ring-hub-red/20'
                  : 'border-hub-border/60 hover:border-hub-navy/25 hover:bg-hub-bg/50'
              }`}
            >
              <span className="text-2xl leading-none" aria-hidden>
                {locale.flag}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-hub-navy">{locale.label}</span>
              </span>
              {selected && <Check className="h-4 w-4 shrink-0 text-hub-red" aria-hidden />}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <PrimaryButton type="button" onClick={handleApply} disabled={!dirty}>
          {t('common.apply')}
        </PrimaryButton>
      </div>
    </div>
  )
}
