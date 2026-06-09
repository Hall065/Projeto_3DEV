import { CalendarDays, ChevronLeft, ChevronRight, LayoutGrid, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarWeekGrid, getWeekDays, weekRangeFromAnchor } from '../../components/connect/CalendarWeekGrid'
import { ConnectDrawer } from '../../components/connect/ConnectDrawer'
import { LessonDetailModal } from '../../components/connect/LessonDetailModal'
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
import { ClassSchedulePanel } from '../../components/connect/ClassSchedulePanel'
import { usePermissions } from '../../hooks/usePermissions'
import { connectService } from '../../services/connectService'
import { parseApiError } from '../../utils/parseApiError'
import type { ConnectClass, ConnectLessonSchedule, ConnectTeacher } from '../../types/connect'

type ViewMode = 'week' | 'month'

const WEEKDAY_KEYS = ['0', '1', '2', '3', '4', '5', '6'] as const

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
  const { t, i18n } = useTranslation()
  const { can, role } = usePermissions()
  const canManage = can('connect.calendar.manage') || can('connect.classes.manage')
  const canAttendance = can('connect.attendance.manage') || can('connect.attendance.view_own')

  const today = new Date()
  const todayIso = today.toISOString().slice(0, 10)

  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [weekAnchor, setWeekAnchor] = useState(new Date())
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [lessons, setLessons] = useState<ConnectLessonSchedule[]>([])
  const [classes, setClasses] = useState<ConnectClass[]>([])
  const [teachers, setTeachers] = useState<ConnectTeacher[]>([])
  const [classFilter, setClassFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [semesters, setSemesters] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(todayIso)
  const [detailLesson, setDetailLesson] = useState<ConnectLessonSchedule | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<ConnectLessonSchedule | null>(null)
  const [form, setForm] = useState(emptyLessonForm)
  const [error, setError] = useState<string | null>(null)

  const range = useMemo(() => {
    if (viewMode === 'week') return weekRangeFromAnchor(weekAnchor)
    return monthRange(viewYear, viewMonth)
  }, [viewMode, weekAnchor, viewYear, viewMonth])

  const weekDays = useMemo(() => getWeekDays(weekAnchor, todayIso), [weekAnchor, todayIso])

  const weekLabel = useMemo(() => {
    const start = new Date(`${weekDays[0].date}T12:00:00`)
    const end = new Date(`${weekDays[6].date}T12:00:00`)
    const sameMonth = start.getMonth() === end.getMonth()
    const startFmt = start.toLocaleDateString(i18n.language, { day: 'numeric', month: sameMonth ? undefined : 'short' })
    const endFmt = end.toLocaleDateString(i18n.language, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    return `${startFmt} – ${endFmt}`
  }, [weekDays, i18n.language])

  const monthLabel = useMemo(() => {
    const label = new Date(viewYear, viewMonth, 1).toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })
    return label.charAt(0).toUpperCase() + label.slice(1)
  }, [viewYear, viewMonth, i18n.language])

  const scopeHint = useMemo(() => {
    if (canManage) return t('connect.calendar.scope.admin')
    if (role === 'connect_professor') return t('connect.calendar.scope.professor')
    if (role === 'connect_aluno') return t('connect.calendar.scope.student')
    return null
  }, [canManage, role, t])

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    const params: Record<string, string | number> = { from: range.from, to: range.to }
    if (classFilter) params.connect_class_id = classFilter
    if (semesterFilter) params.semester = semesterFilter

    connectService
      .getCalendar(params)
      .then(setLessons)
      .catch((err) => setError(parseApiError(err, t('connect.calendar.loadError'))))
      .finally(() => setLoading(false))
  }, [range.from, range.to, classFilter, semesterFilter, t])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    connectService.getClasses({ per_page: 100 }).then((r) => setClasses(r.data))
    if (canManage) {
      connectService.getTeachers({ per_page: 100 }).then((r) => setTeachers(r.data))
    }
    connectService.getCalendarSemesters().then(setSemesters).catch(() => setSemesters([]))
  }, [canManage])

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

  const openCreate = (date?: string) => {
    setEditingLesson(null)
    setForm({
      ...emptyLessonForm,
      scheduled_date: date ?? selectedDate,
      connect_class_id: classFilter,
      subject: t('connect.classes.defaultSubject'),
    })
    setDrawerOpen(true)
  }

  const openEdit = (lesson: ConnectLessonSchedule) => {
    setDetailLesson(null)
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
      window.alert(t('connect.calendar.alert.classDateRequired'))
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
    } catch (err: unknown) {
      window.alert(parseApiError(err, t('connect.calendar.alert.saveError')))
    }
  }

  const handleDelete = async (lesson: ConnectLessonSchedule) => {
    if (!window.confirm(t('connect.calendar.alert.removeConfirm'))) return
    try {
      await connectService.deleteCalendarLesson(lesson.id)
      setDetailLesson(null)
      load()
    } catch (err: unknown) {
      window.alert(parseApiError(err, t('connect.calendar.alert.saveError')))
    }
  }

  const shiftWeek = (delta: number) => {
    const next = new Date(weekAnchor)
    next.setDate(next.getDate() + delta * 7)
    setWeekAnchor(next)
  }

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
  }

  const goToToday = () => {
    const now = new Date()
    setWeekAnchor(now)
    setViewYear(now.getFullYear())
    setViewMonth(now.getMonth())
    setSelectedDate(todayIso)
  }

  const openWeekForDate = (date: string) => {
    setWeekAnchor(new Date(`${date}T12:00:00`))
    setSelectedDate(date)
    setViewMode('week')
  }

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title={t('connect.calendar.title')}
        subtitle={scopeHint ?? t('connect.calendar.subtitle')}
        actions={
          canManage ? (
            <PrimaryButton onClick={() => openCreate()}>
              <Plus className="h-4 w-4" />
              {t('connect.calendar.newLesson')}
            </PrimaryButton>
          ) : undefined
        }
      />

      <ConnectCard className="p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <OutlineButton
              onClick={() => (viewMode === 'week' ? shiftWeek(-1) : shiftMonth(-1))}
              aria-label={viewMode === 'week' ? t('connect.calendar.nav.prevWeek') : t('connect.calendar.nav.prevMonth')}
            >
              <ChevronLeft className="h-4 w-4" />
            </OutlineButton>

            <h2 className="flex min-w-[12rem] items-center justify-center gap-2 text-lg font-semibold">
              <CalendarDays className="h-5 w-5 text-hub-red" />
              {viewMode === 'week' ? weekLabel : monthLabel}
            </h2>

            <OutlineButton
              onClick={() => (viewMode === 'week' ? shiftWeek(1) : shiftMonth(1))}
              aria-label={viewMode === 'week' ? t('connect.calendar.nav.nextWeek') : t('connect.calendar.nav.nextMonth')}
            >
              <ChevronRight className="h-4 w-4" />
            </OutlineButton>

            <OutlineButton onClick={goToToday}>{t('connect.calendar.nav.today')}</OutlineButton>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-hub-border/60 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  viewMode === 'week' ? 'bg-hub-red text-white' : 'text-hub-text-muted hover:text-hub-navy'
                }`}
              >
                {t('connect.calendar.views.week')}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  viewMode === 'month' ? 'bg-hub-red text-white' : 'text-hub-text-muted hover:text-hub-navy'
                }`}
              >
                {t('connect.calendar.views.month')}
              </button>
            </div>

            {semesters.length > 0 && (
              <select
                className={`${selectClass} max-w-xs`}
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
              >
                <option value="">{t('connect.calendar.allSemesters')}</option>
                {semesters.map((sem) => (
                  <option key={sem} value={sem}>
                    {sem}
                  </option>
                ))}
              </select>
            )}

            {classes.length > 1 && (
              <select
                className={`${selectClass} max-w-xs`}
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
              >
                <option value="">{t('connect.calendar.allClasses')}</option>
                {classes.map((turma) => (
                  <option key={turma.id} value={turma.id}>
                    {turma.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        {loading ? (
          <ConnectLoadingSpinner label={t('connect.calendar.loading')} />
        ) : viewMode === 'week' ? (
          <CalendarWeekGrid weekDays={weekDays} lessons={lessons} onSelectLesson={setDetailLesson} />
        ) : (
          <>
            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-hub-text-muted">
              {WEEKDAY_KEYS.map((key) => (
                <div key={key}>{t(`connect.days.${key}`).slice(0, 3)}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((cell, index) => {
                if (!cell.date) {
                  return <div key={`empty-${index}`} className="min-h-[88px] rounded-lg bg-transparent" />
                }
                const dayLessons = lessonsByDate.get(cell.date) ?? []
                const isSelected = cell.date === selectedDate
                const isToday = cell.date === todayIso

                return (
                  <button
                    key={cell.date}
                    type="button"
                    onClick={() => openWeekForDate(cell.date!)}
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
                          className={`truncate rounded px-1 py-0.5 text-[10px] leading-tight ${
                            lesson.attendance_status === 'closed'
                              ? 'bg-emerald-500/20 text-emerald-800'
                              : lesson.has_attendance
                                ? 'bg-amber-500/20 text-amber-900'
                                : 'bg-hub-red/15 text-hub-text'
                          }`}
                        >
                          {lesson.start_time} {lesson.class?.code ?? lesson.class?.name}
                        </div>
                      ))}
                      {dayLessons.length > 2 && (
                        <div className="text-[10px] text-hub-text-muted">
                          {t('connect.calendar.moreLessons', { count: dayLessons.length - 2 })}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </ConnectCard>

      {canManage && classFilter && (
        <ConnectCard className="mt-4 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-hub-navy">
            <LayoutGrid className="h-4 w-4 text-hub-red" />
            {t('connect.schedule.panelTitle')}
          </h3>
          <ClassSchedulePanel classId={Number(classFilter)} canManage={canManage} onUpdated={load} />
        </ConnectCard>
      )}

      <LessonDetailModal
        lesson={detailLesson}
        open={detailLesson !== null}
        onClose={() => setDetailLesson(null)}
        canManage={canManage}
        canAttendance={canAttendance}
        onEdit={canManage ? openEdit : undefined}
        onDelete={canManage ? (lesson) => void handleDelete(lesson) : undefined}
      />

      <ConnectDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingLesson ? t('connect.calendar.drawer.edit') : t('connect.calendar.drawer.new')}
        subtitle={editingLesson ? t('connect.calendar.drawer.editSubtitle') : t('connect.calendar.drawer.newSubtitle')}
        footer={
          <div className="flex justify-end gap-2">
            {editingLesson && (
              <button
                type="button"
                onClick={() => void handleDelete(editingLesson)}
                className="glass-input mr-auto inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-red-200 px-5 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                {t('connect.calendar.actions.remove')}
              </button>
            )}
            <OutlineButton onClick={() => setDrawerOpen(false)}>{t('common.cancel')}</OutlineButton>
            <PrimaryButton onClick={() => void handleSave()}>{t('common.save')}</PrimaryButton>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t('connect.calendar.form.class')} required>
            <select
              className={selectClass}
              value={form.connect_class_id}
              onChange={(e) => setForm({ ...form, connect_class_id: e.target.value })}
            >
              <option value="">{t('connect.attendance.options.selectClass')}</option>
              {classes.map((turma) => (
                <option key={turma.id} value={turma.id}>
                  {turma.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label={t('connect.calendar.form.teacher')}>
            <select
              className={selectClass}
              value={form.connect_teacher_id}
              onChange={(e) => setForm({ ...form, connect_teacher_id: e.target.value })}
            >
              <option value="">{t('connect.classes.form.teacher')}</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.full_name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label={t('connect.calendar.form.date')} required>
            <input
              type="date"
              className={inputClass}
              value={form.scheduled_date}
              onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
            />
          </FormField>
          <FormField label={t('connect.calendar.form.subject')}>
            <input
              className={inputClass}
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </FormField>
          <FormField label={t('connect.calendar.form.start')}>
            <input
              type="time"
              className={inputClass}
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            />
          </FormField>
          <FormField label={t('connect.calendar.form.end')}>
            <input
              type="time"
              className={inputClass}
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
            />
          </FormField>
          <FormField label={t('connect.calendar.form.lessons')}>
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
            <FormField label={t('connect.calendar.form.notes')}>
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
