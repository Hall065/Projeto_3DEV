import axios from 'axios'
import { CalendarDays, ChevronLeft, ChevronRight, ClipboardCheck, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ConnectDrawer } from '../../components/connect/ConnectDrawer'
import {
  ConnectCard,
  ConnectLoadingSpinner,
  ConnectPageHeader,
  FormField,
  inputClass,
  OutlineButton,
  PrimaryButton,
  selectClass,
} from '../../components/connect/ConnectShared'
import { usePermissions } from '../../hooks/usePermissions'
import { connectService } from '../../services/connectService'
import type { ConnectClass, ConnectLessonSchedule, ConnectTeacher } from '../../types/connect'

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function monthRange(year: number, month: number): { from: string; to: string } {
  const lastDay = new Date(year, month + 1, 0).getDate()
  return {
    from: toIsoDate(year, month, 1),
    to: toIsoDate(year, month, lastDay),
  }
}

const emptyLessonForm = {
  connect_class_id: '',
  connect_teacher_id: '',
  scheduled_date: '',
  start_time: '19:00',
  end_time: '22:00',
  subject: 'Aula regular',
  lessons_count: '4',
  notes: '',
}

export function CalendarPage() {
  const { can } = usePermissions()
  const canManage = can('connect.calendar.manage') || can('connect.classes.manage')

  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [lessons, setLessons] = useState<ConnectLessonSchedule[]>([])
  const [classes, setClasses] = useState<ConnectClass[]>([])
  const [teachers, setTeachers] = useState<ConnectTeacher[]>([])
  const [classFilter, setClassFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(today.toISOString().slice(0, 10))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<ConnectLessonSchedule | null>(null)
  const [form, setForm] = useState(emptyLessonForm)
  const [error, setError] = useState<string | null>(null)

  const range = useMemo(() => monthRange(viewYear, viewMonth), [viewYear, viewMonth])

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    const params: Record<string, string | number> = { from: range.from, to: range.to }
    if (classFilter) params.connect_class_id = classFilter

    connectService
      .getCalendar(params)
      .then(setLessons)
      .catch(() => setError('Nao foi possivel carregar o calendario.'))
      .finally(() => setLoading(false))
  }, [range.from, range.to, classFilter])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    connectService.getClasses({ per_page: 100 }).then((r) => setClasses(r.data))
    connectService.getTeachers({ per_page: 100 }).then((r) => setTeachers(r.data))
  }, [])

  const lessonsByDate = useMemo(() => {
    const map = new Map<string, ConnectLessonSchedule[]>()
    lessons.forEach((lesson) => {
      const key = lesson.scheduled_date
      const list = map.get(key) ?? []
      list.push(lesson)
      map.set(key, list.sort((a, b) => a.start_time.localeCompare(b.start_time)))
    })
    return map
  }, [lessons])

  const calendarCells = useMemo(() => {
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const cells: Array<{ date: string | null; day: number | null }> = []

    for (let i = 0; i < firstWeekday; i++) {
      cells.push({ date: null, day: null })
    }
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ date: toIsoDate(viewYear, viewMonth, day), day })
    }
    return cells
  }, [viewYear, viewMonth])

  const selectedLessons = lessonsByDate.get(selectedDate) ?? []

  const openCreate = (date?: string) => {
    setEditingLesson(null)
    setForm({
      ...emptyLessonForm,
      scheduled_date: date ?? selectedDate,
      connect_class_id: classFilter,
    })
    setDrawerOpen(true)
  }

  const openEdit = (lesson: ConnectLessonSchedule) => {
    setEditingLesson(lesson)
    setForm({
      connect_class_id: String(lesson.connect_class_id),
      connect_teacher_id: String(lesson.connect_teacher_id ?? ''),
      scheduled_date: lesson.scheduled_date,
      start_time: lesson.start_time,
      end_time: lesson.end_time,
      subject: lesson.subject,
      lessons_count: String(lesson.lessons_count),
      notes: lesson.notes ?? '',
    })
    setDrawerOpen(true)
  }

  const handleSave = async () => {
    if (!form.connect_class_id || !form.scheduled_date) {
      window.alert('Informe turma e data.')
      return
    }

    const payload: Record<string, unknown> = {
      connect_class_id: Number(form.connect_class_id),
      connect_teacher_id: form.connect_teacher_id ? Number(form.connect_teacher_id) : null,
      scheduled_date: form.scheduled_date,
      start_time: form.start_time,
      end_time: form.end_time,
      subject: form.subject,
      lessons_count: Number(form.lessons_count) || 4,
      notes: form.notes || null,
    }

    try {
      if (editingLesson) {
        await connectService.updateCalendarLesson(editingLesson.id, payload)
      } else {
        await connectService.createCalendarLesson(payload)
      }
      setDrawerOpen(false)
      load()
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.message as string | undefined) ?? 'Erro ao salvar aula.'
        : 'Erro ao salvar aula.'
      window.alert(message)
    }
  }

  const handleDelete = async (lesson: ConnectLessonSchedule) => {
    if (!window.confirm('Remover esta aula do calendario?')) return
    try {
      await connectService.deleteCalendarLesson(lesson.id)
      load()
    } catch {
      window.alert('Nao foi possivel remover a aula.')
    }
  }

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
  }

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Calendario"
        subtitle="Aulas por turma, professor e semestre — alinhado a frequencia."
        actions={
          canManage ? (
            <PrimaryButton onClick={() => openCreate()}>
              <Plus className="h-4 w-4" />
              Nova aula
            </PrimaryButton>
          ) : undefined
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <ConnectCard className="p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <OutlineButton onClick={() => shiftMonth(-1)} aria-label="Mes anterior">
                <ChevronLeft className="h-4 w-4" />
              </OutlineButton>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <CalendarDays className="h-5 w-5 text-hub-red" />
                {MONTH_LABELS[viewMonth]} {viewYear}
              </h2>
              <OutlineButton onClick={() => shiftMonth(1)} aria-label="Proximo mes">
                <ChevronRight className="h-4 w-4" />
              </OutlineButton>
            </div>
            <select
              className={`${selectClass} max-w-xs`}
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="">Todas as turmas</option>
              {classes.map((turma) => (
                <option key={turma.id} value={turma.id}>
                  {turma.name}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          {loading ? (
            <ConnectLoadingSpinner label="Carregando calendario..." />
          ) : (
            <>
              <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-hub-text-muted">
                {WEEKDAY_LABELS.map((label) => (
                  <div key={label}>{label}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((cell, index) => {
                  if (!cell.date) {
                    return <div key={`empty-${index}`} className="min-h-[88px] rounded-lg bg-transparent" />
                  }
                  const dayLessons = lessonsByDate.get(cell.date) ?? []
                  const isSelected = cell.date === selectedDate
                  const isToday = cell.date === today.toISOString().slice(0, 10)

                  return (
                    <button
                      key={cell.date}
                      type="button"
                      onClick={() => setSelectedDate(cell.date!)}
                      className={`min-h-[88px] rounded-lg border p-1.5 text-left transition ${
                        isSelected
                          ? 'border-hub-red bg-hub-red/10'
                          : isToday
                            ? 'border-hub-red/40 bg-hub-surface'
                            : 'border-hub-border/50 bg-hub-surface/60 hover:border-hub-red/30'
                      }`}
                    >
                      <span className="text-xs font-semibold">{cell.day}</span>
                      <div className="mt-1 space-y-0.5">
                        {dayLessons.slice(0, 2).map((lesson) => (
                          <div
                            key={lesson.id}
                            className="truncate rounded bg-hub-red/15 px-1 py-0.5 text-[10px] leading-tight text-hub-text"
                            title={`${lesson.start_time} ${lesson.class?.name ?? ''}`}
                          >
                            {lesson.start_time} {lesson.class?.code ?? lesson.class?.name}
                          </div>
                        ))}
                        {dayLessons.length > 2 && (
                          <div className="text-[10px] text-hub-text-muted">+{dayLessons.length - 2} aulas</div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </ConnectCard>

        <ConnectCard className="p-4">
          <h3 className="mb-3 text-base font-semibold">
            Aulas em {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')}
          </h3>
          {selectedLessons.length === 0 ? (
            <p className="text-sm text-hub-text-muted">Nenhuma aula agendada neste dia.</p>
          ) : (
            <ul className="space-y-3">
              {selectedLessons.map((lesson) => (
                <li key={lesson.id} className="rounded-lg border border-hub-border/60 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{lesson.class?.name ?? `Turma #${lesson.connect_class_id}`}</p>
                      <p className="text-sm text-hub-text-muted">
                        {lesson.start_time} – {lesson.end_time} · {lesson.lessons_count} aula(s)
                      </p>
                      <p className="text-sm">{lesson.subject}</p>
                      {lesson.teacher?.full_name && (
                        <p className="text-xs text-hub-text-muted">Prof. {lesson.teacher.full_name}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <Link
                        to={`/connect/frequencia?class=${lesson.connect_class_id}&date=${lesson.scheduled_date}&lesson=${lesson.id}`}
                        className="inline-flex items-center gap-1 rounded-md border border-hub-border px-2 py-1 text-xs hover:border-hub-red"
                      >
                        <ClipboardCheck className="h-3.5 w-3.5" />
                        Frequencia
                      </Link>
                      {canManage && (
                        <>
                          <button
                            type="button"
                            className="text-xs text-hub-text-muted hover:text-hub-red"
                            onClick={() => openEdit(lesson)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-xs text-red-600"
                            onClick={() => void handleDelete(lesson)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remover
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {canManage && (
            <div className="mt-4">
              <OutlineButton onClick={() => openCreate(selectedDate)}>Agendar aula neste dia</OutlineButton>
            </div>
          )}
        </ConnectCard>
      </div>

      <ConnectDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingLesson ? 'Editar aula' : 'Agendar aula'}
        subtitle="Horarios nao podem conflitar na mesma turma ou para o mesmo professor."
        footer={
          <div className="flex justify-end gap-2">
            <OutlineButton onClick={() => setDrawerOpen(false)}>Cancelar</OutlineButton>
            <PrimaryButton onClick={() => void handleSave()}>Salvar</PrimaryButton>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Turma" required>
            <select
              className={selectClass}
              value={form.connect_class_id}
              onChange={(e) => setForm({ ...form, connect_class_id: e.target.value })}
            >
              <option value="">Selecione</option>
              {classes.map((turma) => (
                <option key={turma.id} value={turma.id}>
                  {turma.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Professor">
            <select
              className={selectClass}
              value={form.connect_teacher_id}
              onChange={(e) => setForm({ ...form, connect_teacher_id: e.target.value })}
            >
              <option value="">Professor da turma</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Data" required>
            <input
              type="date"
              className={inputClass}
              value={form.scheduled_date}
              onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
            />
          </FormField>
          <FormField label="Disciplina / assunto">
            <input
              className={inputClass}
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </FormField>
          <FormField label="Inicio">
            <input
              type="time"
              className={inputClass}
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            />
          </FormField>
          <FormField label="Fim">
            <input
              type="time"
              className={inputClass}
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
            />
          </FormField>
          <FormField label="Aulas (carga do dia)">
            <select
              className={selectClass}
              value={form.lessons_count}
              onChange={(e) => setForm({ ...form, lessons_count: e.target.value })}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Observacoes">
              <textarea
                className={`${inputClass} min-h-[72px] py-2`}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </FormField>
          </div>
        </div>
      </ConnectDrawer>
    </div>
  )
}
