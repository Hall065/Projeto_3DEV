import { BarChart3, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../../services/api'
import { CustomReportBuilder } from '../../components/reports/CustomReportBuilder'
import {
  ConnectCard,
  ConnectLoadingSpinner,
  ConnectPageHeader,
  OutlineButton,
  PrimaryButton,
} from '../../components/connect/ConnectShared'

type ConnectSummary = {
  summary: string
  students_by_status: Record<string, number>
  attendance_by_status: Record<string, number>
  active_contracts: number
  active_classes: number
  attendance_rate?: number
  generated_at: string
}

function ConnectReportsSummary() {
  const [data, setData] = useState<ConnectSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<{ data: ConnectSummary }>('/connect/reports/summary')
      .then((res) => setData(res.data.data))
      .catch(() => setError('Nao foi possivel carregar o resumo.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <ConnectCard>
        <ConnectLoadingSpinner label="Carregando resumo..." />
      </ConnectCard>
    )
  }

  if (error || !data) {
    return (
      <ConnectCard className="p-6">
        <p className="text-sm text-red-700">{error ?? 'Dados indisponiveis.'}</p>
      </ConnectCard>
    )
  }

  return (
    <div className="space-y-4">
      <ConnectCard className="p-6">
        <p className="text-sm text-hub-text-muted">{data.summary}</p>
        <p className="mt-2 text-xs text-hub-text-muted">
          Atualizado em {new Date(data.generated_at).toLocaleString('pt-BR')}
        </p>
      </ConnectCard>

      <div className="grid gap-4 md:grid-cols-2">
        <ConnectCard className="p-4">
          <h3 className="mb-3 font-semibold text-hub-navy">Alunos por status</h3>
          <ul className="space-y-1 text-sm">
            {Object.entries(data.students_by_status).map(([status, total]) => (
              <li key={status} className="flex justify-between">
                <span className="capitalize">{status}</span>
                <strong>{total}</strong>
              </li>
            ))}
          </ul>
        </ConnectCard>

        <ConnectCard className="p-4">
          <h3 className="mb-3 font-semibold text-hub-navy">Frequencia (marcacoes)</h3>
          <ul className="space-y-1 text-sm">
            {Object.entries(data.attendance_by_status).map(([status, total]) => (
              <li key={status} className="flex justify-between">
                <span className="capitalize">{status}</span>
                <strong>{total}</strong>
              </li>
            ))}
          </ul>
        </ConnectCard>

        <ConnectCard className="p-4">
          <h3 className="mb-3 font-semibold text-hub-navy">Contratos ativos</h3>
          <p className="text-3xl font-bold text-hub-navy">{data.active_contracts}</p>
        </ConnectCard>

        <ConnectCard className="p-4">
          <h3 className="mb-3 font-semibold text-hub-navy">Turmas ativas</h3>
          <p className="text-3xl font-bold text-hub-navy">{data.active_classes}</p>
        </ConnectCard>

        {data.attendance_rate != null && (
          <ConnectCard className="p-4 md:col-span-2">
            <h3 className="mb-3 font-semibold text-hub-navy">Taxa de presenca (marcacoes)</h3>
            <p className="text-3xl font-bold text-hub-navy">{data.attendance_rate}%</p>
          </ConnectCard>
        )}
      </div>
    </div>
  )
}

export function ConnectReportsPage() {
  const [tab, setTab] = useState<'summary' | 'builder'>('builder')

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Relatorios"
        subtitle="Resumo consolidado ou construtor personalizado com secoes, colunas e filtros."
        actions={
          <div className="flex flex-wrap gap-2">
            <OutlineButton type="button" onClick={() => setTab('summary')}>
              <BarChart3 className="h-4 w-4" /> Resumo
            </OutlineButton>
            <PrimaryButton type="button" onClick={() => setTab('builder')}>
              <FileText className="h-4 w-4" /> Construtor
            </PrimaryButton>
          </div>
        }
      />

      {tab === 'summary' ? <ConnectReportsSummary /> : <CustomReportBuilder module="connect" embedded />}
    </div>
  )
}
