import type {
  ConnectClass,
  ConnectContract,
  ConnectCourse,
  ConnectSalaryRecord,
  ConnectStudent,
  ConnectTeacher,
  HubPerson,
} from './connect'

export type ConnectViewKind =
  | 'student'
  | 'teacher'
  | 'class'
  | 'course'
  | 'person'
  | 'contract'
  | 'salary'
  | 'attendance'
  | 'location'
  | 'grid-ticket'
  | 'grid-user'
  | 'grid-inventory'

export interface CourseEnrollmentRow {
  course_id?: number
  course: ConnectCourse
  role?: string
  enrolled_at?: string | null
  status?: string
  via_class?: string
}

export interface StudentProfileData {
  student: ConnectStudent
  contracts: ConnectContract[]
  salaries: ConnectSalaryRecord[]
  courses_active: CourseEnrollmentRow[]
  courses_completed: CourseEnrollmentRow[]
  classes: ConnectClass[]
}

export interface TeacherProfileData {
  teacher: ConnectTeacher
  classes: ConnectClass[]
  courses: { course: ConnectCourse; status?: string; enrolled_at?: string | null }[]
}

export interface ClassProfileData {
  class: ConnectClass
  students: ConnectStudent[]
}

export interface CourseProfileData {
  course: ConnectCourse
  classes: ConnectClass[]
  roster: {
    students: HubPerson[]
    teachers: HubPerson[]
    coordinators: HubPerson[]
  }
}

export interface PersonProfileData {
  person: HubPerson
  connect_student: ConnectStudent | null
  connect_teacher: ConnectTeacher | null
  courses: HubPerson[]
}

export interface ContractProfileData {
  contract: ConnectContract
}
