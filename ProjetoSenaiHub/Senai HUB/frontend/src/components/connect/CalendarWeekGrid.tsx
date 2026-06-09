import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ConnectLessonSchedule } from '../../types/connect'

const HOUR_HEIGHT = 56
const DAY_START_HOUR = 7
const DAY_END_HOUR = 22
const TOTAL_MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60

const WEEKDAY_KEYS = ['0', '1', '2', '3', '4', '5', '6'] as const

export interface WeekDay {
  date: string
  day: number
  isToday: boolean
}

interface LayoutBlock {
  lesson: ConnectLessonSchedule
  column: number
  totalColumns: number
}

interface CalendarWeekGridProps {
  weekDays: WeekDay[]
  lessons: ConnectLessonSchedule[]
  onSelectLesson: (lesson: ConnectLessonSchedule) => void
}

function parseTimeMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function getWeekDays(anchor: Date, todayIso: string): WeekDay[] {
  const start = new Date(anchor)
  start.setDate(anchor.getDate() - anchor.getDay())

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    const date = toIsoDate(day)
    return {
      date,
      day: day.getDate(),
      isToday: date === todayIso,
    }
  })
}

export function weekRangeFromAnchor(anchor: Date): { from: string; to: string } {
  const days = getWeekDays(anchor, toIsoDate(new Date()))
  return { from: days[0].date, to: days[6].date }
}

function layoutDayLessons(lessons: ConnectLessonSchedule[]): LayoutBlock[] {
  const sorted = [...lessons].sort((a, b) => a.start_time.localeCompare(b.start_time))
  const blocks: LayoutBlock[] = []
  const active: Array<{ end: number; column: number; index: number }> = []

  sorted.forEach((lesson, index) => {
    const start = parseTimeMinutes(lesson.start_time)
    const end = parseTimeMinutes(lesson.end_time)

    const stillActive = active.filter((item) => item.end > start)
    active.length = 0
    active.push(...stillActive)

    const usedColumns = new Set(stillActive.map((item) => item.column))
    let column = 0
    while (usedColumns.has(column)) column += 1

    active.push({ end, column, index })
    const totalColumns = Math.max(...active.map((item) => item.column + 1), 1)

    blocks.push({ lesson, column, totalColumns })
  })

  const groups: LayoutBlock[][] = []
  let currentGroup: LayoutBlock[] = []
  let groupEnd = 0

  blocks.forEach((block) => {
    const start = parseTimeMinutes(block.lesson.start_time)
    const end = parseTimeMinutes(block.lesson.end_time)

    if (currentGroup.length === 0 || start < groupEnd) {
      currentGroup.push(block)
      groupEnd = Math.max(groupEnd, end)
      return
    }

    groups.push(currentGroup)
    currentGroup = [block]
    groupEnd = end
  })

  if (currentGroup.length > 0) groups.push(currentGroup)

  groups.forEach((group) => {
    const maxColumns = Math.max(...group.map((block) => block.totalColumns), 1)
    group.forEach((block) => {
      block.totalColumns = maxColumns
    })
  })

  return blocks
}

function blockStyle(lesson: ConnectLessonSchedule, column: number, totalColumns: number): React.CSSProperties {
  const start = parseTimeMinutes(lesson.start_time) - DAY_START_HOUR * 60
  const end = parseTimeMinutes(lesson.end_time) - DAY_START_HOUR * 60
  const clampedStart = Math.max(0, start)
  const clampedEnd = Math.min(TOTAL_MINUTES, Math.max(end, clampedStart + 15))
  const top = (clampedStart / TOTAL_MINUTES) * 100
  const height = ((clampedEnd - clampedStart) / TOTAL_MINUTES) * 100
  const width = 100 / totalColumns
  const left = column * width

  return {
    top: `${top}%`,
    height: `${Math.max(height, 4)}%`,
    left: `calc(${left}% + 2px)`,
    width: `calc(${width}% - 4px)`,
  }
}

function blockColor(lesson: ConnectLessonSchedule): string {
  if (lesson.attendance_status === 'closed') {
    return 'bg-emerald-500/85 border-emerald-600/40 text-white hover:bg-emerald-600/90'
  }
  if (lesson.has_attendance) {
    return 'bg-amber-500/85 border-amber-600/40 text-amber-950 hover:bg-amber-500'
  }
  return 'bg-hub-red/85 border-hub-red text-white hover:bg-hub-red'
}

export function CalendarWeekGrid({ weekDays, lessons, onSelectLesson }: CalendarWeekGridProps) {
  const { t, i18n } = useTranslation()

  const hours = useMemo(() => {
    return Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, index) => DAY_START_HOUR + index)
  }, [])

  const lessonsByDate = useMemo(() => {
    const map = new Map<string, ConnectLessonSchedule[]>()
    lessons.forEach((lesson) => {
      const list = map.get(lesson.scheduled_date) ?? []
      list.push(lesson)
      map.set(lesson.scheduled_date, list)
    })
    return map
  }, [lessons])

  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const todayIso = toIsoDate(now)
  const showNowLine =
    weekDays.some((day) => day.date === todayIso) && nowMinutes >= DAY_START_HOUR * 60 && nowMinutes <= DAY_END_HOUR * 60
  const nowTop = ((nowMinutes - DAY_START_HOUR * 60) / TOTAL_MINUTES) * 100

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[760px]">
        <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] border-b border-hub-border/60">
          <div />
          {weekDays.map((weekDay) => {
            const weekday = new Date(`${weekDay.date}T12:00:00`).getDay()
            const label = t(`connect.days.${WEEKDAY_KEYS[weekday]}`)
            return (
              <div
                key={weekDay.date}
                className={`border-l border-hub-border/40 px-2 py-2 text-center ${
                  weekDay.isToday ? 'bg-hub-red/5' : ''
                }`}
              >
                <p className="text-[11px] font-medium uppercase tracking-wide text-hub-text-muted">{label.slice(0, 3)}</p>
                <p
                  className={`mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                    weekDay.isToday ? 'bg-hub-red text-white' : 'text-hub-navy'
                  }`}
                >
                  {weekDay.day}
                </p>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]">
          <div className="relative">
            {hours.map((hour) => (
              <div
                key={hour}
                className="relative border-b border-hub-border/30 pr-2 text-right text-[11px] text-hub-text-muted"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="absolute -top-2 right-2">
                  {new Date(2000, 0, 1, hour).toLocaleTimeString(i18n.language, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>

          {weekDays.map((weekDay) => {
            const dayLessons = lessonsByDate.get(weekDay.date) ?? []
            const layout = layoutDayLessons(dayLessons)

            return (
              <div
                key={weekDay.date}
                className={`relative border-l border-hub-border/40 ${weekDay.isToday ? 'bg-hub-red/[0.03]' : ''}`}
                style={{ height: hours.length * HOUR_HEIGHT }}
              >
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-b border-hub-border/25"
                    style={{ top: (hour - DAY_START_HOUR) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                  />
                ))}

                {showNowLine && weekDay.date === todayIso && (
                  <div className="pointer-events-none absolute left-0 right-0 z-20" style={{ top: `${nowTop}%` }}>
                    <div className="h-0.5 bg-hub-red shadow-sm" />
                    <div className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full bg-hub-red" />
                  </div>
                )}

                {layout.map(({ lesson, column, totalColumns }) => (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => onSelectLesson(lesson)}
                    className={`absolute z-10 overflow-hidden rounded-md border px-1.5 py-1 text-left text-[11px] leading-tight shadow-sm transition ${blockColor(lesson)}`}
                    style={blockStyle(lesson, column, totalColumns)}
                    title={`${lesson.start_time} – ${lesson.end_time} · ${lesson.class?.name ?? ''}`}
                  >
                    <p className="truncate font-semibold">{lesson.start_time}</p>
                    <p className="truncate opacity-95">{lesson.class?.code ?? lesson.class?.name ?? lesson.subject}</p>
                    {totalColumns === 1 && lesson.teacher?.full_name && (
                      <p className="truncate opacity-80">{lesson.teacher.full_name}</p>
                    )}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
