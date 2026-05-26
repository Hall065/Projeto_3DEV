import type { ConnectStudent, ConnectTeacher, HubPerson, HubPersonKind } from '../types/connect'

export function personDisplayName(person: Pick<HubPerson, 'full_name'> | null | undefined, fallback = '—'): string {
  return person?.full_name?.trim() || fallback
}

export function studentDisplayName(student: ConnectStudent): string {
  return personDisplayName(student.hub_person, student.full_name)
}

export function teacherDisplayName(teacher: ConnectTeacher): string {
  return personDisplayName(teacher.hub_person, teacher.full_name)
}

export function studentHubPersonId(student: ConnectStudent): number | undefined {
  return student.hub_person_id ?? student.hub_person?.id
}

export function teacherHubPersonId(teacher: ConnectTeacher): number | undefined {
  return teacher.hub_person_id ?? teacher.hub_person?.id
}

export const HUB_PERSON_KIND_LABELS: Record<HubPersonKind, string> = {
  student: 'Aluno',
  teacher: 'Professor',
  staff: 'Funcionário',
  other: 'Outro',
}

export function hubPersonKindLabel(kind: HubPersonKind): string {
  return HUB_PERSON_KIND_LABELS[kind] ?? kind
}

export const COURSE_ROSTER_ROLE_LABELS = {
  student: 'Aluno',
  teacher: 'Professor',
  coordinator: 'Coordenador',
} as const
