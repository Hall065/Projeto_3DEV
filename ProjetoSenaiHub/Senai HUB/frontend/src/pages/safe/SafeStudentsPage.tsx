import { useTranslation } from 'react-i18next'
import { ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SafePageToolbar } from '../../components/safe/SafePageToolbar'
import {
  ConnectCard,
  ConnectLoadingSpinner,
  ConnectPageHeader,
  ConnectPagination,
  ConnectTableScroll,
  FormField,
  OutlineButton,
  selectClass,
  StatusBadge,
} from '../../components/connect/ConnectShared'
import { safeService } from '../../services/safeService'
import type { PaginatedMeta, SafeStudent } from '../../types/safe'

export function SafeStudentsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [students, setStudents] = useState<SafeStudent[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | undefined>()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    const params: Record<string, string | number | boolean> = { page, search, per_page: 10 }
    if (statusFilter === 'active') params.active = true
    if (statusFilter === 'inactive') params.active = false

    safeService
      .getStudents(params)
      .then((res) => {
        setStudents(res.data)
        setMeta(res.meta)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page, search, statusFilter])

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title={t('safe.students.title')}
        subtitle={t('safe.students.subtitle')}
        actions={
          <OutlineButton onClick={() => navigate('/connect/alunos')}>
            <ExternalLink className="h-4 w-4" /> {t('safe.students.manageInConnect')}
          </OutlineButton>
        }
      />

      <p className="mb-4 text-sm text-hub-text-muted">{t('safe.students.connectHint')}</p>

      <SafePageToolbar
        search={search}
        onSearchChange={(value) => {
          setPage(1)
          setSearch(value)
        }}
        searchLabel={t('connect.table.name')}
        searchPlaceholder={t('safe.students.searchPlaceholder')}
        filters={
          <FormField label={t('safe.table.status')}>
            <select
              className={selectClass}
              value={statusFilter}
              onChange={(e) => {
                setPage(1)
                setStatusFilter(e.target.value)
              }}
            >
              <option value="">{t('connect.students.filters.allStatuses')}</option>
              <option value="active">{t('connect.status.active')}</option>
              <option value="inactive">{t('connect.status.inactive')}</option>
            </select>
          </FormField>
        }
      />

      <ConnectCard className="min-w-0 overflow-hidden">
        {loading ? (
          <ConnectLoadingSpinner />
        ) : students.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-hub-text-muted sm:px-6">{t('safe.students.empty')}</p>
        ) : (
          <ConnectTableScroll>
            <table className="w-full min-w-[640px] text-sm">
              <thead className="glass-thead text-hub-text-muted">
                <tr>
                  <th className="px-4 py-3 text-left sm:px-6">{t('safe.students.table.registration')}</th>
                  <th className="px-4 py-3 text-left sm:px-6">{t('safe.students.table.name')}</th>
                  <th className="px-4 py-3 text-left sm:px-6">{t('safe.students.table.class')}</th>
                  <th className="px-4 py-3 text-left sm:px-6">{t('safe.table.status')}</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-t border-hub-border/40">
                    <td className="px-4 py-3 font-medium text-hub-navy sm:px-6">{student.registration}</td>
                    <td className="px-4 py-3 sm:px-6">{student.name}</td>
                    <td className="px-4 py-3 sm:px-6">{student.class_name}</td>
                    <td className="px-4 py-3 sm:px-6">
                      <StatusBadge status={student.active ? 'active' : 'inactive'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ConnectTableScroll>
        )}
        <ConnectPagination meta={meta} onPageChange={setPage} />
      </ConnectCard>
    </div>
  )
}
