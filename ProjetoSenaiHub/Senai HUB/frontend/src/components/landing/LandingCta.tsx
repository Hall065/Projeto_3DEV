import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ctaBanner } from '../../assets/landing'

export function LandingCta() {
  const { t } = useTranslation()

  return (
    <section id="beneficios" className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="glass-panel-solid overflow-hidden rounded-3xl p-1.5 shadow-[0_12px_40px_rgba(2,26,58,0.12)]">
          <div
            className="relative min-h-[280px] overflow-hidden rounded-[1.35rem] bg-hub-navy bg-cover bg-right bg-no-repeat sm:min-h-[320px]"
            style={{ backgroundImage: `url(${ctaBanner})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-hub-navy from-45% via-hub-navy/85 to-hub-navy/25 sm:from-40%" />

            <div className="relative z-10 flex max-w-xl flex-col justify-center px-8 py-12 sm:px-12 sm:py-16 lg:py-20">
              <h2 className="text-2xl font-bold leading-tight text-white sm:text-3xl">{t('landing.cta.title')}</h2>
              <p className="mt-4 text-base leading-relaxed text-white/85">{t('landing.cta.body')}</p>
              <Link
                to="/login"
                className="mt-8 inline-flex w-fit items-center justify-center rounded-lg bg-hub-red px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-hub-red-hover"
              >
                {t('landing.cta.accessPlatform')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
