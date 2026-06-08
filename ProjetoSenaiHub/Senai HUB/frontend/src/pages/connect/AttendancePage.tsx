import axios from 'axios'
import { Download, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ConnectCard,
  ConnectLoadingSpinner,
  ConnectPageHeader,
  ConnectTableScroll,
  FormField,
  inputClass,
  OutlineButton,
  PrimaryButton,
  selectClass,
} from '../../components/connect/ConnectShared'
import { connectService } from '../../services/connectService'
import { spreadsheetService } from '../../services/spreadsheetService'
import type {
  ConnectAttendanceMark,
  ConnectAttendanceSession,
  ConnectClass,
  ConnectLessonSchedule,
} from '../../types/connect'

type MarkStatus = 'present' | 'justified' | 'absent'

type StudentMarkState = {
  status: MarkStatus
  missed_lessons: number
}

const MAX_LESSONS_PER_DAY = 5
const LESSON_OPTIONS = [1, 2, 3, 4, 5] as const

const statusMap: Record<MarkStatus, string> = { present: 'P', justified: 'FJ', absent: 'FI' }
const apiStatus: Record<MarkStatus, string> = { present: 'present', justified: 'justified', absent: 'absent' }

function clampLessons(value: number): number {
  return Math.min(MAX_LESSONS_PER_DAY, Math.max(1, value))
}

function emptyMarkState(): StudentMarkState {
  return { status: 'present', missed_lessons: 0 }
}

function attendanceLoadErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return 'Nao foi possivel carregar os alunos.'
  }
  if (!error.response) {
    return 'Nao foi possivel conectar ao servidor. Confira se o backend esta rodando (php artisan serve --host=127.0.0.1 --port=8000).'
  }
  if (error.response.status === 401) {
    return 'Sessao expirada ou nao autenticado. Faca login novamente.'
  }
  if (error.response.status >= 500) {
    return 'Erro no servidor ao carregar a frequencia. Execute php artisan migrate no backend.'
  }
  const message = error.response.data?.message
  return typeof message === 'string' ? message : 'Nao foi possivel carregar os alunos.'
}

export function AttendancePage() {
  const [searchParams] = useSearchParams()
  const [classes, setClasses] = useState<ConnectClass[]>([])
  const [classId, setClassId] = useState(searchParams.get('class') ?? '')
  const [lessonId, setLessonId] = useState(searchParams.get('lesson') ?? '')
  const [scheduledLessons, setScheduledLessons] = useState<ConnectLessonSchedule[]>([])
  const [session, setSession] = useState<ConnectAttendanceSession | null>(null)
  const [marks, setMarks] = useState<Record<number, StudentMarkState>>({})
  const [date, setDate] = useState(searchParams.get('date') ?? new Date().toISOString().slice(0, 10))
  const [lessons, setLessons] = useState(4)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    connectService.getClasses({ per_page: 50 }).then((r) => setClasses(r.data))
  }, [])

  useEffect(() => {
    if (!classId || !date) {
      setScheduledLessons([])
      return
    }
    connectService
      .getCalendar({ from: date, to: date, connect_class_id: classId })
      .then(setScheduledLessons)
      .catch(() => setScheduledLessons([]))
  }, [classId, date])

  useEffect(() => {
    if (!classId) {
      setSession(null)
      setMarks({})
      setLoading(false)
      return
    }

    setLoading(true)
    setLoadError(null)
    const params: Record<string, string | number> = lessonId
      ? { connect_lesson_schedule_id: lessonId }
      : { connect_class_id: classId, session_date: date }

    connectService
      .getAttendanceSession(params)
      .then((data) => {
        setSession(data)
        const lessonCount = clampLessons(
          data.lessons_count ?? data.attendance_settings?.default_lessons_per_day ?? 4,
        )
        setLessons(lessonCount)

        const initial: Record<number, StudentMarkState> = {}
        data.marks?.forEach((mark) => {
          const status: MarkStatus =
            mark.status === 'justified' ? 'justified' : mark.status === 'absent' ? 'absent' : 'present'

          initial[mark.connect_student_id] = {
            status,
            missed_lessons: Math.min(
              mark.missed_lessons ?? (status === 'absent' ? lessonCount : 0),
              lessonCount,
            ),
          }
        })
        setMarks(initial)
      })
      .catch((error) => {
        setSession(null)
        setMarks({})
        setLoadError(attendanceLoadErrorMessage(error))
      })
      .finally(() => setLoading(false))
  }, [classId, date, lessonId])

  useEffect(() => {
    setMarks((prev) => {
      let changed = false
      const next = { ...prev }
      for (const [id, mark] of Object.entries(next)) {
        if (mark.missed_lessons > lessons) {
          next[Number(id)] = { ...mark, missed_lessons: lessons }
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [lessons])

  const updateMark = (studentId: number, patch: Partial<StudentMarkState>) => {
    setMarks((prev) => {
      const current = prev[studentId] ?? emptyMarkState()
      const next = { ...current, ...patch }

      if (patch.status === 'present') {
        next.missed_lessons = 0
      } else if (patch.status === 'absent' && patch.missed_lessons === undefined) {
        next.missed_lessons = lessons
      }

      next.missed_lessons = Math.min(Math.max(0, next.missed_lessons), lessons)

      return { ...prev, [studentId]: next }
    })
  }

  const setAllPresent = () => {
    const next: Record<number, StudentMarkState> = {}
    session?.marks?.forEach((m) => {
      next[m.connect_student_id] = {
        ...(marks[m.connect_student_id] ?? emptyMarkState()),
        status: 'present',
        missed_lessons: 0,
      }
    })
    setMarks(next)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const params: Record<string, string> = {}
      if (classId) params.connect_class_id = classId
      if (date) {
        params.from_date = date
        params.to_date = date
      }
      await spreadsheetService.exportData('connect', 'attendance', params)
    } catch {
      window.alert('Nao foi possivel exportar a frequencia.')
    } finally {
      setExporting(false)
    }
  }

  const handleSave = async () => {
    if (!session) return
    setSaving(true)
    try {
      const payload = Object.entries(marks).map(([studentId, mark]) => ({
        connect_student_id: Number(studentId),
        status: apiStatus[mark.status],
        missed_lessons: mark.missed_lessons,
      }))

      const updated = await connectService.saveAttendanceMarks(session.id, {
        marks: payload,
        lessons_count: lessons,
        default_lessons_per_day: lessons,
      })
      setSession(updated)
    } finally {
      setSaving(false)
    }
  }

  const renderLessonToggles = (studentId: number) => {
    const mark = marks[studentId] ?? emptyMarkState()
    if (mark.status === 'present') {
      return <span className="text-xs text-hub-text-muted">—</span>
    }

    return (
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: lessons }, (_, i) => i + 1).map((n) => {
          const missed = mark.missed_lessons >= n
          return (
            <button
              key={n}
              type="button"
              title={`Aula ${n}`}
              onClick={() => {
                const current = mark.missed_lessons
                updateMark(studentId, { missed_lessons: current >= n ? n - 1 : n })
              }}
              className={`h-8 min-w-8 rounded-lg border px-2 text-xs font-bold ${
                missed
                  ? 'border-red-500 bg-red-50 text-red-600'
                  : 'surface-inset border-hub-border text-hub-text-muted'
              }`}
            >
              {missed ? 'X' : n}
            </button>
          )
        })}
      </div>
    )
  }

  const renderMarkButtons = (studentId: number) => (
    <div className="flex gap-1">
      {(['present', 'justified', 'absent'] as MarkStatus[]).map((status) => (
        <button
          key={status}
          type="button"
          onClick={() => updateMark(studentId, { status })}
          className={`h-7 w-7 rounded text-xs font-bold ${
            (marks[studentId]?.status ?? 'present') === status
              ? status === 'present'
                ? 'bg-emerald-500 text-white'
                : status === 'justified'
                  ? 'bg-amber-500 text-white'
                  : 'border-2 border-red-500 text-red-600'
              : 'bg-hub-bg text-hub-text-muted'
          }`}
        >
          {statusMap[status]}
        </button>
      ))}
    </div>
  )

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Frequencia"
        subtitle="Vincule a chamada as aulas do calendario ou registre manualmente por data."
        actions={
          <>
            <OutlineButton type="button" onClick={handleExport} disabled={exporting || !classId}>
              <Download className="h-4 w-4" /> {exporting ? 'Exportando...' : 'Exportar'}
            </OutlineButton>
            <Link
              to="/connect/planilhas"
              className="inline-flex items-center gap-2 rounded-lg border border-hub-border px-4 py-2 text-sm font-medium text-hub-navy transition hover:bg-hub-bg"
            >
              <Download className="h-4 w-4" /> Planilhas
            </Link>
            <PrimaryButton onClick={handleSave} disabled={saving || !session}>
              <Save className="h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar'}
            </PrimaryButton>
          </>
        }
      />

      <ConnectCard className="mb-4 p-4">
        <h3 className="mb-4 font-semibold text-hub-navy">Registrar frequencia</h3>
        <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField label="Turma">
            <select className={selectClass} value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Selecione a turma</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Data">
            <input
              type="date"
              className={inputClass}
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                setLessonId('')
              }}
            />
          </FormField>
          <FormField label="Aula no calendario" hint={scheduledLessons.length ? 'Selecione o horario agendado' : 'Sem aulas agendadas — modo manual'}>
            <select
              className={selectClass}
              value={lessonId}
              onChange={(e) => setLessonId(e.target.value)}
            >
              <option value="">Chamada manual (sem horario)</option>
              {scheduledLessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.start_time}–{lesson.end_time} · {lesson.subject} ({lesson.lessons_count} aula(s))
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Aulas no dia">
            <div className="flex flex-wrap gap-2">
              {LESSON_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={Boolean(lessonId)}
                  onClick={() => setLessons(n)}
                  className={`h-9 w-9 rounded-lg border text-sm font-medium disabled:opacity-50 ${
                    lessons === n ? 'border-hub-red text-hub-red' : 'border-hub-border'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </FormField>
        </div>
        <p className="mt-2 text-xs text-hub-text-muted">
          <Link to="/connect/calendario" className="text-hub-red hover:underline">
            Ver calendario completo
          </Link>
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3 text-xs text-hub-text-muted sm:gap-4">
            <span>
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" /> P Presente
            </span>
            <span>
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-500" /> FJ Falta justificada
            </span>
            <span>
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-red-500" /> FI Falta injustificada
            </span>
          </div>
          <PrimaryButton onClick={setAllPresent}>Todos presentes</PrimaryButton>
        </div>
        {session?.session_date && (
          <p className="mt-3 text-xs text-hub-text-muted">
            Registro do dia {session.session_date}
            {session.lesson_schedule ? ` · ${session.lesson_schedule.start_time}–${session.lesson_schedule.end_time}` : ''}
            {' '}· {lessons} aula(s)
            {session.connect_lesson_schedule_id ? ' · vinculado ao calendario' : ' · chamada manual'}.
          </p>
        )}
      </ConnectCard>

      <ConnectCard>
        {loading ? (
          <ConnectLoadingSpinner label="Carregando lista de frequencia..." className="min-h-[280px]" />
        ) : !classId ? (
          <p className="px-4 py-12 text-center text-sm text-hub-text-muted sm:px-6">
            Selecione uma turma e a data para carregar os alunos.
          </p>
        ) : loadError ? (
          <p className="px-4 py-12 text-center text-sm text-red-600 sm:px-6">{loadError}</p>
        ) : !session?.marks?.length ? (
          <p className="px-4 py-12 text-center text-sm text-hub-text-muted sm:px-6">
            Esta turma nao possui alunos cadastrados no Connect.
          </p>
        ) : (
          <ConnectTableScroll>
            <table className="w-full min-w-[560px] text-sm">
              <thead className="glass-thead text-hub-text-muted">
                <tr>
                  <th className="px-4 py-3 text-left">No</th>
                  <th className="px-4 py-3 text-left">Aluno</th>
                  <th className="px-4 py-3 text-left">Aulas faltadas no dia</th>
                  <th className="px-4 py-3 text-left">Situacao</th>
                </tr>
              </thead>
              <tbody>
                {session?.marks?.map((mark: ConnectAttendanceMark, index: number) => (
                    <tr key={mark.id} className="border-t border-hub-border/40">
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3 font-medium">{mark.student?.full_name ?? '-'}</td>
                      <td className="px-4 py-3">{renderLessonToggles(mark.connect_student_id)}</td>
                      <td className="px-4 py-3">{renderMarkButtons(mark.connect_student_id)}</td>
                    </tr>
                ))}
              </tbody>
            </table>
          </ConnectTableScroll>
        )}
      </ConnectCard>
    </div>
  )
}
