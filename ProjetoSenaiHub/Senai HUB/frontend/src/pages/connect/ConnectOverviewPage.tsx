import { useEffect, useState } from 'react'
import {
  BookOpen,
  CalendarCheck,
  FileText,
  GraduationCap,
  School,
  Users,
} from 'lucide-react'
import { QuickReportsSection } from '../../components/connect/ConnectCharts'
import {
  ConnectCard,
  ConnectLoadingSpinner,
  ConnectPageHeader,
  ConnectTableScroll,
  EMPTY,
  formatDateTime,
  KpiCard,
  StatusBadge,
} from '../../components/connect/ConnectShared'
import { connectService } from '../../services/connectService'
import type { DashboardData } from '../../types/connect'

function KpiSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-hub-border/60 bg-white p-5 shadow-sm">
      <div className="mb-3 h-10 w-10 rounded-xl bg-hub-bg" />
      <div className="mb-2 h-3 w-3/4 max-w-[140px] rounded bg-hub-bg" />
      <div className="h-8 w-20 rounded bg-hub-bg" />
    </div>
  )
}

export function ConnectOverviewPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [tab, setTab] = useState<'cadastros' | 'alertas'>('cadastros')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    connectService
      .getDashboard()
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  const trends = data?.kpi_trends ?? {
    students: { direction: 'neutral' as const, value: '0', label: 'novos este mes' },
    teachers: { direction: 'neutral' as const, value: '0', label: 'vs. mes anterior' },
    classes: { direction: 'neutral' as const, value: '0', label: 'novas turmas' },
    courses: { direction: 'neutral' as const, value: '0', label: 'vs. mes anterior' },
    attendance: { direction: 'neutral' as const, value: '0', label: 'vs. mes anterior' },
    contracts: { direction: 'neutral' as const, value: '0', label: 'novos contratos' },
  }

  const attendance = data?.attendance_breakdown ?? { present: 0, justified: 0, unjustified: 0, rate: 0 }
  const teachers = data?.classes_by_teacher ?? []
  const courses = data?.students_by_course ?? []
  const kpis = data?.kpis

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Visão Geral"
        subtitle="Acompanhe indicadores e atividades recentes do SENAI Connect."
      />

      <div className="mb-6 grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading || !kpis ? (
          Array.from({ length: 6 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              icon={GraduationCap}
              label="Total de alunos cadastrados"
              value={kpis.total_students.toLocaleString('pt-BR')}
              trend={trends.students}
            />
            <KpiCard icon={Users} label="Professores cadastrados" value={kpis.total_teachers} trend={trends.teachers} />
            <KpiCard icon={School} label="Turmas ativas" value={kpis.active_classes} trend={trends.classes} />
            <KpiCard icon={BookOpen} label="Cursos ativos" value={kpis.active_courses} trend={trends.courses} />
            <KpiCard
              icon={CalendarCheck}
              label="Frequencia media do mes"
              value={`${kpis.attendance_rate}%`}
              trend={trends.attendance}
            />
            <KpiCard icon={FileText} label="Contratos ativos" value={kpis.active_contracts} trend={trends.contracts} />
          </>
        )}
      </div>

      <div className="mb-6 grid w-full min-w-0 grid-cols-1 gap-6 lg:grid-cols-3">
        <QuickReportsSection loading={loading} attendance={attendance} teachers={teachers} courses={courses} />

        <ConnectCard className="min-w-0 p-4 sm:p-6 lg:col-span-1">
          <h2 className="mb-4 text-lg font-semibold text-hub-navy sm:text-xl">Atividade Recente</h2>
          {loading ? (
            <ul className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="animate-pulse border-b border-hub-border/50 pb-3">
                  <div className="mb-2 h-4 w-3/4 rounded bg-hub-bg" />
                  <div className="h-3 w-full rounded bg-hub-bg" />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="max-h-[480px] space-y-4 overflow-y-auto pr-1">
              {data?.recent_activities.map((activity) => (
                <li key={activity.id} className="border-b border-hub-border/50 pb-3 last:border-0">
                  <p className="text-sm font-medium text-hub-text">{activity.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-hub-text-muted">{activity.description}</p>
                  <p className="mt-1 text-xs text-hub-text-muted">
                    {formatDateTime(activity.occurred_at)} · {activity.performed_by}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </ConnectCard>
      </div>

      <ConnectCard className="min-w-0 overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-hub-border/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-hub-navy sm:text-lg">Cadastros Recentes / Alertas</h2>
              {!loading && data && (
              <span className="rounded-full bg-hub-red px-2 py-0.5 text-xs font-semibold text-white">
                {data.alerts.length + data.cadastros.length}
              </span>
              )}
            </div>
            <div className="flex gap-4 text-sm">
              <button
                type="button"
                onClick={() => setTab('cadastros')}
                className={
                  tab === 'cadastros'
                    ? 'border-b-2 border-hub-red pb-1 font-semibold text-hub-red'
                    : 'pb-1 text-hub-text-muted'
                }
              >
                Cadastros recentes
              </button>
              <button
                type="button"
                onClick={() => setTab('alertas')}
                className={
                  tab === 'alertas'
                    ? 'border-b-2 border-hub-red pb-1 font-semibold text-hub-red'
                    : 'pb-1 text-hub-text-muted'
                }
              >
                Alertas
              </button>
            </div>
          </div>
          {loading ? (
            <ConnectLoadingSpinner label="Carregando cadastros e alertas..." className="min-h-[280px]" />
          ) : data ? (
          <ConnectTableScroll>
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-hub-bg/60 text-hub-text-muted">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 font-medium sm:px-6">Tipo</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium sm:px-6">Nome</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium sm:px-6">Detalhes</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium sm:px-6">Data & Hora</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium sm:px-6">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {tab === 'cadastros'
                  ? data.cadastros.map((student) => (
                      <tr key={student.id} className="border-t border-hub-border/40">
                        <td className="whitespace-nowrap px-4 py-3 sm:px-6">Aluno</td>
                        <td className="px-4 py-3 font-medium sm:px-6">{student.full_name}</td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-hub-text-muted sm:max-w-none sm:px-6">
                          {student.class?.name ?? student.class?.course?.name ?? EMPTY}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 sm:px-6">{formatDateTime(student.created_at)}</td>
                        <td className="whitespace-nowrap px-4 py-3 sm:px-6">Sistema</td>
                      </tr>
                    ))
                  : data.alerts.map((alert) => (
                      <tr key={alert.id} className="border-t border-hub-border/40">
                        <td className="whitespace-nowrap px-4 py-3 capitalize sm:px-6">{alert.type}</td>
                        <td className="px-4 py-3 font-medium sm:px-6">{alert.title}</td>
                        <td className="max-w-[240px] px-4 py-3 text-hub-text-muted sm:px-6">{alert.message}</td>
                        <td className="whitespace-nowrap px-4 py-3 sm:px-6">{formatDateTime(alert.created_at)}</td>
                        <td className="px-4 py-3 sm:px-6">
                          <StatusBadge status="active" />
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </ConnectTableScroll>
          ) : null}
        </ConnectCard>
    </div>
  )
}
