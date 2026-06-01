export interface PaginatedMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginatedMeta
}

export type HubPersonKind = 'student' | 'teacher' | 'staff' | 'other'

export type CourseRosterRole = 'student' | 'teacher' | 'coordinator'

export interface HubPersonPivot {
  role?: CourseRosterRole | 'student'
  status?: string
  enrolled_at?: string | null
  joined_at?: string | null
}

export interface HubPerson {
  id: number
  kind: HubPersonKind
  user_id?: number | null
  full_name: string
  cpf?: string | null
  registration_number?: string | null
  email?: string | null
  phone?: string | null
  birth_date?: string | null
  specialty?: string | null
  status: string
  pivot?: HubPersonPivot
  created_at?: string
}

export interface CourseRoster {
  course_id: number
  course_name: string
  students: HubPerson[]
  teachers: HubPerson[]
  coordinators: HubPerson[]
}

export interface ConnectCourse {
  id: number
  code: string
  name: string
  description?: string
  workload_hours?: number
  area?: string
  status: string
  classes_count?: number
}

export interface ConnectTeacher {
  id: number
  hub_person_id?: number | null
  hub_person?: HubPerson
  full_name: string
  email: string
  specialty?: string
  cpf?: string
  phone?: string
  status: string
  classes_count?: number
}

export interface ConnectClass {
  id: number
  connect_course_id?: number
  connect_teacher_id?: number | null
  code: string
  name: string
  shift?: string
  start_date?: string
  end_date?: string
  capacity?: number
  default_lessons_per_day?: number
  max_absences_allowed?: number | null
  status: string
  course?: ConnectCourse
  teacher?: ConnectTeacher
  students_count?: number
}

export interface ConnectStudent {
  id: number
  hub_person_id?: number | null
  connect_class_id?: number | null
  hub_person?: HubPerson
  full_name: string
  cpf?: string
  registration_number?: string
  email?: string
  phone?: string
  birth_date?: string
  status: string
  max_absences_allowed?: number | null
  class?: ConnectClass
  location?: ConnectStudentLocation
  created_at?: string
}

export interface ConnectStudentLocation {
  id: number
  connect_student_id: number
  latitude?: number
  longitude?: number
  address?: string
  city?: string
  state?: string
  last_seen_at?: string
  status: string
  student?: ConnectStudent
}

export interface ConnectActivity {
  id: number
  title: string
  description: string
  type: string
  performed_by: string
  occurred_at: string
}

export interface ConnectAlert {
  id: number
  title: string
  message: string
  type: string
  category?: string
  created_at: string
}

export interface ConnectContract {
  id: number
  connect_student_id: number
  contract_type: string
  start_date: string
  end_date?: string
  monthly_value: number
  company_name?: string
  status: string
  student?: ConnectStudent
}

export interface ConnectSalaryRecord {
  id: number
  connect_student_id: number
  reference_month: string
  base_amount: number
  deductions: number
  bonuses: number
  net_amount: number
  status: string
  student?: ConnectStudent
}

export interface ConnectAttendanceAbsenceSummary {
  unjustified_lessons_total: number
  max_absences_allowed: number | null
  remaining_absences: number | null
}

export interface ConnectAttendanceMark {
  id: number
  connect_student_id: number
  status: 'present' | 'absent' | 'justified' | 'late'
  missed_lessons?: number
  notes?: string | null
  student?: ConnectStudent
  absence_summary?: ConnectAttendanceAbsenceSummary
}

export interface ConnectAttendanceSession {
  id: number
  connect_class_id: number
  session_date: string
  subject: string
  lessons_count?: number
  status: string
  class?: ConnectClass
  teacher?: ConnectTeacher
  marks?: ConnectAttendanceMark[]
  attendance_settings?: {
    default_lessons_per_day: number
    max_absences_allowed: number | null
  }
  stats?: {
    total: number
    present: number
    justified: number
    absent: number
    presence_rate: number
    lessons_count: number
    missed_lessons_total?: number
  }
}

export interface KpiTrend {
  direction: 'up' | 'down' | 'neutral'
  value: string
  label: string
}

export interface DashboardKpiSparklines {
  students: number[]
  teachers: number[]
  classes: number[]
  courses: number[]
  attendance: number[]
  contracts: number[]
}

export interface DashboardData {
  kpis: {
    total_students: number
    total_teachers: number
    active_classes: number
    active_courses: number
    active_contracts: number
    attendance_rate: number
    pending_alerts: number
  }
  kpi_sparklines?: DashboardKpiSparklines
  kpi_trends?: {
    students: KpiTrend
    teachers: KpiTrend
    classes: KpiTrend
    courses: KpiTrend
    attendance: KpiTrend
    contracts: KpiTrend
  }
  attendance_breakdown: {
    present: number
    justified: number
    unjustified: number
    rate: number
  }
  students_by_course: { name: string; count: number }[]
  classes_by_teacher: { name: string; sessions: number }[]
  recent_activities: ConnectActivity[]
  alerts: ConnectAlert[]
  cadastros: ConnectStudent[]
}

export interface SalaryCalculationResult {
  data: ConnectSalaryRecord
  attendance: {
    total_days: number
    present_days: number
    justified_absences: number
    unjustified_absences: number
    rate: number
  }
  daily_rate: number
}
