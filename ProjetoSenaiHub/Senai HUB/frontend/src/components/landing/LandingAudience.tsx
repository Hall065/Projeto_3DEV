import { audienceAdmin, audienceStudent, audienceTeacher } from '../../assets/landing'

const audiences = [
  {
    image: audienceStudent,
    title: 'Alunos',
    description:
      'Acesse conteúdos, acompanhe atividades e mantenha-se conectado à sua jornada de aprendizagem em um só lugar.',
  },
  {
    image: audienceTeacher,
    title: 'Professores',
    description:
      'Gerencie turmas, compartilhe materiais e acompanhe o desempenho dos alunos com ferramentas pensadas para você.',
  },
  {
    image: audienceAdmin,
    title: 'Equipe Administrativa',
    description:
      'Administre sistemas, usuários e operações escolares com visibilidade e controle em tempo real.',
  },
]

export function LandingAudience() {
  return (
    <section id="para-quem" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="glass-panel-solid mx-auto max-w-2xl rounded-2xl px-6 py-8 text-center sm:px-10">
          <h2 className="text-2xl font-bold text-hub-navy sm:text-3xl">Para quem é o SENAI Hub?</h2>
          <p className="mt-4 text-base text-hub-text-muted">
            Uma solução pensada para toda a comunidade escolar — do aluno ao gestor.
          </p>
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
                  Saiba mais →
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
