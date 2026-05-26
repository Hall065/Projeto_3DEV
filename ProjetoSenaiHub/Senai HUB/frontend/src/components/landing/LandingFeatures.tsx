import { BarChart3, Headphones, LayoutGrid, Shield } from 'lucide-react'

const features = [
  {
    icon: LayoutGrid,
    title: 'Hub de Aplicações',
    description: 'Todos os sistemas SENAI em um único painel de acesso.',
  },
  {
    icon: Headphones,
    title: 'Suporte Especializado',
    description: 'Equipe dedicada para ajudar você em cada etapa.',
  },
  {
    icon: Shield,
    title: 'Segurança de Dados',
    description: 'Proteção e privacidade em conformidade com as melhores práticas.',
  },
  {
    icon: BarChart3,
    title: 'Gestão Inteligente',
    description: 'Indicadores e relatórios para decisões mais assertivas.',
  },
]

export function LandingFeatures() {
  return (
    <section id="recursos" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="glass-panel-solid mx-auto max-w-2xl rounded-2xl px-6 py-8 text-center sm:px-10">
          <h2 className="text-2xl font-bold text-hub-navy sm:text-3xl">Recursos que fazem a diferença</h2>
          <p className="mt-4 text-base text-hub-text-muted">
            Tecnologia a serviço da educação profissional e tecnológica.
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="glass-panel rounded-2xl p-6 text-center"
            >
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
