import { Loader2, UserMinus, UserPlus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { connectService } from '../../services/connectService'
import type { CourseRoster, CourseRosterRole, HubPerson } from '../../types/connect'
import {
  COURSE_ROSTER_ROLE_LABELS,
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
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [courseRoster, setCourseRoster] = useState<CourseRoster | null>(null)
  const [classRoster, setClassRoster] = useState<HubPerson[]>([])
  const [courseTab, setCourseTab] = useState<CourseTab>('student')
  const [personId, setPersonId] = useState('')
  const [peopleOptions, setPeopleOptions] = useState<HubPerson[]>([])

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
      setError('Não foi possível carregar as matrículas.')
    } finally {
      setLoading(false)
    }
  }, [entityId, mode, open])

  useEffect(() => {
    if (open && entityId) {
      void loadRoster()
    } else {
      setCourseRoster(null)
      setClassRoster([])
      setPersonId('')
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
        'Não foi possível vincular a pessoa.'
      setError(message)
    } finally {
      setSaving(false)
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
      setError('Não foi possível remover o vínculo.')
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
          aria-label={`Remover ${personDisplayName(person)}`}
        >
          <UserMinus className="h-4 w-4" />
        </button>
      </div>
    </li>
  )

  const title = mode === 'course' ? 'Matrículas do curso' : 'Alunos da turma'
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
          <OutlineButton onClick={onClose}>Fechar</OutlineButton>
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
              {COURSE_ROSTER_ROLE_LABELS[tab]}
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

      <section className="glass-panel mb-6 rounded-xl p-4">
        <h3 className="mb-3 text-sm font-semibold text-hub-navy">Adicionar vínculo</h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
          <FormField label="Pessoa">
            <select
              className={selectClass}
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              disabled={saving || availablePeople.length === 0}
            >
              <option value="">
                {availablePeople.length === 0 ? 'Nenhuma pessoa disponível' : 'Selecione...'}
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
            Vincular
          </PrimaryButton>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-hub-navy">Vinculados</h3>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-hub-text-muted">
            <Loader2 className="h-5 w-5 animate-spin text-hub-red" />
            Carregando...
          </div>
        ) : mode === 'course' ? (
          <ul className="space-y-2">
            {currentCourseList().length === 0 ? (
              <p className="py-6 text-center text-sm text-hub-text-muted">Nenhuma pessoa neste papel.</p>
            ) : (
              currentCourseList().map((p) => renderPersonRow(p, courseTab))
            )}
          </ul>
        ) : (
          <ul className="space-y-2">
            {classRoster.length === 0 ? (
              <p className="py-6 text-center text-sm text-hub-text-muted">Nenhum aluno na turma.</p>
            ) : (
              classRoster.map((p) => renderPersonRow(p))
            )}
          </ul>
        )}
      </section>
    </ConnectDrawer>
  )
}
