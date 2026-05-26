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
  inputClass,
  OutlineButton,
  PrimaryButton,
  selectClass,
  StatusBadge,
} from '../../components/connect/ConnectShared'
import { UserAvatar } from '../../components/ui/UserAvatar'
import { connectService } from '../../services/connectService'
import type { ConnectTeacher, PaginatedMeta } from '../../types/connect'
import { confirmDelete } from '../../utils/confirmAction'

const emptyTeacherForm = { full_name: '', email: '', specialty: '', cpf: '', phone: '', status: 'active' }

export function TeachersPage() {
  const [teachers, setTeachers] = useState<ConnectTeacher[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | undefined>()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyTeacherForm)
  const [viewId, setViewId] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    connectService
      .getTeachers({ page, search, per_page: 10 })
      .then((res) => {
        setTeachers(res.data)
        setMeta(res.meta)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page, search])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyTeacherForm)
    setDrawerOpen(true)
  }

  const openEdit = (teacher: ConnectTeacher) => {
    setEditingId(teacher.id)
    setForm({
      full_name: teacher.full_name,
      email: teacher.email ?? '',
      specialty: teacher.specialty ?? '',
      cpf: teacher.cpf ?? '',
      phone: teacher.phone ?? '',
      status: teacher.status ?? 'active',
    })
    setDrawerOpen(true)
  }

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      window.alert('Informe o nome completo do professor.')
      return
    }

    if (editingId) {
      await connectService.updateTeacher(editingId, {
        ...form,
        full_name: form.full_name.trim(),
        email: form.email.trim() || undefined,
        specialty: form.specialty.trim() || undefined,
        cpf: form.cpf.trim() || undefined,
        phone: form.phone.trim() || undefined,
      })
    } else {
      await connectService.createTeacher({
        ...form,
        full_name: form.full_name.trim(),
        email: form.email.trim() || undefined,
        specialty: form.specialty.trim() || undefined,
        cpf: form.cpf.trim() || undefined,
        phone: form.phone.trim() || undefined,
      })
    }
    setDrawerOpen(false)
    setEditingId(null)
    load()
  }

  const handleDelete = async (teacher: ConnectTeacher) => {
    if (!confirmDelete(`o professor "${teacher.full_name}"`)) return
    await connectService.deleteTeacher(teacher.id)
    load()
  }

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Gerenciamento de professores"
        subtitle="Cadastre, edite e acompanhe as informacoes dos professores."
        actions={
          <>
            <OutlineButton><Download className="h-4 w-4" /> Exportar</OutlineButton>
            <PrimaryButton onClick={openCreate}><Plus className="h-4 w-4" /> Novo</PrimaryButton>
          </>
        }
      />

      <ConnectCard className="mb-4 p-4">
        <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end [&_button]:w-full sm:[&_button]:w-auto">
          <input
            className={`${inputClass} min-w-0 flex-1 sm:min-w-[200px]`}
            placeholder="Buscar por nome, e-mail ou CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className={`${selectClass} w-full sm:w-40`}><option value="active">Ativos</option><option value="inactive">Inativos</option><option value="">Todos</option></select>
          <select className={`${selectClass} w-full sm:w-40`}><option value="">Todas as especialidades</option></select>
          <OutlineButton><Filter className="h-4 w-4" /> Filtros</OutlineButton>
        </div>
      </ConnectCard>

      <ConnectCard>
        {loading ? (
          <ConnectLoadingSpinner label="Carregando professores..." className="min-h-[280px]" />
        ) : (
        <>
        <ConnectTableScroll>
          <table className="w-full min-w-[640px] text-sm">
            <thead className="glass-thead text-hub-text-muted">
              <tr>
                <th className="px-4 py-3" />
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">E-mail institucional</th>
                <th className="px-4 py-3 text-left">Especialidade</th>
                <th className="px-4 py-3 text-left">Turmas</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="border-t border-hub-border/40">
                  <td className="px-4 py-3"><input type="checkbox" /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <UserAvatar name={teacher.full_name} size="sm" />
                      {teacher.full_name}
                    </div>
                  </td>
                  <td className="px-4 py-3">{teacher.email}</td>
                  <td className="px-4 py-3">{teacher.specialty ?? '-'}</td>
                  <td className="px-4 py-3">{teacher.classes_count ?? 0}</td>
                  <td className="px-4 py-3"><StatusBadge status={teacher.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <ConnectRowActionsMenu
                      ariaLabel={`Ações de ${teacher.full_name}`}
                      actions={[
                        viewRowAction(() => setViewId(teacher.id)),
                        { key: 'edit', label: 'Editar', icon: Pencil, onClick: () => openEdit(teacher) },
                        {
                          key: 'delete',
                          label: 'Excluir',
                          icon: Trash2,
                          variant: 'danger',
                          onClick: () => void handleDelete(teacher),
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
        title={editingId ? 'Editar professor' : 'Novo professor'}
        subtitle={editingId ? 'Atualize os dados do professor.' : 'Preencha os dados para cadastrar o novo professor.'}
        footer={
          <div className="flex justify-end gap-2">
            <OutlineButton onClick={() => setDrawerOpen(false)}>Cancelar</OutlineButton>
            <PrimaryButton onClick={() => void handleSave()}>Salvar</PrimaryButton>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nome completo" required>
            <input
              className={inputClass}
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Ex: João Santos"
            />
          </FormField>
          <FormField label="E-mail institucional" hint="Opcional">
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="professor@senai.edu.br"
            />
          </FormField>
          <FormField label="Especialidade">
            <input
              className={inputClass}
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              placeholder="Ex: Automação Industrial"
            />
          </FormField>
          <FormField label="CPF">
            <input
              className={inputClass}
              value={form.cpf}
              onChange={(e) => setForm({ ...form, cpf: e.target.value })}
              placeholder="000.000.000-00"
            />
          </FormField>
          <FormField label="Celular">
            <input
              className={inputClass}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </FormField>
          <FormField label="Status">
            <select className={selectClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </FormField>
        </div>
      </ConnectDrawer>

      <ConnectEntityViewDrawer
        kind="teacher"
        entityId={viewId}
        open={viewId !== null}
        onClose={() => setViewId(null)}
      />
    </div>
  )
}
