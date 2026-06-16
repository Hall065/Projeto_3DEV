import { GraduationCap, Loader2, UserMinus, UserPlus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { connectService } from '../../services/connectService'
import type { ConnectClass, CourseRoster, CourseRosterRole, HubPerson } from '../../types/connect'
import {
  courseRosterRoleLabel,
  hubPersonKindLabel,
  personDisplayName,
} from '../../utils/connectPerson'
import { ConnectDrawer } from './ConnectDrawer'
import { FormField, OutlineButton, PrimaryButton, selectClass, StatusBadge } from './ConnectShared'

type CourseTab = CourseRosterRole

interface ConnectRosterDrawerProps {
  open: boolean
  onClose: () => void
  mode: 'course' | 'class'
  entityId: number | null
  entityName: string
  onChanged?: () => void
}

export function ConnectRosterDrawer({
  open,
  onClose,
  mode,
  entityId,
  entityName,
  onChanged,
}: ConnectRosterDrawerProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [courseRoster, setCourseRoster] = useState<CourseRoster | null>(null)
  const [classRoster, setClassRoster] = useState<HubPerson[]>([])
  const [courseTab, setCourseTab] = useState<CourseTab>('student')
  const [personId, setPersonId] = useState('')
  const [peopleOptions, setPeopleOptions] = useState<HubPerson[]>([])
  const [classOptions, setClassOptions] = useState<ConnectClass[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [importingClass, setImportingClass] = useState(false)
  const [classSuccess, setClassSuccess] = useState<string | null>(null)

  const loadRoster = useCallback(async () => {
    if (!entityId || !open) return
    setLoading(true)
    setError(null)
    try {
      if (mode === 'course') {
        setCourseRoster(await connectService.getCourseRoster(entityId))
      } else {
        setClassRoster(await connectService.getClassRoster(entityId))
      }
    } catch {
      setError(t('connectComponents.rosterDrawer.loadError'))
    } finally {
      setLoading(false)
    }
  }, [entityId, mode, open, t])

  useEffect(() => {
    if (open && entityId) {
      void loadRoster()
    } else {
      setCourseRoster(null)
      setClassRoster([])
      setPersonId('')
      setSelectedClassId('')
      setClassSuccess(null)
      setError(null)
    }
  }, [open, entityId, loadRoster])

  useEffect(() => {
    if (!open) return
    const loadOptions = async () => {
      try {
        if (mode === 'class' || courseTab === 'student') {
          const res = await connectService.getPeople({ kind: 'student', per_page: 100 })
          setPeopleOptions(res.data)
          return
        }
        if (courseTab === 'teacher') {
          const res = await connectService.getPeople({ kind: 'teacher', per_page: 100 })
          setPeopleOptions(res.data)
          return
        }
        const res = await connectService.getPeople({ per_page: 100 })
        setPeopleOptions(res.data.filter((p) => p.kind === 'teacher' || p.kind === 'staff'))
      } catch {
        setPeopleOptions([])
      }
    }
    void loadOptions()
  }, [open, mode, courseTab])

  useEffect(() => {
    if (!open || mode !== 'course' || courseTab !== 'student' || !entityId) {
      setClassOptions([])
      return
    }

    const loadClasses = async () => {
      try {
        const res = await connectService.getClasses({ per_page: 100 })
        setClassOptions(res.data)
      } catch {
        setClassOptions([])
      }
    }

    void loadClasses()
  }, [open, mode, courseTab, entityId])

  const isClassDisabled = (turma: ConnectClass) =>
    turma.connect_course_id != null && turma.connect_course_id !== entityId

  const availableClasses = classOptions.filter((turma) => !isClassDisabled(turma))

  const classOptionLabel = (turma: ConnectClass) => {
    const students =
      turma.students_count != null
        ? t('connectComponents.rosterDrawer.classStudentsCount', { count: turma.students_count })
        : ''
    const linked =
      turma.connect_course_id === entityId
        ? t('connectComponents.rosterDrawer.classAlreadyLinked')
        : ''
    return `${turma.code} — ${turma.name}${students}${linked}`
  }

  const currentCourseList = (): HubPerson[] => {
    if (!courseRoster) return []
    if (courseTab === 'student') return courseRoster.students
    if (courseTab === 'teacher') return courseRoster.teachers
    return courseRoster.coordinators
  }

  const enrolledIds = new Set(
    mode === 'course' ? currentCourseList().map((p) => p.id) : classRoster.map((p) => p.id),
  )

  const availablePeople = peopleOptions.filter((p) => !enrolledIds.has(p.id))

  const handleAdd = async () => {
    if (!entityId || !personId) return
    setSaving(true)
    setError(null)
    try {
      if (mode === 'course') {
        await connectService.addToCourseRoster(entityId, {
          hub_person_id: Number(personId),
          role: courseTab,
        })
      } else {
        await connectService.addToClassRoster(entityId, Number(personId))
      }
      setPersonId('')
      await loadRoster()
      onChanged?.()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t('connectComponents.rosterDrawer.linkError')
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleImportClass = async () => {
    if (!entityId || !selectedClassId) return
    setImportingClass(true)
    setError(null)
    setClassSuccess(null)
    try {
      const result = await connectService.enrollCourseRosterFromClass(entityId, Number(selectedClassId))
      setSelectedClassId('')
      setClassSuccess(
        t('connectComponents.rosterDrawer.importClassSuccess', {
          className: result.class_name,
          enrolled: result.enrolled,
          total: result.total,
        }),
      )
      await loadRoster()
      onChanged?.()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string; errors?: { connect_class_id?: string[] } } } })?.response
          ?.data?.errors?.connect_class_id?.[0] ??
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t('connectComponents.rosterDrawer.importClassError')
      setError(message)
    } finally {
      setImportingClass(false)
    }
  }

  const handleRemove = async (person: HubPerson, role?: CourseRosterRole) => {
    if (!entityId) return
    setSaving(true)
    setError(null)
    try {
      if (mode === 'course' && role) {
        await connectService.removeFromCourseRoster(entityId, person.id, role)
      } else if (mode === 'class') {
        await connectService.removeFromClassRoster(entityId, person.id)
      }
      await loadRoster()
      onChanged?.()
    } catch {
      setError(t('connectComponents.rosterDrawer.unlinkError'))
    } finally {
      setSaving(false)
    }
  }

  const renderPersonRow = (person: HubPerson, role?: CourseRosterRole) => (
    <li
      key={`${person.id}-${role ?? 'class'}`}
      className="flex items-center justify-between gap-3 rounded-xl border border-hub-border/50 bg-hub-bg/30 px-3 py-2.5"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-hub-navy">{personDisplayName(person)}</p>
        <p className="truncate text-xs text-hub-text-muted">
          {hubPersonKindLabel(person.kind)}
          {person.registration_number ? ` · ${person.registration_number}` : ''}
          {person.email ? ` · ${person.email}` : ''}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <StatusBadge status={person.status} />
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleRemove(person, role)}
          className="rounded-lg p-2 text-hub-text-muted transition hover:bg-white hover:text-hub-red"
          aria-label={t('connectComponents.rosterDrawer.removePerson', { name: personDisplayName(person) })}
        >
          <UserMinus className="h-4 w-4" />
        </button>
      </div>
    </li>
  )

  const title = mode === 'course' ? t('connectComponents.rosterDrawer.courseTitle') : t('connectComponents.rosterDrawer.classTitle')
  const subtitle = entityName ? `${title} · ${entityName}` : title

  return (
    <ConnectDrawer
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      width="lg"
      footer={
        <div className="flex justify-end">
          <OutlineButton onClick={onClose}>{t('connectComponents.rosterDrawer.close')}</OutlineButton>
        </div>
      }
    >
      {mode === 'course' && (
        <div className="mb-4 flex flex-wrap gap-2">
          {(['student', 'teacher', 'coordinator'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setCourseTab(tab)
                setPersonId('')
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                courseTab === tab ? 'bg-hub-red text-white' : 'bg-hub-bg text-hub-text-muted hover:text-hub-navy'
              }`}
            >
              {courseRosterRoleLabel(tab)}
              {courseRoster && (
                <span className="ml-1 opacity-80">
                  (
                  {tab === 'student'
                    ? courseRoster.students.length
                    : tab === 'teacher'
                      ? courseRoster.teachers.length
                      : courseRoster.coordinators.length}
                  )
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {mode === 'course' && courseTab === 'student' && (
        <section className="glass-panel mb-6 rounded-xl p-4">
          <h3 className="mb-1 text-sm font-semibold text-hub-navy">
            {t('connectComponents.rosterDrawer.addClassTitle')}
          </h3>
          <p className="mb-3 text-xs text-hub-text-muted">{t('connectComponents.rosterDrawer.addClassHint')}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <FormField label={t('connectComponents.rosterDrawer.classField')}>
                <select
                  className={selectClass}
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value)
                    setClassSuccess(null)
                    setError(null)
                  }}
                  disabled={importingClass || availableClasses.length === 0}
                >
                  <option value="">
                    {availableClasses.length === 0
                      ? t('connectComponents.rosterDrawer.noClassesAvailable')
                      : t('connectComponents.rosterDrawer.selectClassPlaceholder')}
                  </option>
                  {availableClasses.map((turma) => (
                    <option key={turma.id} value={turma.id}>
                      {classOptionLabel(turma)}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
            <PrimaryButton
              onClick={() => void handleImportClass()}
              disabled={importingClass || saving || !selectedClassId}
            >
              {importingClass ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GraduationCap className="h-4 w-4" />
              )}
              {t('connectComponents.rosterDrawer.importClass')}
            </PrimaryButton>
          </div>
          {classSuccess && <p className="mt-2 text-xs text-emerald-700">{classSuccess}</p>}
        </section>
      )}

      <section className="glass-panel mb-6 rounded-xl p-4">
        <h3 className="mb-3 text-sm font-semibold text-hub-navy">
          {mode === 'course' && courseTab === 'student'
            ? t('connectComponents.rosterDrawer.addIndividualTitle')
            : t('connectComponents.rosterDrawer.addLink')}
        </h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <FormField label={t('connectComponents.rosterDrawer.personField')}>
              <select
                className={selectClass}
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                disabled={saving || availablePeople.length === 0}
              >
                <option value="">
                  {availablePeople.length === 0
                    ? t('connectComponents.rosterDrawer.noPeopleAvailable')
                    : t('connectComponents.rosterDrawer.selectPlaceholder')}
                </option>
                {availablePeople.map((p) => (
                  <option key={p.id} value={p.id}>
                    {personDisplayName(p)} — {hubPersonKindLabel(p.kind)}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <PrimaryButton onClick={() => void handleAdd()} disabled={saving || !personId}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {t('connectComponents.rosterDrawer.link')}
          </PrimaryButton>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-hub-navy">{t('connectComponents.rosterDrawer.linked')}</h3>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-hub-text-muted">
            <Loader2 className="h-5 w-5 animate-spin text-hub-red" />
            {t('connectComponents.rosterDrawer.loading')}
          </div>
        ) : mode === 'course' ? (
          <ul className="space-y-2">
            {currentCourseList().length === 0 ? (
              <p className="py-6 text-center text-sm text-hub-text-muted">{t('connectComponents.rosterDrawer.noPeopleInRole')}</p>
            ) : (
              currentCourseList().map((p) => renderPersonRow(p, courseTab))
            )}
          </ul>
        ) : (
          <ul className="space-y-2">
            {classRoster.length === 0 ? (
              <p className="py-6 text-center text-sm text-hub-text-muted">{t('connectComponents.rosterDrawer.noStudentsInClass')}</p>
            ) : (
              classRoster.map((p) => renderPersonRow(p))
            )}
          </ul>
        )}
      </section>
    </ConnectDrawer>
  )
}
