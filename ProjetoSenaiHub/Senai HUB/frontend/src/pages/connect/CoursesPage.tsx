import { MoreVertical, Pencil, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ConnectDrawer } from '../../components/connect/ConnectDrawer'
import {
  ConnectCard,
  ConnectLoadingSpinner,
  ConnectPageHeader,
  ConnectPagination,
  FormField,
  inputClass,
  OutlineButton,
  PrimaryButton,
  selectClass,
  StatusBadge,
} from '../../components/connect/ConnectShared'
import { connectService } from '../../services/connectService'
import type { ConnectCourse, PaginatedMeta } from '../../types/connect'

const emptyForm = { name: '', description: '', workload_hours: '120', area: '', status: 'active' }

export function CoursesPage() {
  const [courses, setCourses] = useState<ConnectCourse[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | undefined>()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    connectService
      .getCourses({ page, per_page: 12, search })
      .then((res) => {
        setCourses(res.data)
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

  const openEdit = (course: ConnectCourse) => {
    setEditingId(course.id)
    setForm({
      name: course.name,
      description: course.description ?? '',
      workload_hours: String(course.workload_hours ?? 120),
      area: course.area ?? '',
      status: course.status,
    })
    setDrawerOpen(true)
  }

  const handleSave = async () => {
    if (editingId) {
      await connectService.updateCourse(editingId, {
        ...form,
        workload_hours: Number(form.workload_hours),
      })
    } else {
      await connectService.createCourse({
        ...form,
        code: form.name.substring(0, 3).toUpperCase(),
        workload_hours: Number(form.workload_hours),
      })
    }
    setDrawerOpen(false)
    load()
  }

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Cursos"
        subtitle="Gerenciamento de Cursos."
        actions={
          <PrimaryButton onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Criar curso
          </PrimaryButton>
        }
      />

      <ConnectCard className="p-4">
        <div className="mb-4">
          <input
            className={inputClass}
            placeholder="Buscar curso..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {loading ? (
          <ConnectLoadingSpinner label="Carregando cursos..." className="min-h-[320px]" />
        ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div key={course.id} className="rounded-xl border border-hub-border p-4">
              <div className="mb-2 flex items-start justify-between">
                <h3 className="font-semibold text-hub-navy">{course.name}</h3>
                <button type="button" onClick={() => openEdit(course)} aria-label="Editar curso">
                  <MoreVertical className="h-4 w-4 text-hub-text-muted" />
                </button>
              </div>
              <p className="text-xs text-hub-text-muted">Carga horaria: {course.workload_hours}h</p>
              <p className="mt-2 line-clamp-2 text-sm text-hub-text-muted">{course.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <StatusBadge status={course.status} />
                <button type="button" onClick={() => openEdit(course)} className="text-xs font-medium text-hub-red">
                  <Pencil className="h-3 w-3 inline" />
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
        )}
        <ConnectPagination meta={meta} onPageChange={setPage} />
      </ConnectCard>

      <ConnectDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingId ? 'Editar curso' : 'Cadastrar curso'}
        subtitle="Preencha os dados do curso."
        footer={
          <div className="flex justify-end gap-2">
            <OutlineButton onClick={() => setForm(emptyForm)}>Limpar Campos</OutlineButton>
            <OutlineButton onClick={() => setDrawerOpen(false)}>Cancelar</OutlineButton>
            <PrimaryButton onClick={handleSave}>Salvar</PrimaryButton>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nome do curso" required>
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Automação Industrial" />
          </FormField>
          <FormField label="Área">
            <input className={inputClass} value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="Ex: Indústria 4.0" />
          </FormField>
          <FormField label="Carga horária total" required>
            <input className={inputClass} value={form.workload_hours} onChange={(e) => setForm({ ...form, workload_hours: e.target.value })} placeholder="Ex: 120 horas" />
          </FormField>
          <FormField label="Status" required>
            <select className={selectClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </FormField>
          <FormField label="Descrição" required>
            <textarea className={`${inputClass} min-h-[100px] py-2 sm:col-span-2`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descreva o curso, ementa e objetivos..." />
          </FormField>
        </div>
      </ConnectDrawer>
    </div>
  )
}
