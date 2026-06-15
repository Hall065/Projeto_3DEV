import { BarChart3, Headphones, LayoutGrid, Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function LandingFeatures() {
  const { t } = useTranslation()

  const features = [
    {
      icon: LayoutGrid,
      title: t('landing.features.hubTitle'),
      description: t('landing.features.hubDesc'),
    },
    {
      icon: Headphones,
      title: t('landing.features.supportTitle'),
      description: t('landing.features.supportDesc'),
    },
    {
      icon: Shield,
      title: t('landing.features.securityTitle'),
      description: t('landing.features.securityDesc'),
    },
    {
      icon: BarChart3,
      title: t('landing.features.managementTitle'),
      description: t('landing.features.managementDesc'),
    },
  ]

  return (
    <section id="recursos" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="glass-panel-solid mx-auto max-w-2xl rounded-2xl px-6 py-8 text-center sm:px-10">
          <h2 className="text-2xl font-bold text-hub-navy sm:text-3xl">{t('landing.features.title')}</h2>
          <p className="mt-4 text-base text-hub-text-muted">{t('landing.features.subtitle')}</p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="glass-panel rounded-2xl p-6 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-hub-red/10 text-hub-red">
                <Icon className="h-7 w-7" strokeWidth={1.75} />
              </span>
              <h3 className="mt-5 text-base font-bold text-hub-navy">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-hub-text-muted">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
