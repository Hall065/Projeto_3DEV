import { CalendarDays, ClipboardCheck, Clock, MapPin, Pencil, Trash2, User, X } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { OutlineButton, PrimaryButton } from './ConnectShared'
import type { ConnectLessonSchedule } from '../../types/connect'

interface LessonDetailModalProps {
  lesson: ConnectLessonSchedule | null
  open: boolean
  onClose: () => void
  canManage?: boolean
  canAttendance?: boolean
  onEdit?: (lesson: ConnectLessonSchedule) => void
  onDelete?: (lesson: ConnectLessonSchedule) => void
}

function attendanceBadgeClass(status?: ConnectLessonSchedule['attendance_status'], hasAttendance?: boolean): string {
  if (status === 'closed') return 'bg-emerald-500/15 text-emerald-700'
  if (hasAttendance) return 'bg-amber-500/15 text-amber-800'
  return 'bg-hub-red/10 text-hub-text'
}

export function LessonDetailModal({
  lesson,
  open,
  onClose,
  canManage = false,
  canAttendance = false,
  onEdit,
  onDelete,
}: LessonDetailModalProps) {
  const { t, i18n } = useTranslation()

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open || !lesson) return null

  const dateLabel = new Date(`${lesson.scheduled_date}T12:00:00`).toLocaleDateString(i18n.language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const attendanceLabel =
    lesson.attendance_status === 'closed'
      ? t('connect.calendar.attendance.closed')
      : lesson.has_attendance
        ? t('connect.calendar.attendance.open')
        : t('connect.calendar.attendance.pending')

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lesson-detail-title"
        className="glass-panel-solid w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-hub-border/50 px-5 py-4">
          <div className="min-w-0 pr-4">
            <p className="text-xs font-medium uppercase tracking-wide text-hub-text-muted">
              {lesson.class?.code ?? t('connect.calendar.modal.lesson')}
            </p>
            <h2 id="lesson-detail-title" className="mt-1 text-lg font-semibold text-hub-navy">
              {lesson.subject || lesson.class?.name}
            </h2>
            <p className="mt-0.5 text-sm text-hub-text-muted">{lesson.class?.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-hub-text-muted transition hover:bg-hub-bg hover:text-hub-navy"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="flex items-start gap-3 text-sm">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-hub-red" />
            <span className="capitalize">{dateLabel}</span>
          </div>

          <div className="flex items-start gap-3 text-sm">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-hub-red" />
            <span>
              {lesson.start_time} – {lesson.end_time}
              <span className="text-hub-text-muted">
                {' '}
                · {t('connect.classes.weekly.lessons', { count: lesson.lessons_count })}
              </span>
            </span>
          </div>

          {lesson.teacher?.full_name && (
            <div className="flex items-start gap-3 text-sm">
              <User className="mt-0.5 h-4 w-4 shrink-0 text-hub-red" />
              <span>
                {t('connect.calendar.dayPanel.teacher')} {lesson.teacher.full_name}
              </span>
            </div>
          )}

          {lesson.class?.shift && (
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-hub-red" />
              <span>{lesson.class.shift}</span>
            </div>
          )}

          <div>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${attendanceBadgeClass(
                lesson.attendance_status,
                lesson.has_attendance,
              )}`}
            >
              {attendanceLabel}
            </span>
          </div>

          {lesson.notes && (
            <div className="rounded-xl border border-hub-border/60 bg-hub-surface/60 p-3 text-sm text-hub-text-muted">
              {lesson.notes}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-hub-border/50 px-5 py-4 sm:flex-row sm:flex-wrap sm:justify-end">
          {canManage && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(lesson)}
              className="glass-input inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-red-200 px-5 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              {t('connect.calendar.actions.remove')}
            </button>
          )}
          {canManage && onEdit && (
            <OutlineButton onClick={() => onEdit(lesson)}>
              <Pencil className="h-4 w-4" />
              {t('connect.calendar.actions.edit')}
            </OutlineButton>
          )}
          {canAttendance && (
            <Link
              to={`/connect/frequencia?class=${lesson.connect_class_id}&date=${lesson.scheduled_date}&lesson=${lesson.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-hub-border px-4 py-2 text-sm font-medium transition hover:border-hub-red"
              onClick={onClose}
            >
              <ClipboardCheck className="h-4 w-4" />
              {t('connect.calendar.actions.attendance')}
            </Link>
          )}
          <PrimaryButton onClick={onClose}>{t('common.close')}</PrimaryButton>
        </div>
      </div>
    </div>
  )
}
