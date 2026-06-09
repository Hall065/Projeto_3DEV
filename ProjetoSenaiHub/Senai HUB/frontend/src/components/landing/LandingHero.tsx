import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { GraduationCap, LayoutGrid, Shield } from 'lucide-react'
import loginBackground from '../../assets/auth/login-background.png'

export function LandingHero() {
  const { t } = useTranslation()
  const [showHighlights, setShowHighlights] = useState(false)

  const highlights = [
    { icon: GraduationCap, label: t('landing.highlightLearn') },
    { icon: LayoutGrid, label: t('landing.highlightAllInOne') },
    { icon: Shield, label: t('landing.highlightSafe') },
  ]

  useEffect(() => {
    const onScroll = () => {
      setShowHighlights(window.scrollY > 64)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <section className="relative flex min-h-[calc(100dvh-4.75rem)] flex-col sm:min-h-[calc(100dvh-5.25rem)]">
        <img
          src={loginBackground}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[center_30%] opacity-30 sm:object-[72%_center] lg:object-[88%_center]"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/60 via-white/30 to-transparent sm:from-white/50 lg:from-white/55 lg:via-white/25 xl:from-white/50"
          aria-hidden
        />

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-10 sm:px-6 sm:py-12 lg:max-w-[90rem] lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:gap-12 lg:px-10 lg:py-16 xl:gap-16 xl:px-12 2xl:px-16">
          <div className="glass-panel-solid mx-auto w-full max-w-xl rounded-3xl p-8 sm:max-w-2xl sm:p-10 lg:mx-0 lg:max-w-2xl lg:justify-self-start lg:self-center lg:p-12 xl:max-w-3xl xl:p-14 2xl:max-w-[44rem]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-hub-red sm:text-sm">
              {t('landing.platformTag')}
            </p>
            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-hub-navy sm:text-4xl sm:leading-[1.12] lg:mt-5 lg:text-[2.65rem] xl:text-5xl xl:leading-[1.1] 2xl:text-[3.25rem]">
              {t('landing.heroTitle')}{' '}
              <span className="text-hub-red">{t('landing.heroHighlight')}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-hub-text-muted sm:text-lg lg:mt-8 lg:text-xl lg:leading-relaxed xl:mt-9">
              {t('landing.heroBody')}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4 lg:mt-10 xl:mt-12">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-xl bg-hub-red px-7 py-3.5 text-sm font-semibold text-white shadow-md shadow-hub-red/20 transition-colors hover:bg-hub-red-hover lg:px-8 lg:py-4 lg:text-base"
              >
                {t('landing.ctaLogin')}
              </Link>
              <a
                href="#recursos"
                className="glass-input inline-flex items-center justify-center rounded-xl border-hub-navy/20 px-7 py-3.5 text-sm font-semibold text-hub-navy transition-colors hover:bg-white/70 lg:px-8 lg:py-4 lg:text-base"
              >
                {t('landing.exploreFeatures')}
              </a>
            </div>
          </div>
        </div>
      </section>

      <div
        className={`fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 flex-wrap items-center justify-center gap-3 transition-all duration-500 ${
          showHighlights ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
        }`}
      >
        {highlights.map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="glass-panel-solid inline-flex items-center gap-2 rounded-full border border-white/60 px-4 py-2 text-xs font-medium text-hub-navy shadow-sm sm:text-sm"
          >
            <Icon className="h-4 w-4 text-hub-red" />
            {label}
          </span>
        ))}
      </div>
    </>
  )
}
