import { Clock, Layers, Pencil, Trash2, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ConnectCourse } from '../../types/connect'
import { courseStatusLabel, getCourseCoverImage } from '../../utils/courseThemes'
import { ConnectRowActionsMenu } from './ConnectRowActionsMenu'
import { viewRowAction } from './connectViewActions'

export function ConnectCourseCard({
  course,
  onView,
  onEdit,
  onRoster,
  onDelete,
}: {
  course: ConnectCourse
  onView: () => void
  onEdit: () => void
  onRoster: () => void
  onDelete?: () => void
}) {
  const { t } = useTranslation()
  const cover = getCourseCoverImage(course)
  const workload = course.workload_hours ? `${course.workload_hours}h` : t('connectComponents.courseCard.workloadTbd')
  const area = course.area?.trim() || t('connectComponents.courseCard.defaultArea')
  const description = course.description?.trim() || t('connectComponents.courseCard.defaultDescription')

  return (
    <article className="group relative flex min-h-[400px] flex-col overflow-hidden rounded-[1.75rem] bg-[#0f1115] shadow-lg ring-1 ring-black/10 transition hover:shadow-xl sm:min-h-[420px]">
      <img
        src={cover}
        alt={t('connectComponents.courseCard.coverAlt', { name: course.name })}
        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        loading="lazy"
        decoding="async"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/55 to-[#0f1115]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[72%] bg-gradient-to-t from-[#0f1115] via-[#0f1115]/95 to-transparent"
        aria-hidden
      />

      <div className="absolute right-4 top-4 z-[2]">
        <ConnectRowActionsMenu
          ariaLabel={t('connectComponents.courseCard.actionsAria', { name: course.name })}
          actions={[
            viewRowAction(onView),
            { key: 'roster', label: t('connectComponents.courseCard.manageRoster'), icon: Users, onClick: onRoster },
            { key: 'edit', label: t('connectComponents.courseCard.edit'), icon: Pencil, onClick: onEdit },
            ...(onDelete
              ? [{ key: 'delete', label: t('common.delete'), icon: Trash2, onClick: onDelete, variant: 'danger' as const }]
              : []),
          ]}
        />
      </div>

      <div className="relative z-[1] mt-auto flex flex-col p-5 sm:p-6">
        <h3 className="text-xl font-bold leading-tight text-white sm:text-2xl">{course.name}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/80">{description}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
            <Clock className="h-3.5 w-3.5 shrink-0 opacity-90" />
            {workload}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
            <Layers className="h-3.5 w-3.5 shrink-0 opacity-90" />
            {area}
          </span>
          <span
            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-sm ${
              course.status === 'active'
                ? 'bg-emerald-500/25 text-emerald-100'
                : 'bg-white/12 text-white/90'
            }`}
          >
            {courseStatusLabel(course.status)}
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onRoster}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-bold text-[#0f1115] transition hover:bg-white/95 active:scale-[0.99]"
          >
            <Users className="h-4 w-4" />
            {t('connectComponents.courseCard.manageRoster')}
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15"
          >
            <Pencil className="h-4 w-4" />
            {t('connectComponents.courseCard.editCourse')}
          </button>
        </div>
      </div>
    </article>
  )
}

export function ConnectCourseCardSkeleton() {
  return (
    <div className="relative min-h-[400px] animate-pulse overflow-hidden rounded-[1.75rem] bg-[#1a1d24] shadow-lg sm:min-h-[420px]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#2a2f3a] to-[#0f1115]" />
      <div className="absolute inset-x-0 top-0 h-2/5 bg-[#3a4150]/60" />
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-6">
        <div className="h-7 w-4/5 rounded-lg bg-white/10" />
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-white/10" />
          <div className="h-3 w-[90%] rounded bg-white/10" />
        </div>
        <div className="flex gap-2 pt-2">
          <div className="h-8 w-24 rounded-full bg-white/10" />
          <div className="h-8 w-28 rounded-full bg-white/10" />
        </div>
        <div className="mt-2 h-12 w-full rounded-full bg-white/15" />
        <div className="h-11 w-full rounded-full bg-white/10" />
      </div>
    </div>
  )
}
