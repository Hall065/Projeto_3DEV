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
  metadata?: Record<string, string | undefined>
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
  start_date?: string | null
  end_date?: string | null
  area?: string
  status: string
  classes_count?: number
}

export interface ConnectWeeklyPattern {
  id?: number
  connect_class_id?: number
  day_of_week: number
  start_time: string
  end_time: string
  lessons_count: number
  subject: string
}

export interface ConnectSchedulePlan {
  workload_hours: number
  scheduled_lessons: number
  remaining_lessons: number | null
  weekly_lessons: number
  estimated_weeks: number | null
  class_start_date?: string | null
  class_end_date?: string | null
  course_start_date?: string | null
  course_end_date?: string | null
  semester?: string | null
  patterns_count: number
}

export interface ConnectLessonSchedule {
  id: number
  connect_class_id: number
  connect_teacher_id?: number | null
  scheduled_date: string
  start_time: string
  end_time: string
  subject: string
  lessons_count: number
  status: string
  notes?: string | null
  class?: ConnectClass
  teacher?: ConnectTeacher
  attendance_session_id?: number | null
  has_attendance?: boolean
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
  semester?: string | null
  start_date?: string
  end_date?: string
  weekly_patterns?: ConnectWeeklyPattern[]
  schedule_plan?: ConnectSchedulePlan
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
  weekly_hours?: number | null
  start_date: string
  end_date?: string
  monthly_value: number
  company_name?: string
  company_email?: string | null
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
  status_label?: string
  calculated_at?: string | null
  student?: ConnectStudent
}

export interface SalaryListSummary {
  total_records: number
  total_base: number
  total_net: number
  total_deductions: number
  total_bonuses: number
}

export interface SalaryAttendanceSummary {
  total_days: number
  present_days: number
  justified_absences: number
  unjustified_absences: number
  rate: number
}

export interface SalaryPreviewData {
  student: {
    id: number
    full_name: string
    registration_number?: string
    class_name?: string
    course_name?: string
  }
  reference_month: string
  attendance: SalaryAttendanceSummary
  daily_rate: number
  contract: {
    id: number
    company_name: string
    monthly_value: number
    status: string
  } | null
  amounts: {
    base: number
    bonuses: number
    deductions: number
    net: number
    absence_deduction: number
  }
  breakdown: { label: string; value: number; type: 'base' | 'bonus' | 'deduction' | 'net' }[]
  work_days: number
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
  connect_lesson_schedule_id?: number | null
  session_date: string
  subject: string
  lesson_schedule?: ConnectLessonSchedule
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
  attendance: SalaryAttendanceSummary
  daily_rate: number
  contract?: SalaryPreviewData['contract']
  breakdown?: SalaryPreviewData['breakdown']
  message?: string
}

export interface SalariesListResponse {
  data: ConnectSalaryRecord[]
  meta: PaginatedMeta
  summary?: SalaryListSummary
}
