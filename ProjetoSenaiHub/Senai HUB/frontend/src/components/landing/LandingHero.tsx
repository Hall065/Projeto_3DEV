import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, LayoutGrid, Shield } from 'lucide-react'
import loginBackground from '../../assets/auth/login-background.png'

const highlights = [
  { icon: GraduationCap, label: 'Aprenda no seu ritmo' },
  { icon: LayoutGrid, label: 'Tudo em um só lugar' },
  { icon: Shield, label: 'Ambiente seguro e confiável' },
]

export function LandingHero() {
  const [showHighlights, setShowHighlights] = useState(false)

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
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/55 via-white/25 to-transparent sm:from-white/45 lg:from-white/40"
          aria-hidden
        />

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-10 sm:px-6 sm:py-12 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-10 lg:px-8 lg:py-16">
          <div className="glass-panel-solid mx-auto w-full max-w-xl rounded-3xl p-8 sm:max-w-2xl sm:p-10 lg:mx-0 lg:max-w-xl lg:justify-self-start xl:max-w-2xl">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-hub-navy sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
              Conecte alunos, professores e conteúdos para{' '}
              <span className="text-hub-red">transformar aprendizado em futuro.</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-hub-text-muted sm:text-lg">
              O SENAI Hub é a plataforma que reúne aplicativos e ferramentas para impulsionar a
              educação profissional e tecnológica — com acesso simples, seguro e centralizado.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/cadastro"
                className="inline-flex items-center justify-center rounded-lg bg-hub-red px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-hub-red-hover"
              >
                Criar minha conta
              </Link>
              <a
                href="#recursos"
                className="glass-input inline-flex items-center justify-center rounded-lg border-hub-navy/20 px-6 py-3 text-sm font-semibold text-hub-navy transition-colors hover:bg-white/70"
              >
                Conhecer recursos
              </a>
            </div>
          </div>
        </div>
      </section>

      <div
        className={`overflow-hidden transition-all duration-500 ease-out ${
          showHighlights
            ? 'max-h-40 opacity-100'
            : 'pointer-events-none max-h-0 border-transparent opacity-0'
        }`}
        aria-hidden={!showHighlights}
      >
        <div className="glass-panel w-full border-t border-white/50 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-8 sm:gap-16">
            {highlights.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="glass-panel-solid flex h-10 w-10 items-center justify-center rounded-full text-hub-red shadow-sm">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <span className="text-sm font-medium text-hub-navy">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
