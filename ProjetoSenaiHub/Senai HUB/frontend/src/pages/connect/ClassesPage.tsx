import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ConnectDrawer } from '../../components/connect/ConnectDrawer'
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
  const [classes, setClasses] = useState<ConnectClass[]>([])
  const [courses, setCourses] = useState<ConnectCourse[]>([])
  const [teachers, setTeachers] = useState<ConnectTeacher[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | undefined>()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
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
    setForm(emptyForm)
    setDrawerOpen(true)
  }

  const handleCreate = async () => {
    await connectService.createClass({
      name: form.name,
      connect_course_id: Number(form.connect_course_id),
      connect_teacher_id: form.connect_teacher_id ? Number(form.connect_teacher_id) : undefined,
      shift: form.shift,
      start_date: form.start_date,
      end_date: form.end_date,
      capacity: Number(form.capacity),
      status: form.status,
      code: form.name.replace(/\s+/g, '-').toUpperCase(),
    })
    setDrawerOpen(false)
    load()
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
            <thead className="bg-hub-bg/60 text-hub-text-muted">
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
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Pencil className="h-4 w-4 text-hub-text-muted" />
                      <Trash2 className="h-4 w-4 text-hub-text-muted" />
                    </div>
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
        onClose={() => setDrawerOpen(false)}
        title="Cadastrar nova turma"
        subtitle="Preencha os dados para criar uma nova turma."
        footer={
          <div className="flex justify-end gap-2">
            <OutlineButton onClick={() => setForm(emptyForm)}>Limpar Campos</OutlineButton>
            <OutlineButton onClick={() => setDrawerOpen(false)}>Cancelar</OutlineButton>
            <PrimaryButton onClick={handleCreate}>Criar</PrimaryButton>
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
          <FormField label="Período" required>
            <select className={selectClass} value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })}>
              <option value="manha">Manhã</option>
              <option value="tarde">Tarde</option>
              <option value="noite">Noite</option>
            </select>
          </FormField>
          <FormField label="Data de início" required hint="Clique para abrir o calendário">
            <input type="date" className={inputClass} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </FormField>
          <FormField label="Data de término" required hint="Clique para abrir o calendário">
            <input type="date" className={inputClass} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </FormField>
          <FormField label="Status" required>
            <select className={selectClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Ativa</option>
              <option value="inactive">Inativa</option>
            </select>
          </FormField>
          <FormField label="Quantidade de alunos" required>
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
          <FormField label="Professor responsável" required>
            <select className={selectClass} value={form.connect_teacher_id} onChange={(e) => setForm({ ...form, connect_teacher_id: e.target.value })}>
              <option value="">Selecione o professor</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Curso" required>
            <select className={selectClass} value={form.connect_course_id} onChange={(e) => setForm({ ...form, connect_course_id: e.target.value })}>
              <option value="">Selecione o curso</option>
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
    </div>
  )
}
