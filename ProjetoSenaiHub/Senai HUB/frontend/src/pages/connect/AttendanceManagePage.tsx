import { Download, Eye, Filter, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ConnectEntityViewDrawer } from '../../components/connect/ConnectEntityViewDrawer'
import { ConnectRowActionsMenu } from '../../components/connect/ConnectRowActionsMenu'
import {
  ConnectCard,
  ConnectPageHeader,
  ConnectLoadingSpinner,
  ConnectPagination,
  ConnectTableScroll,
  EMPTY,
  FormField,
  formatDate,
  inputClass,
  OutlineButton,
  selectClass,
} from '../../components/connect/ConnectShared'
import { connectService } from '../../services/connectService'
import type { ConnectAttendanceSession, ConnectClass, PaginatedMeta } from '../../types/connect'
import { downloadCsv } from '../../utils/csvExport'

function recordToCsvRow(record: ConnectAttendanceSession): (string | number)[] {
  const stats = record.stats
  const present = stats?.present ?? 0
  const justified = stats?.justified ?? 0
  const absent = stats?.absent ?? 0
  const pct = stats?.presence_rate ?? 0
  const total = stats?.total ?? 0

  return [
    formatDate(record.session_date),
    record.class?.name ?? EMPTY,
    record.subject,
    record.teacher?.full_name ?? record.class?.teacher?.full_name ?? EMPTY,
    stats?.lessons_count ?? 0,
    `${present} (${total > 0 ? `${pct}%` : '0%'})`,
    `${justified} (${total > 0 ? `${Math.round((justified / total) * 100)}%` : '0%'})`,
    `${absent} (${total > 0 ? `${Math.round((absent / total) * 100)}%` : '0%'})`,
    `${pct}%`,
  ]
}

export function AttendanceManagePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [records, setRecords] = useState<ConnectAttendanceSession[]>([])
  const [classes, setClasses] = useState<ConnectClass[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | undefined>()
  const [page, setPage] = useState(1)
  const [classId, setClassId] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [viewSnapshot, setViewSnapshot] = useState<ConnectAttendanceSession | null>(null)

  const attendanceCsvHeaders = [
    t('connect.attendanceManage.table.date'),
    t('connect.table.class'),
    t('connect.attendanceManage.table.subject'),
    t('connect.attendanceManage.table.teacher'),
    t('connect.attendanceManage.table.lessons'),
    t('connect.attendanceManage.table.present'),
    t('connect.attendanceManage.table.justified'),
    t('connect.attendanceManage.table.unjustified'),
    t('connect.attendanceManage.table.presenceRate'),
  ]

  const load = () => {
    setLoading(true)
    const params: Record<string, string | number> = { page, per_page: 10 }
    if (classId) params.connect_class_id = classId
    if (fromDate) params.from_date = fromDate
    if (toDate) params.to_date = toDate
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
  }, [page, classId, fromDate, toDate])

  const handleExportAll = () => {
    downloadCsv(
      'frequencia',
      attendanceCsvHeaders,
      records.map(recordToCsvRow),
    )
  }

  const handleExportRow = (record: ConnectAttendanceSession) => {
    downloadCsv(`frequencia-${record.id}`, attendanceCsvHeaders, [recordToCsvRow(record)])
  }

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader title={t('connect.attendanceManage.title')} subtitle={t('connect.attendanceManage.subtitle')} />

      <ConnectCard>
        <div className="flex w-full min-w-0 flex-col gap-3 border-b border-hub-border/60 p-4 sm:flex-row sm:flex-wrap sm:items-center [&_button]:w-full sm:[&_button]:w-auto">
          <select className={`${selectClass} w-full sm:w-48`} value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">{t('connect.attendanceManage.filters.allClasses')}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <OutlineButton onClick={handleExportAll}>
            <Download className="h-4 w-4" />
            {t('connect.common.export')}
          </OutlineButton>
          <OutlineButton onClick={() => setShowFilters((v) => !v)}>
            <Filter className="h-4 w-4" />
            {t('connect.common.filters')}
          </OutlineButton>
        </div>
        {showFilters && (
          <div className="grid gap-4 border-b border-hub-border/60 p-4 sm:grid-cols-2">
            <FormField label={t('connect.attendanceManage.filters.startDate')}>
              <input
                type="date"
                className={inputClass}
                value={fromDate}
                onChange={(e) => {
                  setPage(1)
                  setFromDate(e.target.value)
                }}
              />
            </FormField>
            <FormField label={t('connect.attendanceManage.filters.endDate')}>
              <input
                type="date"
                className={inputClass}
                value={toDate}
                onChange={(e) => {
                  setPage(1)
                  setToDate(e.target.value)
                }}
              />
            </FormField>
          </div>
        )}
        {loading ? (
          <ConnectLoadingSpinner label={t('connect.attendanceManage.loading')} className="min-h-[280px]" />
        ) : (
        <>
        <ConnectTableScroll>
          <table className="w-full min-w-[640px] text-sm">
            <thead className="glass-thead text-hub-text-muted">
              <tr>
                <th className="px-4 py-3 text-left">{t('connect.attendanceManage.table.date')}</th>
                <th className="px-4 py-3 text-left">{t('connect.table.class')}</th>
                <th className="px-4 py-3 text-left">{t('connect.attendanceManage.table.subject')}</th>
                <th className="px-4 py-3 text-left">{t('connect.attendanceManage.table.teacher')}</th>
                <th className="px-4 py-3 text-left">{t('connect.attendanceManage.table.lessons')}</th>
                <th className="px-4 py-3 text-left">{t('connect.attendanceManage.table.present')}</th>
                <th className="px-4 py-3 text-left">{t('connect.attendanceManage.table.justified')}</th>
                <th className="px-4 py-3 text-left">{t('connect.attendanceManage.table.unjustified')}</th>
                <th className="px-4 py-3 text-left">{t('connect.attendanceManage.table.presenceRate')}</th>
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
                    <td className="px-4 py-3">{stats?.lessons_count ?? 0}</td>
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
                        ariaLabel={t('connect.common.actionsOf', { name: record.class?.name ?? t('connect.table.class') })}
                        actions={[
                          {
                            key: 'view',
                            label: t('connect.common.view'),
                            icon: Eye,
                            onClick: () => setViewSnapshot(record),
                          },
                          {
                            key: 'open',
                            label: t('connect.attendanceManage.actions.openAttendance'),
                            icon: Pencil,
                            onClick: () => {
                              const params = new URLSearchParams()
                              if (record.connect_class_id) params.set('class', String(record.connect_class_id))
                              if (record.session_date) params.set('date', record.session_date.slice(0, 10))
                              if (record.connect_lesson_schedule_id) {
                                params.set('lesson', String(record.connect_lesson_schedule_id))
                              }
                              navigate(`/connect/frequencia?${params.toString()}`)
                            },
                          },
                          {
                            key: 'edit',
                            label: t('connect.attendanceManage.actions.editRecord'),
                            icon: Pencil,
                            onClick: () => {
                              const params = new URLSearchParams()
                              if (record.connect_class_id) params.set('class', String(record.connect_class_id))
                              if (record.session_date) params.set('date', record.session_date.slice(0, 10))
                              if (record.connect_lesson_schedule_id) {
                                params.set('lesson', String(record.connect_lesson_schedule_id))
                              }
                              navigate(`/connect/frequencia?${params.toString()}`)
                            },
                          },
                          {
                            key: 'export',
                            label: t('connect.common.export'),
                            icon: Download,
                            onClick: () => handleExportRow(record),
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
