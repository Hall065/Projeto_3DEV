import { Download, Filter, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ConnectDrawer } from '../../components/connect/ConnectDrawer'
import { ConnectEntityViewDrawer } from '../../components/connect/ConnectEntityViewDrawer'
import { ConnectRowActionsMenu } from '../../components/connect/ConnectRowActionsMenu'
import { viewRowAction } from '../../components/connect/connectViewActions'
import {
  ConnectCard,
  ConnectPageHeader,
  ConnectLoadingSpinner,
  ConnectPagination,
  ConnectTableScroll,
  FormField,
  formatDate,
  inputClass,
  OutlineButton,
  PrimaryButton,
  selectClass,
  StatusBadge,
} from '../../components/connect/ConnectShared'
import { UserAvatar } from '../../components/ui/UserAvatar'
import { connectService } from '../../services/connectService'
import type { ConnectClass, ConnectStudent, PaginatedMeta } from '../../types/connect'
import { confirmDelete } from '../../utils/confirmAction'
import { optionalForeignIdOrNull } from '../../utils/connectForm'
import { downloadCsv } from '../../utils/csvExport'

const emptyStudentForm = {
  full_name: '',
  registration_number: '',
  cpf: '',
  birth_date: '',
  email: '',
  phone: '',
  connect_class_id: '',
  status: 'active',
  address: '',
  guardian_name: '',
  notes: '',
}

export function StudentsPage() {
  const [students, setStudents] = useState<ConnectStudent[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | undefined>()
  const [classes, setClasses] = useState<ConnectClass[]>([])
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyStudentForm)
  const [viewId, setViewId] = useState<number | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const load = () => {
    setLoading(true)
    const params: Record<string, string | number> = { page, search, per_page: 10 }
    if (classFilter) params.connect_class_id = classFilter
    if (statusFilter) params.status = statusFilter
    connectService
      .getStudents(params)
      .then((res) => {
        setStudents(res.data)
        setMeta(res.meta)
        setSelectedIds(new Set())
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page, search, classFilter, statusFilter])

  useEffect(() => {
    connectService.getClasses({ per_page: 50 }).then((res) => setClasses(res.data))
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyStudentForm)
    setDrawerOpen(true)
  }

  const openEdit = (student: ConnectStudent) => {
    const metadata = student.hub_person?.metadata ?? {}
    setEditingId(student.id)
    setForm({
      full_name: student.full_name,
      registration_number: student.registration_number ?? '',
      cpf: student.cpf ?? '',
      birth_date: student.birth_date?.slice(0, 10) ?? '',
      email: student.email ?? '',
      phone: student.phone ?? '',
      connect_class_id: String(student.connect_class_id ?? student.class?.id ?? ''),
      status: student.status ?? 'active',
      address: metadata.address ?? '',
      guardian_name: metadata.guardian_name ?? '',
      notes: metadata.notes ?? '',
    })
    setDrawerOpen(true)
  }

  const buildPayload = () => ({
    full_name: form.full_name.trim(),
    connect_class_id: optionalForeignIdOrNull(form.connect_class_id),
    registration_number: form.registration_number.trim() || undefined,
    cpf: form.cpf.trim() || undefined,
    email: form.email.trim() || undefined,
    phone: form.phone.trim() || undefined,
    birth_date: form.birth_date || undefined,
    status: form.status,
    address: form.address.trim() || undefined,
    guardian_name: form.guardian_name.trim() || undefined,
    notes: form.notes.trim() || undefined,
  })

  const handleSave = async (keepOpen = false) => {
    if (!form.full_name.trim()) {
      window.alert('Informe o nome completo do aluno.')
      return
    }

    setSaving(true)
    try {
      const payload = buildPayload()
      if (editingId) {
        await connectService.updateStudent(editingId, payload)
      } else {
        await connectService.createStudent(payload)
      }
      if (keepOpen) {
        setEditingId(null)
        setForm(emptyStudentForm)
      } else {
        setDrawerOpen(false)
        setEditingId(null)
        setForm(emptyStudentForm)
      }
      load()
    } finally {
      setSaving(false)
    }
  }

  const handleExport = () => {
    downloadCsv(
      'alunos',
      ['Nome', 'RM', 'Turma', 'Curso', 'Data de nascimento', 'Status'],
      students.map((student) => [
        student.full_name,
        student.registration_number ?? '-',
        student.class?.name ?? '-',
        student.class?.course?.name ?? '-',
        formatDate(student.birth_date),
        student.status,
      ]),
    )
  }

  const handleDelete = async (student: ConnectStudent) => {
    if (!confirmDelete(`o aluno "${student.full_name}"`)) return
    await connectService.deleteStudent(student.id)
    load()
  }

  const allSelected = students.length > 0 && students.every((s) => selectedIds.has(s.id))

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(students.map((s) => s.id)))
    }
  }

  const toggleOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearFilters = () => {
    setPage(1)
    setSearch('')
    setClassFilter('')
    setStatusFilter('')
  }

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Gerenciamento de Alunos"
        subtitle="Consulte, filtre e gerencie os alunos cadastrados."
        actions={
          <>
            <OutlineButton onClick={handleExport}>
              <Download className="h-4 w-4" /> Exportar
            </OutlineButton>
            <OutlineButton><Filter className="h-4 w-4" /> Filtros</OutlineButton>
            <PrimaryButton onClick={openCreate}><Plus className="h-4 w-4" /> Novo</PrimaryButton>
          </>
        }
      />

      <ConnectCard className="mb-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField label="Turma">
            <select
              className={selectClass}
              value={classFilter}
              onChange={(e) => {
                setPage(1)
                setClassFilter(e.target.value)
              }}
            >
              <option value="">Todas as turmas</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>
          <FormField label="Nome">
            <input
              className={inputClass}
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => {
                setPage(1)
                setSearch(e.target.value)
              }}
            />
          </FormField>
          <FormField label="Status">
            <select
              className={selectClass}
              value={statusFilter}
              onChange={(e) => {
                setPage(1)
                setStatusFilter(e.target.value)
              }}
            >
              <option value="">Todos os status</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="graduated">Formado</option>
            </select>
          </FormField>
        </div>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&_button]:w-full sm:[&_button]:w-auto">
          <OutlineButton onClick={clearFilters}>Limpar Filtros</OutlineButton>
        </div>
      </ConnectCard>

      <ConnectCard>
        <p className="border-b border-hub-border/60 px-4 py-3 text-sm text-hub-text-muted sm:px-6">
          {loading ? 'Carregando alunos...' : `${meta?.total?.toLocaleString('pt-BR') ?? 0} alunos encontrados`}
        </p>
        {loading ? (
          <ConnectLoadingSpinner label="Carregando alunos..." className="min-h-[280px]" />
        ) : (
        <>
        <ConnectTableScroll>
          <table className="w-full min-w-[720px] text-sm">
            <thead className="glass-thead text-hub-text-muted">
              <tr>
                <th className="px-4 py-3">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Selecionar todos" />
                </th>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">RM</th>
                <th className="px-4 py-3 text-left">Turma</th>
                <th className="px-4 py-3 text-left">Curso</th>
                <th className="px-4 py-3 text-left">Data de nascimento</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-t border-hub-border/40">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(student.id)}
                      onChange={() => toggleOne(student.id)}
                      aria-label={`Selecionar ${student.full_name}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <UserAvatar name={student.full_name} size="sm" />
                      <span className="font-medium">{student.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{student.registration_number ?? '-'}</td>
                  <td className="px-4 py-3">{student.class?.name ?? '-'}</td>
                  <td className="px-4 py-3">{student.class?.course?.name ?? '-'}</td>
                  <td className="px-4 py-3">{formatDate(student.birth_date)}</td>
                  <td className="px-4 py-3"><StatusBadge status={student.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <ConnectRowActionsMenu
                      ariaLabel={`Ações de ${student.full_name}`}
                      actions={[
                        viewRowAction(() => setViewId(student.id)),
                        { key: 'edit', label: 'Editar', icon: Pencil, onClick: () => openEdit(student) },
                        {
                          key: 'delete',
                          label: 'Excluir',
                          icon: Trash2,
                          variant: 'danger',
                          onClick: () => void handleDelete(student),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ConnectTableScroll>
        <ConnectPagination meta={meta} onPageChange={setPage} />
        </>
        )}
      </ConnectCard>

      <ConnectDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setEditingId(null)
        }}
        title={editingId ? 'Editar aluno' : 'Novo aluno'}
        subtitle={editingId ? 'Atualize os dados do aluno.' : 'Preencha os dados para cadastrar o novo aluno.'}
        footer={
          <div className="flex justify-end gap-2">
            <OutlineButton onClick={() => setDrawerOpen(false)}>Cancelar</OutlineButton>
            <OutlineButton onClick={() => void handleSave(true)} disabled={saving}>Salvar e Novo</OutlineButton>
            <PrimaryButton onClick={() => void handleSave()} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</PrimaryButton>
          </div>
        }
      >
        <div className="space-y-6">
          <section>
            <h3 className="mb-3 font-semibold text-hub-navy">Dados pessoais</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Nome completo" required>
                <input className={inputClass} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Ex: Maria Silva" />
              </FormField>
              <FormField label="RM" hint="Opcional">
                <input className={inputClass} value={form.registration_number} onChange={(e) => setForm({ ...form, registration_number: e.target.value })} placeholder="Ex: RM20250130" />
              </FormField>
              <FormField label="CPF">
                <input className={inputClass} value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" />
              </FormField>
              <FormField label="Data de nascimento" hint="Clique para abrir o calendário">
                <input type="date" className={inputClass} value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
              </FormField>
              <FormField label="E-mail pessoal">
                <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="aluno@email.com" />
              </FormField>
              <FormField label="Celular">
                <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" />
              </FormField>
            </div>
          </section>
          <section>
            <h3 className="mb-3 font-semibold text-hub-navy">Informações acadêmicas</h3>
            <FormField label="Turma" hint="Opcional — matricule depois">
              <select className={selectClass} value={form.connect_class_id} onChange={(e) => setForm({ ...form, connect_class_id: e.target.value })}>
                <option value="">Sem turma (definir depois)</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FormField>
            <FormField label="Status">
              <select className={selectClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="graduated">Formado</option>
              </select>
            </FormField>
          </section>
          <section>
            <h3 className="mb-3 font-semibold text-hub-navy">Informações adicionais</h3>
            <FormField label="Endereço">
              <input
                className={inputClass}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Rua, número, bairro, cidade"
              />
            </FormField>
            <FormField label="Nome do responsável">
              <input
                className={inputClass}
                value={form.guardian_name}
                onChange={(e) => setForm({ ...form, guardian_name: e.target.value })}
                placeholder="Nome do responsável legal"
              />
            </FormField>
            <FormField label="Observações">
              <textarea
                className={`${inputClass} min-h-[80px] py-2`}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Alergias, necessidades especiais, etc."
              />
            </FormField>
          </section>
        </div>
      </ConnectDrawer>

      <ConnectEntityViewDrawer
        kind="student"
        entityId={viewId}
        open={viewId !== null}
        onClose={() => setViewId(null)}
      />
    </div>
  )
}
