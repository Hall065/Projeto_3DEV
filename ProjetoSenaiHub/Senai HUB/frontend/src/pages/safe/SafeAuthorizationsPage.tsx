import { useTranslation } from 'react-i18next'
import { Eye, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConnectDrawer } from '../../components/connect/ConnectDrawer'
import { SafePageToolbar } from '../../components/safe/SafePageToolbar'
import {
  ConnectCard,
  ConnectLoadingSpinner,
  ConnectPageHeader,
  ConnectPagination,
  ConnectTableScroll,
  FormField,
  formatDateTime,
  inputClass,
  OutlineButton,
  PrimaryButton,
  selectClass,
} from '../../components/connect/ConnectShared'
import { SafeStatusBadge } from '../../components/safe/SafeStatusBadge'
import { safeService } from '../../services/safeService'
import type { PaginatedMeta, SafeAuthorization, SafeAuthorizationType, SafeStudent } from '../../types/safe'
import { useCrudToast } from '../../hooks/useCrudToast'

const emptyForm = {
  safe_student_id: '',
  student_name: '',
  class_name: '',
  type: 'entrada' as SafeAuthorizationType,
  reason: '',
  absence_count: '0',
  date: new Date().toISOString().slice(0, 10),
  time: '08:00',
  notes: '',
}

export function SafeAuthorizationsPage() {
  const { t } = useTranslation()
  const crudToast = useCrudToast()
  const navigate = useNavigate()
  const [items, setItems] = useState<SafeAuthorization[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | undefined>()
  const [students, setStudents] = useState<SafeStudent[]>([])
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const load = () => {
    setLoading(true)
    const params: Record<string, string | number> = { page, search, per_page: 10 }
    if (statusFilter) params.status = statusFilter
    safeService
      .getAuthorizations(params)
      .then((res) => {
        setItems(res.data)
        setMeta(res.meta)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page, search, statusFilter])

  useEffect(() => {
    safeService.getStudents({ per_page: 100, active: true }).then((res) => setStudents(res.data))
  }, [])

  const onStudentSelect = (id: string) => {
    const student = students.find((s) => String(s.id) === id)
    setForm((f) => ({
      ...f,
      safe_student_id: id,
      student_name: student?.name ?? f.student_name,
      class_name: student?.class_name ?? f.class_name,
    }))
  }

  const handleCreate = async () => {
    if (!form.reason.trim()) {
      crudToast.notifyWarning(t('safeValidation.fillReason'))
      return
    }
    if (!form.safe_student_id && (!form.student_name.trim() || !form.class_name.trim())) {
      crudToast.notifyWarning(t('safeValidation.selectStudentOrNameClass'))
      return
    }
    setSaving(true)
    try {
      const selected = students.find((s) => String(s.id) === form.safe_student_id)
      await safeService.createAuthorization({
        safe_student_id: form.safe_student_id ? Number(form.safe_student_id) : undefined,
        connect_student_id: selected?.connect_student_id ?? undefined,
        student_name: form.student_name.trim() || undefined,
        class_name: form.class_name.trim() || undefined,
        type: form.type,
        reason: form.reason.trim(),
        absence_count: Number(form.absence_count) || 0,
        date: form.date,
        time: form.time,
        notes: form.notes.trim() || undefined,
      })
      setDrawerOpen(false)
      setForm(emptyForm)
      crudToast.notifySaved(false)
      load()
    } catch (e: unknown) {
      crudToast.notifyError(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title={t('safe.authorizations.title')}
        subtitle={t('safe.authorizations.subtitle')}
        actions={
          <PrimaryButton onClick={() => setDrawerOpen(true)}>
            <Plus className="h-4 w-4" /> {t('safe.authorizations.newRequest')}
          </PrimaryButton>
        }
      />

      <SafePageToolbar
        search={search}
        onSearchChange={(value) => {
          setPage(1)
          setSearch(value)
        }}
        searchLabel={t('common.search')}
        searchPlaceholder={t('safe.authorizations.searchPlaceholder')}
        filters={
          <FormField label={t('safe.authorizations.filters.status')}>
            <select
              className={selectClass}
              value={statusFilter}
              onChange={(e) => {
                setPage(1)
                setStatusFilter(e.target.value)
              }}
            >
              <option value="">{t('safe.authorizations.filters.allStatuses')}</option>
              <option value="finalizado">{t('safe.authorizations.filters.finalizado')}</option>
              <option value="negado">{t('safe.authorizations.filters.negado')}</option>
              <option value="pendente_aqv">{t('safe.authorizations.filters.pendente_aqv')}</option>
              <option value="aguardando_professor">{t('safe.authorizations.filters.aguardando_professor')}</option>
              <option value="liberado_portaria">{t('safe.authorizations.filters.liberado_portaria')}</option>
            </select>
          </FormField>
        }
      />

      <ConnectCard className="min-w-0 overflow-hidden">
        {loading ? (
          <ConnectLoadingSpinner />
        ) : items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-hub-text-muted sm:px-6">{t('safe.authorizations.empty')}</p>
        ) : (
          <ConnectTableScroll>
            <table className="w-full min-w-[720px] text-sm">
              <thead className="glass-thead text-hub-text-muted">
                <tr>
                  <th className="px-4 py-3 text-left sm:px-6">{t('safe.table.protocol')}</th>
                  <th className="px-4 py-3 text-left sm:px-6">{t('safe.table.student')}</th>
                  <th className="px-4 py-3 text-left sm:px-6">{t('safe.table.type')}</th>
                  <th className="px-4 py-3 text-left sm:px-6">{t('safe.table.status')}</th>
                  <th className="px-4 py-3 text-left sm:px-6">{t('safe.table.scheduled')}</th>
                  <th className="px-4 py-3 text-right sm:px-6">{t('connect.common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((auth) => (
                  <tr key={auth.id} className="border-t border-hub-border/40">
                    <td className="px-4 py-3 font-medium text-hub-red sm:px-6">{auth.protocol}</td>
                    <td className="px-4 py-3 sm:px-6">{auth.student_name}</td>
                    <td className="px-4 py-3 sm:px-6">{auth.type_label}</td>
                    <td className="px-4 py-3 sm:px-6">
                      <SafeStatusBadge status={auth.status} label={auth.status_label} />
                    </td>
                    <td className="px-4 py-3 sm:px-6">{formatDateTime(auth.scheduled_at)}</td>
                    <td className="px-4 py-3 sm:px-6">
                      <div className="flex justify-end">
                        <OutlineButton onClick={() => navigate(`/safe/autorizacoes/${auth.id}`)}>
                          <Eye className="h-4 w-4" />
                        </OutlineButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ConnectTableScroll>
        )}
        <ConnectPagination meta={meta} onPageChange={setPage} />
      </ConnectCard>

      <ConnectDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={t('safe.authorizations.drawerTitle')}
        footer={
          <>
            <OutlineButton onClick={() => setDrawerOpen(false)}>{t('common.cancel')}</OutlineButton>
            <PrimaryButton onClick={handleCreate} disabled={saving}>
              {saving ? t('safe.authorizations.submitting') : t('safe.authorizations.createSubmit')}
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('safe.authorizations.form.registeredStudent')}>
            <select
              className={selectClass}
              value={form.safe_student_id}
              onChange={(e) => onStudentSelect(e.target.value)}
            >
              <option value="">{t('safe.authorizations.form.manualEntry')}</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.registration})
                </option>
              ))}
            </select>
          </FormField>
          {!form.safe_student_id && (
            <>
              <FormField label={t('safe.authorizations.form.studentName')} required>
                <input className={inputClass} value={form.student_name} onChange={(e) => setForm((f) => ({ ...f, student_name: e.target.value }))} />
              </FormField>
              <FormField label={t('safe.authorizations.form.className')} required>
                <input className={inputClass} value={form.class_name} onChange={(e) => setForm((f) => ({ ...f, class_name: e.target.value }))} />
              </FormField>
            </>
          )}
          <FormField label={t('safe.table.type')} required>
            <select className={selectClass} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as SafeAuthorizationType }))}>
              <option value="entrada">{t('safe.authorizations.form.typeEntry')}</option>
              <option value="saida">{t('safe.authorizations.form.typeExit')}</option>
            </select>
          </FormField>
          <FormField label={t('safe.table.reason')} required>
            <textarea className={`${inputClass} min-h-[88px] py-2`} value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('safe.authorizations.form.date')} required>
              <input type="date" className={inputClass} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </FormField>
            <FormField label={t('safe.authorizations.form.time')} required>
              <input type="time" className={inputClass} value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} />
            </FormField>
          </div>
          <FormField label={t('safe.authorizations.form.absences')}>
            <input type="number" min={0} max={5} className={inputClass} value={form.absence_count} onChange={(e) => setForm((f) => ({ ...f, absence_count: e.target.value }))} />
          </FormField>
          <FormField label={t('safe.detail.fields.notes')}>
            <textarea className={`${inputClass} min-h-[72px] py-2`} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </FormField>
        </div>
      </ConnectDrawer>
    </div>
  )
}
