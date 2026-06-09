import { useTranslation } from 'react-i18next'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ConnectDrawer } from '../../components/connect/ConnectDrawer'
import {
  ConnectCard,
  ConnectLoadingSpinner,
  ConnectPageHeader,
  ConnectPagination,
  ConnectTableScroll,
  FormField,
  inputClass,
  OutlineButton,
  PrimaryButton,
  selectClass,
  StatusBadge,
} from '../../components/connect/ConnectShared'
import { safeService } from '../../services/safeService'
import type { PaginatedMeta, SafeStudent } from '../../types/safe'
import { confirmDelete } from '../../utils/confirmAction'
import { parseApiError } from '../../utils/parseApiError'

const emptyForm = {
  registration: '',
  name: '',
  class_name: '',
  active: 'true',
}

export function SafeStudentsPage() {
  const { t } = useTranslation()
  const [students, setStudents] = useState<SafeStudent[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | undefined>()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const load = () => {
    setLoading(true)
    safeService
      .getStudents({ page, search, per_page: 10 })
      .then((res) => {
        setStudents(res.data)
        setMeta(res.meta)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page, search])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDrawerOpen(true)
  }

  const openEdit = (student: SafeStudent) => {
    setEditingId(student.id)
    setForm({
      registration: student.registration,
      name: student.name,
      class_name: student.class_name,
      active: student.active ? 'true' : 'false',
    })
    setDrawerOpen(true)
  }

  const handleSave = async () => {
    if (!form.registration.trim() || !form.name.trim() || !form.class_name.trim()) {
      window.alert('Preencha matrícula, nome e turma.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        registration: form.registration.trim(),
        name: form.name.trim(),
        class_name: form.class_name.trim(),
        active: form.active === 'true',
      }
      if (editingId) {
        await safeService.updateStudent(editingId, payload)
      } else {
        await safeService.createStudent(payload)
      }
      setDrawerOpen(false)
      load()
    } catch (e: unknown) {
      window.alert(parseApiError(e))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (student: SafeStudent) => {
    if (!(await confirmDelete(student.name))) return
    await safeService.deleteStudent(student.id)
    load()
  }

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title={t('safe.students.title')}
        subtitle={t('safe.students.subtitle')}
        actions={
          <>
            <input
              type="search"
              placeholder="Buscar aluno..."
              value={search}
              onChange={(e) => {
                setPage(1)
                setSearch(e.target.value)
              }}
              className={`${inputClass} max-w-xs`}
            />
            <PrimaryButton onClick={openCreate}>
              <Plus className="h-4 w-4" /> Novo aluno
            </PrimaryButton>
          </>
        }
      />

      <ConnectCard className="min-w-0 overflow-hidden">
        {loading ? (
          <ConnectLoadingSpinner />
        ) : students.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-hub-text-muted sm:px-6">Nenhum aluno cadastrado.</p>
        ) : (
          <ConnectTableScroll>
            <table className="w-full min-w-[640px] text-sm">
              <thead className="glass-thead text-hub-text-muted">
                <tr>
                  <th className="px-4 py-3 text-left sm:px-6">Matrícula</th>
                  <th className="px-4 py-3 text-left sm:px-6">Nome</th>
                  <th className="px-4 py-3 text-left sm:px-6">Turma</th>
                  <th className="px-4 py-3 text-left sm:px-6">Status</th>
                  <th className="px-4 py-3 text-right sm:px-6">Ações</th>
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
                    <td className="px-4 py-3 sm:px-6">
                      <div className="flex justify-end gap-2">
                        <OutlineButton onClick={() => openEdit(student)}>
                          <Pencil className="h-4 w-4" />
                        </OutlineButton>
                        <OutlineButton onClick={() => handleDelete(student)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
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
        title={editingId ? 'Editar aluno' : 'Novo aluno'}
        footer={
          <>
            <OutlineButton onClick={() => setDrawerOpen(false)}>Cancelar</OutlineButton>
            <PrimaryButton onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Matrícula" required>
            <input
              className={inputClass}
              value={form.registration}
              onChange={(e) => setForm((f) => ({ ...f, registration: e.target.value }))}
            />
          </FormField>
          <FormField label="Nome completo" required>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </FormField>
          <FormField label="Turma" required>
            <input
              className={inputClass}
              value={form.class_name}
              onChange={(e) => setForm((f) => ({ ...f, class_name: e.target.value }))}
            />
          </FormField>
          <FormField label="Status">
            <select
              className={selectClass}
              value={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.value }))}
            >
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </FormField>
        </div>
      </ConnectDrawer>
    </div>
  )
}
