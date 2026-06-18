import { Eye, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ConnectDrawer } from '../../components/connect/ConnectDrawer'
import { ConnectEntityViewDrawer } from '../../components/connect/ConnectEntityViewDrawer'
import { ConnectRowActionsMenu } from '../../components/connect/ConnectRowActionsMenu'
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
import type {
  ConnectClass,
  ConnectCourse,
  ConnectSchedulePlan,
  ConnectTeacher,
  ConnectWeeklyPattern,
  PaginatedMeta,
} from '../../types/connect'
import { optionalForeignIdOrNull, slugClassCode } from '../../utils/connectForm'
import { weeklyPatternsForShift } from '../../utils/connectScheduleDefaults'
import { useConfirmAction } from '../../hooks/useConfirmAction'
import { useCrudToast } from '../../hooks/useCrudToast'
const DAY_VALUES = [1, 2, 3, 4, 5, 6, 0]

const emptyForm = {
  name: '',
  connect_course_id: '',
  connect_teacher_id: '',
  shift: 'noite',
  semester: '',
  start_date: '',
  end_date: '',
  capacity: '30',
  status: 'active',
  description: '',
}

export function ClassesPage() {
  const { t } = useTranslation()
  const crudToast = useCrudToast()
  const { confirmDelete } = useConfirmAction()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [classes, setClasses] = useState<ConnectClass[]>([])
  const [courses, setCourses] = useState<ConnectCourse[]>([])
  const [teachers, setTeachers] = useState<ConnectTeacher[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | undefined>()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [viewId, setViewId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [weeklyPatterns, setWeeklyPatterns] = useState<ConnectWeeklyPattern[]>([])
  const [schedulePlan, setSchedulePlan] = useState<ConnectSchedulePlan | null>(null)
  const [generateSchedule, setGenerateSchedule] = useState(false)

  const defaultPattern = (): ConnectWeeklyPattern => ({
    day_of_week: 1,
    start_time: '19:00',
    end_time: '22:00',
    lessons_count: 4,
    subject: t('connect.classes.defaultSubject'),
  })

  const defaultPatternsForShift = (shift: string) =>
    weeklyPatternsForShift(shift, t('connect.classes.defaultSubject'))

  const load = () => {
    setLoading(true)
    const params: Record<string, string | number> = { page, per_page: 10, search }
    if (statusFilter) params.status = statusFilter
    connectService
      .getClasses(params)
      .then((res) => {
        setClasses(res.data)
        setMeta(res.meta)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const status = searchParams.get('status')
    if (status === 'active' || status === 'inactive' || status === 'finished') {
      setStatusFilter(status)
    }
    const q = searchParams.get('search')
    if (q) setSearch(q)
  }, [searchParams])

  useEffect(() => {
    load()
  }, [page, search, statusFilter])

  useEffect(() => {
    connectService.getCourses({ per_page: 50 }).then((r) => setCourses(r.data))
    connectService.getTeachers({ per_page: 50 }).then((r) => setTeachers(r.data))
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setWeeklyPatterns(defaultPatternsForShift(emptyForm.shift))
    setSchedulePlan(null)
    setGenerateSchedule(true)
    setDrawerOpen(true)
  }

  const openEdit = (turma: ConnectClass) => {
    setEditingId(turma.id)
    setForm({
      name: turma.name,
      connect_course_id: String(turma.connect_course_id ?? turma.course?.id ?? ''),
      connect_teacher_id: String(turma.connect_teacher_id ?? turma.teacher?.id ?? ''),
      shift: turma.shift ?? 'noite',
      semester: turma.semester ?? '',
      start_date: turma.start_date?.slice(0, 10) ?? '',
      end_date: turma.end_date?.slice(0, 10) ?? '',
      capacity: String(turma.capacity ?? 30),
      status: turma.status ?? 'active',
      description: '',
    })
    setGenerateSchedule(false)
    connectService.getWeeklyPatterns(turma.id).then(({ patterns, plan }) => {
      setWeeklyPatterns(patterns)
      setSchedulePlan(plan)
    })
    setDrawerOpen(true)
  }

  useEffect(() => {
    if (!drawerOpen || editingId !== null) return
    setWeeklyPatterns(defaultPatternsForShift(form.shift))
  }, [form.shift, drawerOpen, editingId, t])

  const handleSave = async () => {
    if (!form.name.trim()) {
      crudToast.notifyWarning(t('connect.classes.alert.nameRequired'))
      return
    }

    const wantsSchedule = generateSchedule || weeklyPatterns.length > 0
    if (wantsSchedule && (!form.start_date || !form.end_date)) {
      crudToast.notifyWarning(t('connect.classes.alert.scheduleFieldsRequired'))
      return
    }

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      connect_course_id: optionalForeignIdOrNull(form.connect_course_id),
      connect_teacher_id: optionalForeignIdOrNull(form.connect_teacher_id),
      shift: form.shift,
      semester: form.semester.trim() || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      capacity: Number(form.capacity) || 30,
      status: form.status,
      code: slugClassCode(form.name),
      weekly_patterns: weeklyPatterns.length > 0 ? weeklyPatterns : defaultPatternsForShift(form.shift),
      generate_schedule: generateSchedule || weeklyPatterns.length > 0,
    }
    const wasEdit = !!editingId
    try {
      if (editingId) {
        await connectService.updateClass(editingId, payload)
      } else {
        await connectService.createClass(payload)
      }
    } catch (error: unknown) {
      crudToast.notifyError(error, t('connect.classes.alert.saveError'))
      return
    }
    setDrawerOpen(false)
    setEditingId(null)
    crudToast.notifySaved(wasEdit)
    load()
  }

  const handleDelete = async (turma: ConnectClass) => {
    if (!(await confirmDelete(`a turma "${turma.name}"`))) return
    try {
      await connectService.deleteClass(turma.id)
      crudToast.notifyDeleted()
      load()
    } catch (error: unknown) {
      crudToast.notifyError(error, t('connect.classes.alert.deleteError'))
    }
  }

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title={t('connect.classes.title')}
        subtitle={t('connect.classes.subtitle')}
        actions={
          <PrimaryButton onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t('connect.classes.create')}
          </PrimaryButton>
        }
      />

      <ConnectCard>
        <div className="flex flex-wrap items-center gap-3 border-b border-hub-border/60 p-4">
          <input
            className={`${inputClass} max-w-xs`}
            placeholder={t('connect.classes.searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setPage(1)
              setSearch(e.target.value)
            }}
          />
          <select
            className={`${selectClass} max-w-xs`}
            value={statusFilter}
            onChange={(e) => {
              setPage(1)
              setStatusFilter(e.target.value)
            }}
            aria-label={t('connect.classes.filters.status')}
          >
            <option value="">{t('connect.classes.filters.allStatuses')}</option>
            <option value="active">{t('connect.classes.filters.activeOnly')}</option>
            <option value="finished">{t('connect.classes.filters.finishedOnly')}</option>
            <option value="inactive">{t('connect.classes.filters.inactiveOnly')}</option>
          </select>
        </div>
        {loading ? (
          <ConnectLoadingSpinner label={t('connect.classes.loading')} className="min-h-[280px]" />
        ) : (
        <>
        <ConnectTableScroll>
          <table className="w-full min-w-[720px] text-sm">
            <thead className="glass-thead text-hub-text-muted">
              <tr>
                <th className="px-4 py-3 text-left">{t('connect.classes.table.className')}</th>
                <th className="px-4 py-3 text-left">{t('connect.table.course')}</th>
                <th className="px-4 py-3 text-left">{t('connect.classes.table.period')}</th>
                <th className="px-4 py-3 text-left">{t('connect.classes.table.semester')}</th>
                <th className="px-4 py-3 text-left">{t('connect.classes.table.start')}</th>
                <th className="px-4 py-3 text-left">{t('connect.classes.table.end')}</th>
                <th className="px-4 py-3 text-left">{t('connect.classes.table.students')}</th>
                <th className="px-4 py-3 text-left">{t('connect.table.status')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {classes.map((turma) => (
                <tr key={turma.id} className="border-t border-hub-border/40">
                  <td className="px-4 py-3 font-medium">{turma.name}</td>
                  <td className="px-4 py-3">{turma.course?.name ?? EMPTY}</td>
                  <td className="px-4 py-3">{formatShift(turma.shift)}</td>
                  <td className="px-4 py-3">{turma.semester ?? EMPTY}</td>
                  <td className="px-4 py-3">{formatDate(turma.start_date)}</td>
                  <td className="px-4 py-3">{formatDate(turma.end_date)}</td>
                  <td className="px-4 py-3">{turma.students_count ?? 0}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={turma.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ConnectRowActionsMenu
                      ariaLabel={t('connect.common.actionsOf', { name: turma.name })}
                      actions={[
                        { key: 'view', label: t('connect.common.view'), icon: Eye, onClick: () => setViewId(turma.id) },
                        {
                          key: 'students',
                          label: t('connect.classes.actions.viewStudents'),
                          icon: Users,
                          onClick: () => navigate(`/connect/alunos?class=${turma.id}`),
                        },
                        { key: 'edit', label: t('connect.common.edit'), icon: Pencil, onClick: () => openEdit(turma) },
                        {
                          key: 'delete',
                          label: t('connect.common.delete'),
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
        title={editingId ? t('connect.classes.drawer.edit') : t('connect.classes.drawer.new')}
        subtitle={
          editingId
            ? t('connect.classes.drawer.editSubtitle')
            : t('connect.classes.drawer.newSubtitle')
        }
        footer={
          <div className="flex justify-end gap-2">
            <OutlineButton onClick={() => setForm(emptyForm)}>{t('connect.courses.drawer.clearFields')}</OutlineButton>
            <OutlineButton onClick={() => setDrawerOpen(false)}>{t('common.cancel')}</OutlineButton>
            <PrimaryButton onClick={() => void handleSave()}>{editingId ? t('common.save') : t('connect.classes.create')}</PrimaryButton>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t('connect.classes.form.name')} required>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t('connect.classes.form.placeholders.name')}
            />
          </FormField>
          <FormField label={t('connect.classes.form.period')}>
            <select className={selectClass} value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })}>
              <option value="manha">{t('connect.shift.manha')}</option>
              <option value="tarde">{t('connect.shift.tarde')}</option>
              <option value="noite">{t('connect.shift.noite')}</option>
            </select>
          </FormField>
          <FormField label={t('connect.classes.form.semester')} hint={t('connect.classes.form.semesterHint')}>
            <input
              className={inputClass}
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
              placeholder={t('connect.classes.form.placeholders.semester')}
            />
          </FormField>
          <FormField label={t('connect.classes.form.startDate')} hint={t('connect.classes.form.startDateHint')}>
            <input type="date" className={inputClass} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </FormField>
          <FormField label={t('connect.classes.form.endDate')} hint={t('connect.students.form.optional')}>
            <input type="date" className={inputClass} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </FormField>
          <FormField label={t('connect.table.status')}>
            <select className={selectClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">{t('connect.classes.form.active')}</option>
              <option value="inactive">{t('connect.classes.form.inactive')}</option>
              <option value="finished">{t('connect.classes.form.finished')}</option>
            </select>
          </FormField>
          <FormField label={t('connect.classes.form.capacity')} hint={t('connect.students.form.optional')}>
            <input
              type="number"
              className={inputClass}
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              placeholder={t('connect.classes.form.placeholders.capacity')}
              min={1}
            />
          </FormField>
          <FormField label={t('connect.classes.form.teacher')} hint={t('connect.classes.form.teacherHint')}>
            <select className={selectClass} value={form.connect_teacher_id} onChange={(e) => setForm({ ...form, connect_teacher_id: e.target.value })}>
              <option value="">Sem professor (definir depois)</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.full_name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label={t('connect.table.course')} hint={t('connect.classes.form.courseHint')}>
            <select className={selectClass} value={form.connect_course_id} onChange={(e) => setForm({ ...form, connect_course_id: e.target.value })}>
              <option value="">Sem curso (definir depois)</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label={t('connect.classes.form.description')}>
            <textarea className={`${inputClass} min-h-[80px] py-2 sm:col-span-2`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t('connect.classes.form.placeholders.description')} />
          </FormField>
        </div>
        <FormField label={t('connect.classes.weekly.title')}>
          <div className="space-y-3">
            {weeklyPatterns.map((pattern, index) => (
              <div key={index} className="grid gap-2 rounded-lg border border-hub-border/60 p-3 sm:grid-cols-5">
                <select
                  className={selectClass}
                  value={pattern.day_of_week}
                  onChange={(e) => {
                    const next = [...weeklyPatterns]
                    next[index] = { ...pattern, day_of_week: Number(e.target.value) }
                    setWeeklyPatterns(next)
                  }}
                >
                  {DAY_VALUES.map((value) => (
                    <option key={value} value={value}>
                      {t(`connect.days.${value}`)}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  className={inputClass}
                  value={pattern.start_time}
                  onChange={(e) => {
                    const next = [...weeklyPatterns]
                    next[index] = { ...pattern, start_time: e.target.value }
                    setWeeklyPatterns(next)
                  }}
                />
                <input
                  type="time"
                  className={inputClass}
                  value={pattern.end_time}
                  onChange={(e) => {
                    const next = [...weeklyPatterns]
                    next[index] = { ...pattern, end_time: e.target.value }
                    setWeeklyPatterns(next)
                  }}
                />
                <select
                  className={selectClass}
                  value={pattern.lessons_count}
                  onChange={(e) => {
                    const next = [...weeklyPatterns]
                    next[index] = { ...pattern, lessons_count: Number(e.target.value) }
                    setWeeklyPatterns(next)
                  }}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {t('connect.classes.weekly.lessons', { count: n })}
                    </option>
                  ))}
                </select>
                <OutlineButton type="button" onClick={() => setWeeklyPatterns(weeklyPatterns.filter((_, i) => i !== index))}>
                  {t('connect.classes.weekly.remove')}
                </OutlineButton>
              </div>
            ))}
            <OutlineButton type="button" onClick={() => setWeeklyPatterns([...weeklyPatterns, defaultPattern()])}>
              {t('connect.classes.weekly.addSlot')}
            </OutlineButton>
          </div>
        </FormField>
        {schedulePlan && (
          <p className="text-sm text-hub-text-muted">
            {t('connect.classes.scheduleSummary', {
              total: `${schedulePlan.scheduled_lessons}/${schedulePlan.workload_hours || '—'}`,
              weekly: schedulePlan.weekly_lessons,
              remaining: schedulePlan.remaining_lessons ?? '—',
            })}
          </p>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={generateSchedule}
            onChange={(e) => setGenerateSchedule(e.target.checked)}
          />
          {t('connect.classes.generateSchedule')}
        </label>
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
