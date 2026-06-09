import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { HubPreviewMockup } from './HubPreviewMockup'

const benefits = [
  'Acesso fácil e centralizado',
  'Navegação intuitiva',
  'Mais produtividade',
  'Segurança e confiabilidade',
]

export function LandingPlatform() {
  return (
    <section id="solucoes" className="py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10 xl:max-w-7xl xl:px-12">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 xl:gap-24">
          <div className="mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none">
            <HubPreviewMockup />
          </div>

          <div className="glass-panel-solid mx-auto w-full max-w-md rounded-3xl p-8 lg:mx-0 lg:max-w-lg lg:pl-8 xl:pl-10">
            <h2 className="text-2xl font-bold leading-snug text-hub-navy sm:text-[1.75rem] lg:text-3xl">
              Uma plataforma completa para o seu dia a dia.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-hub-text-muted sm:text-base">
              O Hub concentra os sistemas que você já usa no dia a dia em um único ponto de acesso.
              Menos senhas, menos cliques e mais tempo para o que importa: ensinar e aprender.
            </p>
            <ul className="mt-7 space-y-3.5">
              {benefits.map((item) => (
                <li key={item} className="flex items-center gap-3 text-[15px] text-hub-text sm:text-base">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-hub-red text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/login"
              className="mt-8 inline-flex items-center justify-center rounded-lg bg-hub-red px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-hub-red-hover"
            >
              Explorar o Hub
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
