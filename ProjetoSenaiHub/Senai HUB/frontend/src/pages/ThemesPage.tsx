import { useTranslation } from 'react-i18next'
import { AppearanceSettings } from '../components/settings/AppearanceSettings'

export function ThemesPage() {
  const { t } = useTranslation()

  return (
    <section className="w-full min-w-0">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-hub-navy">{t('themesPage.title')}</h1>
        <p className="mt-2 text-hub-text-muted">{t('themesPage.subtitle')}</p>
      </header>

      <div className="mx-auto max-w-5xl">
        <AppearanceSettings />
      </div>
    </section>
  )
}
