import i18n from '../i18n'
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

export function hubPersonKindLabel(kind: HubPersonKind): string {
  return i18n.t(`connect.personKind.${kind}`)
}

export type CourseRosterRole = 'student' | 'teacher' | 'coordinator'

export function courseRosterRoleLabel(role: CourseRosterRole): string {
  if (role === 'coordinator') {
    return i18n.t('connect.rosterRole.coordinator')
  }
  return i18n.t(`connect.personKind.${role}`)
}

/** @deprecated Use courseRosterRoleLabel */
export const COURSE_ROSTER_ROLE_LABELS = {
  get student() {
    return courseRosterRoleLabel('student')
  },
  get teacher() {
    return courseRosterRoleLabel('teacher')
  },
  get coordinator() {
    return courseRosterRoleLabel('coordinator')
  },
} as const
