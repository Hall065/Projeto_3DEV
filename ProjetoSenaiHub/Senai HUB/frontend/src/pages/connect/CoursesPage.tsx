import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConnectCourseCard, ConnectCourseCardSkeleton } from '../../components/connect/ConnectCourseCard'
import { ConnectDrawer } from '../../components/connect/ConnectDrawer'
import { ConnectEntityViewDrawer } from '../../components/connect/ConnectEntityViewDrawer'
import { ConnectRosterDrawer } from '../../components/connect/ConnectRosterDrawer'
import {
  ConnectPageHeader,
  ConnectPagination,
  FormField,
  inputClass,
  OutlineButton,
  PrimaryButton,
  selectClass,
} from '../../components/connect/ConnectShared'
import { connectService } from '../../services/connectService'
import type { ConnectCourse, PaginatedMeta } from '../../types/connect'
import { useCrudToast } from '../../hooks/useCrudToast'
import { useConfirmAction } from '../../hooks/useConfirmAction'

function defaultSemesterDates(): { start_date: string; end_date: string } {
  const now = new Date()
  const year = now.getFullYear()
  if (now.getMonth() < 6) {
    return { start_date: `${year}-01-15`, end_date: `${year}-06-30` }
  }
  return { start_date: `${year}-07-01`, end_date: `${year}-12-20` }
}

const emptyForm = {
  name: '',
  description: '',
  workload_hours: '120',
  ...defaultSemesterDates(),
  area: '',
  status: 'active',
}

export function CoursesPage() {
  const { t } = useTranslation()
  const crudToast = useCrudToast()
  const { confirmDelete } = useConfirmAction()
  const [courses, setCourses] = useState<ConnectCourse[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | undefined>()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [rosterOpen, setRosterOpen] = useState(false)
  const [rosterCourse, setRosterCourse] = useState<ConnectCourse | null>(null)
  const [viewId, setViewId] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    connectService
      .getCourses({ page, per_page: 12, search })
      .then((res) => {
        setCourses(res.data)
        setMeta(res.meta)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page, search])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDrawerOpen(true)
  }

  const openEdit = (course: ConnectCourse) => {
    setEditingId(course.id)
    setForm({
      name: course.name,
      description: course.description ?? '',
      workload_hours: String(course.workload_hours ?? 120),
      start_date: course.start_date?.slice(0, 10) ?? '',
      end_date: course.end_date?.slice(0, 10) ?? '',
      area: course.area ?? '',
      status: course.status,
    })
    setDrawerOpen(true)
  }

  const openRoster = (course: ConnectCourse) => {
    setRosterCourse(course)
    setRosterOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      crudToast.notifyWarning(t('connect.courses.alert.nameRequired'))
      return
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      area: form.area.trim() || null,
      status: form.status,
      workload_hours: form.workload_hours ? Number(form.workload_hours) : 0,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    }

    try {
      const wasEdit = !!editingId
      if (editingId) {
        await connectService.updateCourse(editingId, payload)
      } else {
        await connectService.createCourse({
          ...payload,
          code: form.name.trim().substring(0, 12).replace(/\s+/g, '-').toUpperCase() || `CURSO-${Date.now().toString(36).slice(-4).toUpperCase()}`,
        })
      }
      setDrawerOpen(false)
      crudToast.notifySaved(wasEdit)
      load()
    } catch (error: unknown) {
      crudToast.notifyError(error, t('connect.courses.alert.saveError'))
    }
  }

  const handleDelete = async (course: ConnectCourse) => {
    if (!(await confirmDelete(`o curso "${course.name}"`))) return
    try {
      await connectService.deleteCourse(course.id)
      crudToast.notifyDeleted()
      load()
    } catch (error: unknown) {
      crudToast.notifyError(error, t('connect.courses.alert.deleteError'))
    }
  }

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title={t('connect.courses.title')}
        subtitle={t('connect.courses.subtitle')}
        actions={
          <PrimaryButton onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t('connect.courses.create')}
          </PrimaryButton>
        }
      />

      <div className="glass-panel mb-6 rounded-2xl p-4">
        <input
          className={inputClass}
          placeholder={t('connect.courses.searchPlaceholder')}
          value={search}
          onChange={(e) => {
            setPage(1)
            setSearch(e.target.value)
          }}
        />
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ConnectCourseCardSkeleton key={i} />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="glass-panel rounded-2xl px-6 py-16 text-center text-sm text-hub-text-muted">
          {t('connect.courses.empty')}
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <ConnectCourseCard
                key={course.id}
                course={course}
                onView={() => setViewId(course.id)}
                onEdit={() => openEdit(course)}
                onRoster={() => openRoster(course)}
                onDelete={() => void handleDelete(course)}
              />
            ))}
          </div>
          <div className="mt-8">
            <ConnectPagination meta={meta} onPageChange={setPage} />
          </div>
        </>
      )}

      <ConnectDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingId ? t('connect.courses.drawer.edit') : t('connect.courses.drawer.new')}
        subtitle={editingId ? t('connect.courses.drawer.editSubtitle') : t('connect.courses.drawer.newSubtitle')}
        footer={
          <div className="flex justify-end gap-2">
            <OutlineButton onClick={() => setForm(emptyForm)}>{t('connect.courses.drawer.clearFields')}</OutlineButton>
            <OutlineButton onClick={() => setDrawerOpen(false)}>{t('common.cancel')}</OutlineButton>
            <PrimaryButton onClick={handleSave}>{t('common.save')}</PrimaryButton>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t('connect.courses.form.name')} required>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t('connect.courses.form.placeholders.name')}
            />
          </FormField>
          <FormField label={t('connect.courses.form.area')}>
            <input
              className={inputClass}
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
              placeholder={t('connect.courses.form.placeholders.area')}
            />
          </FormField>
          <FormField label={t('connect.courses.form.workload')} hint="Usada no planejamento do semestre">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.workload_hours}
              onChange={(e) => setForm({ ...form, workload_hours: e.target.value })}
              placeholder={t('connect.courses.form.placeholders.workload')}
            />
          </FormField>
          <FormField label={t('connect.courses.form.startDate')} hint="Turmas devem ficar dentro deste periodo">
            <input
              type="date"
              className={inputClass}
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </FormField>
          <FormField label={t('connect.courses.form.endDate')}>
            <input
              type="date"
              className={inputClass}
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </FormField>
          <FormField label={t('connect.table.status')}>
            <select
              className={selectClass}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="active">{t('connect.status.active')}</option>
              <option value="inactive">{t('connect.status.inactive')}</option>
            </select>
          </FormField>
          <FormField label={t('connect.courses.form.description')} hint={t('connect.students.form.optional')}>
            <textarea
              className={`${inputClass} min-h-[100px] py-2 sm:col-span-2`}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={t('connect.courses.form.placeholders.description')}
            />
          </FormField>
        </div>
      </ConnectDrawer>

      <ConnectRosterDrawer
        open={rosterOpen}
        onClose={() => {
          setRosterOpen(false)
          setRosterCourse(null)
        }}
        mode="course"
        entityId={rosterCourse?.id ?? null}
        entityName={rosterCourse?.name ?? ''}
        onChanged={load}
      />

      <ConnectEntityViewDrawer
        kind="course"
        entityId={viewId}
        open={viewId !== null}
        onClose={() => setViewId(null)}
      />
    </div>
  )
}
