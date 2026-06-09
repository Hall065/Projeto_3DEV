import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { WALLPAPER_PRESETS } from '../../constants/wallpapers'

const PREVIEW_IDS = ['senai-dawn', 'senai-classic', 'senai-slate', 'senai-dark-navy'] as const

export function LandingThemesPreview() {
  const { t } = useTranslation()
  const presets = WALLPAPER_PRESETS.filter((preset) =>
    PREVIEW_IDS.includes(preset.id as (typeof PREVIEW_IDS)[number]),
  )

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-hub-navy sm:text-3xl">{t('landing.themesTitle')}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-hub-text-muted sm:text-base">{t('landing.themesSubtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {presets.map((preset) => (
          <article
            key={preset.id}
            className="glass-panel-solid overflow-hidden rounded-2xl border border-white/50 shadow-sm"
          >
            <div className="relative h-28">
              <div className="absolute inset-0" style={{ backgroundColor: preset.baseColor }} />
              <div
                className="absolute inset-0"
                style={{ background: preset.mesh.replace(/\s+/g, ' ').trim() }}
              />
            </div>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-hub-navy">{preset.name}</h3>
              <p className="mt-1 text-xs text-hub-text-muted">{preset.description}</p>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-hub-text-muted">
        {t('landing.themesHint')}{' '}
        <Link to="/login" className="font-medium text-hub-red hover:underline">
          {t('landing.themesCta')}
        </Link>
      </p>
    </section>
  )
}
