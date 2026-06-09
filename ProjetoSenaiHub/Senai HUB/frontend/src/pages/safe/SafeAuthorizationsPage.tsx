import { useTranslation } from 'react-i18next'
import { Eye, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConnectDrawer } from '../../components/connect/ConnectDrawer'
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
import { parseApiError } from '../../utils/parseApiError'

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
  const navigate = useNavigate()
  const [items, setItems] = useState<SafeAuthorization[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | undefined>()
  const [students, setStudents] = useState<SafeStudent[]>([])
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const load = () => {
    setLoading(true)
    safeService
      .getAuthorizations({ page, search, per_page: 10 })
      .then((res) => {
        setItems(res.data)
        setMeta(res.meta)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page, search])

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
      window.alert('Informe o motivo da solicitação.')
      return
    }
    if (!form.safe_student_id && (!form.student_name.trim() || !form.class_name.trim())) {
      window.alert('Selecione um aluno ou informe nome e turma.')
      return
    }
    setSaving(true)
    try {
      await safeService.createAuthorization({
        safe_student_id: form.safe_student_id ? Number(form.safe_student_id) : undefined,
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
      load()
    } catch (e: unknown) {
      window.alert(parseApiError(e))
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
          <>
            <input
              type="search"
              placeholder="Buscar protocolo ou aluno..."
              value={search}
              onChange={(e) => {
                setPage(1)
                setSearch(e.target.value)
              }}
              className={`${inputClass} max-w-xs`}
            />
            <PrimaryButton onClick={() => setDrawerOpen(true)}>
              <Plus className="h-4 w-4" /> Nova solicitação
            </PrimaryButton>
          </>
        }
      />

      <ConnectCard className="min-w-0 overflow-hidden">
        {loading ? (
          <ConnectLoadingSpinner />
        ) : items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-hub-text-muted sm:px-6">Nenhuma autorização encontrada.</p>
        ) : (
          <ConnectTableScroll>
            <table className="w-full min-w-[720px] text-sm">
              <thead className="glass-thead text-hub-text-muted">
                <tr>
                  <th className="px-4 py-3 text-left sm:px-6">Protocolo</th>
                  <th className="px-4 py-3 text-left sm:px-6">Aluno</th>
                  <th className="px-4 py-3 text-left sm:px-6">Tipo</th>
                  <th className="px-4 py-3 text-left sm:px-6">Status</th>
                  <th className="px-4 py-3 text-left sm:px-6">Agendado</th>
                  <th className="px-4 py-3 text-right sm:px-6">Ações</th>
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
        title="Nova autorização"
        footer={
          <>
            <OutlineButton onClick={() => setDrawerOpen(false)}>Cancelar</OutlineButton>
            <PrimaryButton onClick={handleCreate} disabled={saving}>
              {saving ? 'Enviando...' : 'Criar solicitação'}
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Aluno cadastrado">
            <select
              className={selectClass}
              value={form.safe_student_id}
              onChange={(e) => onStudentSelect(e.target.value)}
            >
              <option value="">— Informar manualmente —</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.registration})
                </option>
              ))}
            </select>
          </FormField>
          {!form.safe_student_id && (
            <>
              <FormField label="Nome do aluno" required>
                <input className={inputClass} value={form.student_name} onChange={(e) => setForm((f) => ({ ...f, student_name: e.target.value }))} />
              </FormField>
              <FormField label="Turma" required>
                <input className={inputClass} value={form.class_name} onChange={(e) => setForm((f) => ({ ...f, class_name: e.target.value }))} />
              </FormField>
            </>
          )}
          <FormField label="Tipo" required>
            <select className={selectClass} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as SafeAuthorizationType }))}>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
          </FormField>
          <FormField label="Motivo" required>
            <textarea className={`${inputClass} min-h-[88px] py-2`} value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Data" required>
              <input type="date" className={inputClass} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </FormField>
            <FormField label="Horário" required>
              <input type="time" className={inputClass} value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} />
            </FormField>
          </div>
          <FormField label="Faltas (saída)">
            <input type="number" min={0} max={5} className={inputClass} value={form.absence_count} onChange={(e) => setForm((f) => ({ ...f, absence_count: e.target.value }))} />
          </FormField>
          <FormField label="Observações">
            <textarea className={`${inputClass} min-h-[72px] py-2`} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </FormField>
        </div>
      </ConnectDrawer>
    </div>
  )
}
