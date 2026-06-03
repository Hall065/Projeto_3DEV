import { useEffect, useState } from 'react'
import { Lightbulb, Loader2 } from 'lucide-react'
import { ApplicationCard } from '../components/hub/ApplicationCard'
import { fetchApplications } from '../services/applicationService'
import type { HubApplication } from '../types/application'

export function ApplicationHubPage() {
  const [applications, setApplications] = useState<HubApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchApplications()
      .then(setApplications)
      .catch(() => setError('Nao foi possivel carregar os aplicativos.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="w-full min-w-0">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-hub-navy">Hub de Aplicacoes</h1>
        <p className="mt-2 text-hub-text-muted">Acesse os sistemas disponiveis para o seu perfil.</p>
      </header>

      {loading && (
        <div className="flex items-center justify-center py-20 text-hub-text-muted">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Carregando aplicativos...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {!loading && !error && (
        <div className="grid gap-6 lg:grid-cols-2">
          {applications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      )}

      {!loading && !error && applications.length === 0 && (
        <p className="rounded-xl border border-hub-border bg-white px-4 py-8 text-center text-sm text-hub-text-muted">
          Nenhum aplicativo disponivel para o seu perfil.
        </p>
      )}

      <footer className="mx-auto mt-10 flex max-w-3xl items-start gap-2 text-center text-xs leading-relaxed text-hub-text-muted sm:text-left">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-hub-text-muted" />
        <p>
          Dica: os aplicativos que aparecem aqui sao definidos de acordo com o seu perfil de usuario. Se voce acredita
          que deveria ter acesso a outro sistema, entre em contato com o administrador.
        </p>
      </footer>
    </section>
  )
}
