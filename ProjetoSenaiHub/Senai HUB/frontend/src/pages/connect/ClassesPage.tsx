import { Pencil, Plus, Trash2, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  EMPTY,
  FormField,
  formatDate,
  formatShift,
  inputClass,
  OutlineButton,
  PrimaryButton,
  selectClass,
  StatusBadge,
} from '../../components/connect/ConnectShared'
import { connectService } from '../../services/connectService'
import type { ConnectClass, ConnectCourse, ConnectTeacher, PaginatedMeta } from '../../types/connect'
import { confirmDelete } from '../../utils/confirmAction'
import { optionalForeignIdOrNull, slugClassCode } from '../../utils/connectForm'

const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const emptyForm = {
  name: '',
  connect_course_id: '',
  connect_teacher_id: '',
  shift: 'noite',
  start_date: '',
  end_date: '',
  capacity: '30',
  status: 'active',
  schedule: '',
  description: '',
}

export function ClassesPage() {
  const navigate = useNavigate()
  const [classes, setClasses] = useState<ConnectClass[]>([])
  const [courses, setCourses] = useState<ConnectCourse[]>([])
  const [teachers, setTeachers] = useState<ConnectTeacher[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | undefined>()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [viewId, setViewId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)

  const load = () => {
    setLoading(true)
    connectService
      .getClasses({ page, per_page: 10, search })
      .then((res) => {
        setClasses(res.data)
        setMeta(res.meta)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page, search])

  useEffect(() => {
    connectService.getCourses({ per_page: 50 }).then((r) => setCourses(r.data))
    connectService.getTeachers({ per_page: 50 }).then((r) => setTeachers(r.data))
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDrawerOpen(true)
  }

  const openEdit = (turma: ConnectClass) => {
    setEditingId(turma.id)
    setForm({
      name: turma.name,
      connect_course_id: String(turma.connect_course_id ?? turma.course?.id ?? ''),
      connect_teacher_id: String(turma.connect_teacher_id ?? turma.teacher?.id ?? ''),
      shift: turma.shift ?? 'noite',
      start_date: turma.start_date?.slice(0, 10) ?? '',
      end_date: turma.end_date?.slice(0, 10) ?? '',
      capacity: String(turma.capacity ?? 30),
      status: turma.status ?? 'active',
      schedule: '',
      description: '',
    })
    setDrawerOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      window.alert('Informe o nome da turma.')
      return
    }

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      connect_course_id: optionalForeignIdOrNull(form.connect_course_id),
      connect_teacher_id: optionalForeignIdOrNull(form.connect_teacher_id),
      shift: form.shift,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      capacity: Number(form.capacity) || 30,
      status: form.status,
      code: slugClassCode(form.name),
    }
    if (editingId) {
      await connectService.updateClass(editingId, payload)
    } else {
      await connectService.createClass(payload)
    }
    setDrawerOpen(false)
    setEditingId(null)
    load()
  }

  const handleDelete = async (turma: ConnectClass) => {
    if (!confirmDelete(`a turma "${turma.name}"`)) return
    try {
      await connectService.deleteClass(turma.id)
      load()
    } catch {
      window.alert('Não foi possível excluir a turma. Verifique se há alunos matriculados.')
    }
  }

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Turmas"
        subtitle="Gerenciamento de Turmas."
        actions={
          <PrimaryButton onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Criar turma
          </PrimaryButton>
        }
      />

      <ConnectCard>
        <div className="flex flex-wrap items-center gap-3 border-b border-hub-border/60 p-4">
          <input
            className={`${inputClass} max-w-xs`}
            placeholder="Filtrar turma..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {loading ? (
          <ConnectLoadingSpinner label="Carregando turmas..." className="min-h-[280px]" />
        ) : (
        <>
        <ConnectTableScroll>
          <table className="w-full min-w-[720px] text-sm">
            <thead className="glass-thead text-hub-text-muted">
              <tr>
                <th className="px-4 py-3 text-left">Nome da turma</th>
                <th className="px-4 py-3 text-left">Curso</th>
                <th className="px-4 py-3 text-left">Periodo</th>
                <th className="px-4 py-3 text-left">Inicio</th>
                <th className="px-4 py-3 text-left">Termino</th>
                <th className="px-4 py-3 text-left">Alunos</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {classes.map((turma) => (
                <tr key={turma.id} className="border-t border-hub-border/40">
                  <td className="px-4 py-3 font-medium">{turma.name}</td>
                  <td className="px-4 py-3">{turma.course?.name ?? EMPTY}</td>
                  <td className="px-4 py-3">{formatShift(turma.shift)}</td>
                  <td className="px-4 py-3">{formatDate(turma.start_date)}</td>
                  <td className="px-4 py-3">{formatDate(turma.end_date)}</td>
                  <td className="px-4 py-3">{turma.students_count ?? 0}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={turma.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ConnectRowActionsMenu
                      ariaLabel={`Ações da turma ${turma.name}`}
                      actions={[
                        viewRowAction(() => setViewId(turma.id)),
                        {
                          key: 'students',
                          label: 'Ver alunos',
                          icon: Users,
                          onClick: () => navigate(`/connect/alunos?class=${turma.id}`),
                        },
                        { key: 'edit', label: 'Editar', icon: Pencil, onClick: () => openEdit(turma) },
                        {
                          key: 'delete',
                          label: 'Excluir',
                          icon: Trash2,
                          variant: 'danger',
                          onClick: () => void handleDelete(turma),
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
        title={editingId ? 'Editar turma' : 'Cadastrar nova turma'}
        subtitle={
          editingId
            ? 'Curso, professor e datas são opcionais — vincule quando quiser.'
            : 'Apenas o nome é obrigatório. Curso, professor e alunos podem ser definidos depois.'
        }
        footer={
          <div className="flex justify-end gap-2">
            <OutlineButton onClick={() => setForm(emptyForm)}>Limpar Campos</OutlineButton>
            <OutlineButton onClick={() => setDrawerOpen(false)}>Cancelar</OutlineButton>
            <PrimaryButton onClick={() => void handleSave()}>{editingId ? 'Salvar' : 'Criar'}</PrimaryButton>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nome da turma" required>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: TURMA AUT25-02"
            />
          </FormField>
          <FormField label="Período">
            <select className={selectClass} value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })}>
              <option value="manha">Manhã</option>
              <option value="tarde">Tarde</option>
              <option value="noite">Noite</option>
            </select>
          </FormField>
          <FormField label="Data de início" hint="Opcional">
            <input type="date" className={inputClass} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </FormField>
          <FormField label="Data de término" hint="Opcional">
            <input type="date" className={inputClass} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </FormField>
          <FormField label="Status">
            <select className={selectClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Ativa</option>
              <option value="inactive">Inativa</option>
            </select>
          </FormField>
          <FormField label="Capacidade máxima" hint="Opcional">
            <input
              type="number"
              className={inputClass}
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              placeholder="Ex: 30"
              min={1}
            />
          </FormField>
          <FormField label="Complemento do período (horário)">
            <input className={inputClass} value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="Ex: 19h00 - 22h30" />
          </FormField>
          <FormField label="Professor responsável" hint="Opcional — vincule depois">
            <select className={selectClass} value={form.connect_teacher_id} onChange={(e) => setForm({ ...form, connect_teacher_id: e.target.value })}>
              <option value="">Sem professor (definir depois)</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Curso" hint="Opcional — vincule depois">
            <select className={selectClass} value={form.connect_course_id} onChange={(e) => setForm({ ...form, connect_course_id: e.target.value })}>
              <option value="">Sem curso (definir depois)</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Descrição">
            <textarea className={`${inputClass} min-h-[80px] py-2 sm:col-span-2`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descreva a turma, objetivos e observações..." />
          </FormField>
        </div>
        <FormField label="Dias da semana">
          <div className="mt-2 flex gap-2">
            {weekDays.map((day, index) => (
              <button
                key={`${day}-${index}`}
                type="button"
                className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm ${index === 2 || index === 3 ? 'border-hub-red bg-hub-red text-white' : 'border-hub-border'}`}
              >
                {day}
              </button>
            ))}
          </div>
        </FormField>
      </ConnectDrawer>

      <ConnectEntityViewDrawer
        kind="class"
        entityId={viewId}
        open={viewId !== null}
        onClose={() => setViewId(null)}
      />
    </div>
  )
}
