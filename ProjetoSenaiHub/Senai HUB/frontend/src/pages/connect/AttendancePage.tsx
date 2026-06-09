import { Download, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { parseApiError } from '../../utils/parseApiError'
import type {
  ConnectAttendanceMark,
  ConnectAttendanceSession,
  ConnectClass,
  ConnectClassAttendanceSummary,
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

export function AttendancePage() {
  const { t } = useTranslation()
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
  const [classSummary, setClassSummary] = useState<ConnectClassAttendanceSummary | null>(null)

  useEffect(() => {
    connectService.getClasses({ per_page: 50 }).then((r) => setClasses(r.data))
  }, [])

  useEffect(() => {
    if (!classId) {
      setClassSummary(null)
      return
    }
    connectService
      .getClassAttendanceSummary({ connect_class_id: Number(classId) })
      .then(setClassSummary)
      .catch(() => setClassSummary(null))
  }, [classId])

  useEffect(() => {
    if (!classId || !date) {
      setScheduledLessons([])
      return
    }
    connectService
      .getCalendar({ from: date, to: date, connect_class_id: classId })
      .then((lessons) => {
        setScheduledLessons(lessons)
        if (!lessonId && lessons.length === 1) {
          setLessonId(String(lessons[0].id))
        }
      })
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
        setLoadError(parseApiError(error, t('connect.attendance.alert.loadError')))
      })
      .finally(() => setLoading(false))
  }, [classId, date, lessonId, t])

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
    } catch (err: unknown) {
      window.alert(parseApiError(err, t('connect.attendance.alert.exportError')))
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
    } catch (err: unknown) {
      window.alert(parseApiError(err, t('connect.attendance.alert.loadError')))
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
              title={`${t('connect.calendar.form.lessons')} ${n}`}
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
        title={t('connect.attendance.title')}
        subtitle={t('connect.attendance.subtitle')}
        actions={
          <>
            <OutlineButton type="button" onClick={handleExport} disabled={exporting || !classId}>
              <Download className="h-4 w-4" /> {exporting ? t('connect.attendance.actions.exporting') : t('connect.attendance.actions.export')}
            </OutlineButton>
            <Link
              to="/connect/planilhas"
              className="inline-flex items-center gap-2 rounded-lg border border-hub-border px-4 py-2 text-sm font-medium text-hub-navy transition hover:bg-hub-bg"
            >
              <Download className="h-4 w-4" /> {t('connect.attendance.actions.spreadsheets')}
            </Link>
            <PrimaryButton onClick={handleSave} disabled={saving || !session}>
              <Save className="h-4 w-4" /> {saving ? t('connect.attendance.actions.saving') : t('connect.attendance.actions.save')}
            </PrimaryButton>
          </>
        }
      />

      {classSummary && (
        <ConnectCard className="mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-hub-text-muted">{t('connect.attendance.summary.scheduledLessons')}</p>
            <p className="text-lg font-semibold text-hub-navy">{classSummary.total_scheduled_lessons}</p>
          </div>
          <div>
            <p className="text-xs text-hub-text-muted">{t('connect.attendance.summary.sessionsClosed')}</p>
            <p className="text-lg font-semibold text-emerald-600">{classSummary.attendance_sessions_closed}</p>
          </div>
          <div>
            <p className="text-xs text-hub-text-muted">{t('connect.attendance.summary.sessionsOpen')}</p>
            <p className="text-lg font-semibold text-amber-600">{classSummary.attendance_sessions_open}</p>
          </div>
          <div>
            <p className="text-xs text-hub-text-muted">{t('connect.attendance.summary.classPresence')}</p>
            <p className="text-lg font-semibold text-hub-navy">{classSummary.presence_rate}%</p>
          </div>
        </ConnectCard>
      )}

      <ConnectCard className="mb-4 p-4">
        <h3 className="mb-4 font-semibold text-hub-navy">{t('connect.attendance.registerSection')}</h3>
        <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField label={t('connect.attendance.form.class')}>
            <select className={selectClass} value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">{t('connect.attendance.options.selectClass')}</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label={t('connect.attendance.form.date')}>
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
          <FormField
            label={t('connect.attendance.form.calendarLesson')}
            hint={scheduledLessons.length ? t('connect.attendance.hints.selectTime') : t('connect.attendance.hints.manualMode')}
          >
            <select
              className={selectClass}
              value={lessonId}
              onChange={(e) => setLessonId(e.target.value)}
            >
              <option value="">{t('connect.attendance.options.manual')}</option>
              {scheduledLessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.start_time}–{lesson.end_time} · {lesson.subject} ({t('connect.classes.weekly.lessons', { count: lesson.lessons_count })})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label={t('connect.attendance.form.lessonsPerDay')}>
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
            {t('connect.attendance.viewCalendar')}
          </Link>
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3 text-xs text-hub-text-muted sm:gap-4">
            <span>
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" /> {t('connect.attendance.legend.present')}
            </span>
            <span>
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-500" /> {t('connect.attendance.legend.justified')}
            </span>
            <span>
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-red-500" /> {t('connect.attendance.legend.unjustified')}
            </span>
          </div>
          <PrimaryButton onClick={setAllPresent}>{t('connect.attendance.actions.allPresent')}</PrimaryButton>
        </div>
        {scheduledLessons.length > 1 && !lessonId && (
          <p className="mt-2 text-sm text-amber-700">{t('connect.attendance.hints.pickLessonSlot')}</p>
        )}
        {session?.stats && (
          <p className="mt-3 text-xs text-hub-text-muted">
            {t('connect.attendance.sessionStats', {
              present: session.stats.present,
              justified: session.stats.justified,
              absent: session.stats.absent,
              rate: session.stats.presence_rate,
            })}
          </p>
        )}
        {session?.session_date && (
          <p className="mt-1 text-xs text-hub-text-muted">
            {session.session_date}
            {session.lesson_schedule ? ` · ${session.lesson_schedule.start_time}–${session.lesson_schedule.end_time}` : ''}
            {' '}· {t('connect.classes.weekly.lessons', { count: lessons })}
            {session.connect_lesson_schedule_id ? ` · ${t('connect.attendance.hints.selectTime')}` : ` · ${t('connect.attendance.options.manual')}`}.
          </p>
        )}
      </ConnectCard>

      <ConnectCard>
        {loading ? (
          <ConnectLoadingSpinner label={t('connect.attendance.states.loading')} className="min-h-[280px]" />
        ) : !classId ? (
          <p className="px-4 py-12 text-center text-sm text-hub-text-muted sm:px-6">
            {t('connect.attendance.states.selectClass')}
          </p>
        ) : loadError ? (
          <p className="px-4 py-12 text-center text-sm text-red-600 sm:px-6">{loadError}</p>
        ) : !session?.marks?.length ? (
          <p className="px-4 py-12 text-center text-sm text-hub-text-muted sm:px-6">
            {t('connect.attendance.states.noStudents')}
          </p>
        ) : (
          <ConnectTableScroll>
            <table className="w-full min-w-[560px] text-sm">
              <thead className="glass-thead text-hub-text-muted">
                <tr>
                  <th className="px-4 py-3 text-left">{t('connect.attendance.table.number')}</th>
                  <th className="px-4 py-3 text-left">{t('connect.attendance.table.student')}</th>
                  <th className="px-4 py-3 text-left">{t('connect.attendance.table.missedLessons')}</th>
                  <th className="px-4 py-3 text-left">{t('connect.attendance.table.situation')}</th>
                  <th className="px-4 py-3 text-left">{t('connect.attendance.table.absences')}</th>
                </tr>
              </thead>
              <tbody>
                {session?.marks?.map((mark: ConnectAttendanceMark, index: number) => (
                    <tr key={mark.id} className="border-t border-hub-border/40">
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3 font-medium">{mark.student?.full_name ?? '-'}</td>
                      <td className="px-4 py-3">{renderLessonToggles(mark.connect_student_id)}</td>
                      <td className="px-4 py-3">{renderMarkButtons(mark.connect_student_id)}</td>
                      <td className="px-4 py-3 text-xs text-hub-text-muted">
                        {mark.absence_summary
                          ? t('connect.attendance.absenceSummary', {
                              total: mark.absence_summary.unjustified_lessons_total,
                              remaining: mark.absence_summary.remaining_absences ?? '—',
                            })
                          : '—'}
                      </td>
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
