import { Download, Filter, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConnectEntityViewDrawer } from '../../components/connect/ConnectEntityViewDrawer'
import { ConnectRowActionsMenu } from '../../components/connect/ConnectRowActionsMenu'
import { viewRowAction } from '../../components/connect/connectViewActions'
import {
  ConnectCard,
  ConnectPageHeader,
  ConnectLoadingSpinner,
  ConnectPagination,
  ConnectTableScroll,
  EMPTY,
  formatDate,
  OutlineButton,
  selectClass,
} from '../../components/connect/ConnectShared'
import { connectService } from '../../services/connectService'
import type { ConnectAttendanceSession, ConnectClass, PaginatedMeta } from '../../types/connect'

export function AttendanceManagePage() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<ConnectAttendanceSession[]>([])
  const [classes, setClasses] = useState<ConnectClass[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | undefined>()
  const [page, setPage] = useState(1)
  const [classId, setClassId] = useState('')
  const [loading, setLoading] = useState(true)
  const [viewSnapshot, setViewSnapshot] = useState<ConnectAttendanceSession | null>(null)

  const load = () => {
    setLoading(true)
    const params: Record<string, string | number> = { page, per_page: 10 }
    if (classId) params.connect_class_id = classId
    connectService
      .getAttendanceRecords(params)
      .then((res) => {
        setRecords(res.data)
        setMeta(res.meta)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    connectService.getClasses({ per_page: 50 }).then((r) => setClasses(r.data))
  }, [])

  useEffect(() => {
    load()
  }, [page, classId])

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader title="Gerenciar frequencia" subtitle="Registros de frequencia recentes" />

      <ConnectCard>
        <div className="flex w-full min-w-0 flex-col gap-3 border-b border-hub-border/60 p-4 sm:flex-row sm:flex-wrap sm:items-center [&_button]:w-full sm:[&_button]:w-auto">
          <select className={`${selectClass} w-full sm:w-48`} value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">Todas as turmas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <OutlineButton>
            <Download className="h-4 w-4" />
            Exportar
          </OutlineButton>
          <OutlineButton>
            <Filter className="h-4 w-4" />
            Filtros
          </OutlineButton>
        </div>
        {loading ? (
          <ConnectLoadingSpinner label="Carregando registros de frequencia..." className="min-h-[280px]" />
        ) : (
        <>
        <ConnectTableScroll>
          <table className="w-full min-w-[640px] text-sm">
            <thead className="glass-thead text-hub-text-muted">
              <tr>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Turma</th>
                <th className="px-4 py-3 text-left">Disciplina</th>
                <th className="px-4 py-3 text-left">Professor</th>
                <th className="px-4 py-3 text-left">Aulas</th>
                <th className="px-4 py-3 text-left">Presentes</th>
                <th className="px-4 py-3 text-left">Faltas Just.</th>
                <th className="px-4 py-3 text-left">Faltas Injust.</th>
                <th className="px-4 py-3 text-left">% Presenca</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const stats = record.stats
                const present = stats?.present ?? 0
                const justified = stats?.justified ?? 0
                const absent = stats?.absent ?? 0
                const pct = stats?.presence_rate ?? 0
                const total = stats?.total ?? 0

                return (
                  <tr key={record.id} className="border-t border-hub-border/40">
                    <td className="px-4 py-3">{formatDate(record.session_date)}</td>
                    <td className="px-4 py-3">{record.class?.name ?? EMPTY}</td>
                    <td className="px-4 py-3">{record.subject}</td>
                    <td className="px-4 py-3">{record.teacher?.full_name ?? record.class?.teacher?.full_name ?? EMPTY}</td>
                    <td className="px-4 py-3">{stats?.lessons_count ?? 2}</td>
                    <td className="px-4 py-3 text-emerald-600">
                      {present} ({total > 0 ? `${pct}%` : '0%'})
                    </td>
                    <td className="px-4 py-3 text-amber-600">
                      {justified} ({total > 0 ? `${Math.round((justified / total) * 100)}%` : '0%'})
                    </td>
                    <td className="px-4 py-3 text-red-600">
                      {absent} ({total > 0 ? `${Math.round((absent / total) * 100)}%` : '0%'})
                    </td>
                    <td className="px-4 py-3 font-medium text-emerald-600">{pct}%</td>
                    <td className="px-4 py-3 text-right">
                      <ConnectRowActionsMenu
                        ariaLabel={`Ações da frequência de ${record.class?.name ?? 'turma'}`}
                        actions={[
                          viewRowAction(() => setViewSnapshot(record)),
                          {
                            key: 'open',
                            label: 'Abrir em frequência',
                            icon: Pencil,
                            onClick: () => {
                              const params = new URLSearchParams()
                              if (record.connect_class_id) params.set('class', String(record.connect_class_id))
                              if (record.session_date) params.set('date', record.session_date.slice(0, 10))
                              navigate(`/connect/frequencia?${params.toString()}`)
                            },
                          },
                          {
                            key: 'edit',
                            label: 'Editar registro',
                            icon: Pencil,
                            onClick: () => {
                              const params = new URLSearchParams()
                              if (record.connect_class_id) params.set('class', String(record.connect_class_id))
                              if (record.session_date) params.set('date', record.session_date.slice(0, 10))
                              navigate(`/connect/frequencia?${params.toString()}`)
                            },
                          },
                          {
                            key: 'export',
                            label: 'Exportar',
                            icon: Download,
                            onClick: () => {
                              const line = [
                                record.session_date,
                                record.class?.name,
                                record.subject,
                                stats?.presence_rate,
                              ].join(';')
                              void navigator.clipboard?.writeText(line)
                            },
                          },
                        ]}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </ConnectTableScroll>
        <ConnectPagination meta={meta} onPageChange={setPage} />
        </>
        )}
      </ConnectCard>

      <ConnectEntityViewDrawer
        kind="attendance"
        entityId={null}
        open={viewSnapshot !== null}
        onClose={() => setViewSnapshot(null)}
        snapshot={viewSnapshot ?? undefined}
      />
    </div>
  )
}
