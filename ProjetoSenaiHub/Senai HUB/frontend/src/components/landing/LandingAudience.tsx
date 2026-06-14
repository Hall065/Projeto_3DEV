import { useTranslation } from 'react-i18next'
import { audienceAdmin, audienceStudent, audienceTeacher } from '../../assets/landing'

export function LandingAudience() {
  const { t } = useTranslation()

  const audiences = [
    {
      image: audienceStudent,
      title: t('landing.audience.studentsTitle'),
      description: t('landing.audience.studentsDesc'),
    },
    {
      image: audienceTeacher,
      title: t('landing.audience.teachersTitle'),
      description: t('landing.audience.teachersDesc'),
    },
    {
      image: audienceAdmin,
      title: t('landing.audience.adminTitle'),
      description: t('landing.audience.adminDesc'),
    },
  ]

  return (
    <section id="para-quem" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="glass-panel-solid mx-auto max-w-2xl rounded-2xl px-6 py-8 text-center sm:px-10">
          <h2 className="text-2xl font-bold text-hub-navy sm:text-3xl">{t('landing.audience.title')}</h2>
          <p className="mt-4 text-base text-hub-text-muted">{t('landing.audience.subtitle')}</p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {audiences.map((item) => (
            <article
              key={item.title}
              className="glass-panel-solid flex flex-col overflow-hidden rounded-2xl transition-shadow hover:shadow-lg"
            >
              <div className="flex h-64 items-end justify-center bg-white/25 px-3 pt-4 backdrop-blur-sm sm:h-72 lg:h-80">
                <img
                  src={item.image}
                  alt=""
                  className="h-[92%] w-auto max-w-full object-contain object-bottom sm:h-[95%]"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-lg font-bold text-hub-navy">{item.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-hub-text-muted">{item.description}</p>
                <a
                  href="#recursos"
                  className="mt-4 inline-flex items-center text-sm font-semibold text-hub-red transition-colors hover:text-hub-red-hover"
                >
                  {t('landing.audience.learnMore')}
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
