import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Lightbulb, Loader2 } from 'lucide-react'
import { ApplicationCard } from '../components/hub/ApplicationCard'
import { PendingAccessPanel } from '../components/hub/PendingAccessPanel'
import { useAuth } from '../contexts/AuthContext'
import { fetchApplications } from '../services/applicationService'
import { parseApiError } from '../utils/parseApiError'
import type { HubApplication } from '../types/application'

export function ApplicationHubPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [applications, setApplications] = useState<HubApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isUnassigned = user?.role === 'unassigned' || (user?.application_slugs?.length ?? 0) === 0

  useEffect(() => {
    fetchApplications()
      .then(setApplications)
      .catch((err) => setError(parseApiError(err, t('hub.loadAppsError'))))
      .finally(() => setLoading(false))
  }, [t])

  return (
    <section className="w-full min-w-0">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-hub-navy">{t('hub.appsTitle')}</h1>
        <p className="mt-2 text-hub-text-muted">{t('hub.appsSubtitle')}</p>
      </header>

      {loading && (
        <div className="flex items-center justify-center py-20 text-hub-text-muted">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          {t('common.loading')}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {!loading && !error && applications.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {applications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      )}

      {!loading && !error && applications.length === 0 && isUnassigned && <PendingAccessPanel />}

      {!loading && !error && applications.length === 0 && !isUnassigned && (
        <p className="glass-panel rounded-xl border border-hub-border px-4 py-8 text-center text-sm text-hub-text-muted">
          {t('hub.noAppsForProfile')}
        </p>
      )}

      <footer className="mx-auto mt-10 flex max-w-3xl items-start gap-2 text-center text-xs leading-relaxed text-hub-text-muted sm:text-left">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-hub-text-muted" />
        <p>{t('hub.appsTip')}</p>
      </footer>
    </section>
  )
}
