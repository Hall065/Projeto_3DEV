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
  full_name: string
  email: string
  specialty?: string
  status: string
  classes_count?: number
}

export interface ConnectClass {
  id: number
  code: string
  name: string
  shift?: string
  start_date?: string
  end_date?: string
  capacity?: number
  status: string
  course?: ConnectCourse
  teacher?: ConnectTeacher
  students_count?: number
}

export interface ConnectStudent {
  id: number
  full_name: string
  cpf?: string
  registration_number?: string
  email?: string
  phone?: string
  birth_date?: string
  status: string
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

export interface ConnectAttendanceMark {
  id: number
  connect_student_id: number
  status: 'present' | 'absent' | 'justified' | 'late'
  student?: ConnectStudent
}

export interface ConnectAttendanceSession {
  id: number
  connect_class_id: number
  session_date: string
  subject: string
  status: string
  class?: ConnectClass
  teacher?: ConnectTeacher
  marks?: ConnectAttendanceMark[]
  stats?: {
    total: number
    present: number
    justified: number
    absent: number
    presence_rate: number
    lessons_count: number
  }
}

export interface KpiTrend {
  direction: 'up' | 'down' | 'neutral'
  value: string
  label: string
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
  kpi_trends: {
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
