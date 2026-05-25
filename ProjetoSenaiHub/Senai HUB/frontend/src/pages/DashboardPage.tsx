import { Header } from '../components/layout/Header'
import { HealthStatusBadge } from '../components/layout/HealthStatusBadge'
import { Card } from '../components/ui/Card'
import { SchoolMapPlaceholder } from '../components/map/SchoolMapPlaceholder'
import { useHealthCheck } from '../hooks/useHealthCheck'

export function DashboardPage() {
  const { data, loading, error } = useHealthCheck()

  return (
    <>
      <Header title="Dashboard" subtitle="Visao geral do SENAI HUB" />

      <section className="flex-1 overflow-y-auto p-8">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-slate-600">Status da integracao com o backend Laravel</p>
          <HealthStatusBadge loading={loading} error={error} status={data?.status} />
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <Card title="Usuarios" description="Total mockado">
            <p className="text-3xl font-bold text-slate-900">128</p>
          </Card>
          <Card title="Salas" description="Cadastradas">
            <p className="text-3xl font-bold text-slate-900">42</p>
          </Card>
          <Card title="Alertas" description="Em tempo real">
            <p className="text-3xl font-bold text-slate-900">3</p>
          </Card>
        </div>

        <SchoolMapPlaceholder />
      </section>
    </>
  )
}
