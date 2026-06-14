import api from './api'
import type { CampusPersonLocation } from '../types/campusPeople'
import type {
  ConnectAttendanceSession,
  ConnectClass,
  ConnectContract,
  ConnectCourse,
  ConnectLessonSchedule,
  ConnectSchedulePlan,
  ConnectStudent,
  ConnectWeeklyPattern,
  ConnectStudentLocation,
  ConnectTeacher,
  CourseRoster,
  CourseRosterRole,
  DashboardData,
  HubPerson,
  HubPersonKind,
  PaginatedResponse,
  SalariesListResponse,
  SalaryCalculationResult,
  SalaryPreviewData,
} from '../types/connect'
import type {
  ClassProfileData,
  ContractProfileData,
  CourseProfileData,
  PersonProfileData,
  StudentProfileData,
  TeacherProfileData,
} from '../types/connectView'

function unwrapPaginated<T>(payload: PaginatedResponse<T>): PaginatedResponse<T> {
  return payload
}

export const connectService = {
  async getDashboard(): Promise<DashboardData> {
    const { data } = await api.get<{ data: DashboardData }>('/connect/dashboard')
    return data.data
  },

  async getStudents(params?: Record<string, string | number>): Promise<PaginatedResponse<ConnectStudent>> {
    const { data } = await api.get<PaginatedResponse<ConnectStudent>>('/connect/students', { params })
    return unwrapPaginated(data)
  },

  async createStudent(payload: Partial<ConnectStudent> & { connect_class_id?: number | null }): Promise<ConnectStudent> {
    const { data } = await api.post<{ data: ConnectStudent }>('/connect/students', payload)
    return data.data
  },

  async updateStudent(id: number, payload: Partial<ConnectStudent> & { connect_class_id?: number | null }): Promise<ConnectStudent> {
    const { data } = await api.put<{ data: ConnectStudent }>(`/connect/students/${id}`, payload)
    return data.data
  },

  async deleteStudent(id: number): Promise<void> {
    await api.delete(`/connect/students/${id}`)
  },

  async getTeachers(params?: Record<string, string | number>): Promise<PaginatedResponse<ConnectTeacher>> {
    const { data } = await api.get<PaginatedResponse<ConnectTeacher>>('/connect/teachers', { params })
    return unwrapPaginated(data)
  },

  async createTeacher(payload: Partial<ConnectTeacher>): Promise<ConnectTeacher> {
    const { data } = await api.post<{ data: ConnectTeacher }>('/connect/teachers', payload)
    return data.data
  },

  async updateTeacher(id: number, payload: Partial<ConnectTeacher>): Promise<ConnectTeacher> {
    const { data } = await api.put<{ data: ConnectTeacher }>(`/connect/teachers/${id}`, payload)
    return data.data
  },

  async deleteTeacher(id: number): Promise<void> {
    await api.delete(`/connect/teachers/${id}`)
  },

  async getClasses(params?: Record<string, string | number>): Promise<PaginatedResponse<ConnectClass>> {
    const { data } = await api.get<PaginatedResponse<ConnectClass>>('/connect/classes', { params })
    return unwrapPaginated(data)
  },

  async createClass(payload: Record<string, unknown>): Promise<ConnectClass> {
    const { data } = await api.post<{ data: ConnectClass }>('/connect/classes', payload)
    return data.data
  },

  async updateClass(id: number, payload: Record<string, unknown>): Promise<ConnectClass> {
    const { data } = await api.put<{ data: ConnectClass }>(`/connect/classes/${id}`, payload)
    return data.data
  },

  async deleteClass(id: number): Promise<void> {
    await api.delete(`/connect/classes/${id}`)
  },

  async getCourses(params?: Record<string, string | number>): Promise<PaginatedResponse<ConnectCourse>> {
    const { data } = await api.get<PaginatedResponse<ConnectCourse>>('/connect/courses', { params })
    return unwrapPaginated(data)
  },

  async createCourse(payload: Record<string, unknown>): Promise<ConnectCourse> {
    const { data } = await api.post<{ data: ConnectCourse }>('/connect/courses', payload)
    return data.data
  },

  async updateCourse(id: number, payload: Record<string, unknown>): Promise<ConnectCourse> {
    const { data } = await api.put<{ data: ConnectCourse }>(`/connect/courses/${id}`, payload)
    return data.data
  },

  async deleteCourse(id: number): Promise<void> {
    await api.delete(`/connect/courses/${id}`)
  },

  async getCalendar(params: Record<string, string | number>): Promise<ConnectLessonSchedule[]> {
    const { data } = await api.get<{ data: ConnectLessonSchedule[] }>('/connect/calendar', { params })
    return data.data
  },

  async createCalendarLesson(payload: Record<string, unknown>): Promise<ConnectLessonSchedule> {
    const { data } = await api.post<{ data: ConnectLessonSchedule }>('/connect/calendar/lessons', payload)
    return data.data
  },

  async updateCalendarLesson(id: number, payload: Record<string, unknown>): Promise<ConnectLessonSchedule> {
    const { data } = await api.put<{ data: ConnectLessonSchedule }>(`/connect/calendar/lessons/${id}`, payload)
    return data.data
  },

  async deleteCalendarLesson(id: number): Promise<void> {
    await api.delete(`/connect/calendar/lessons/${id}`)
  },

  async getWeeklyPatterns(classId: number): Promise<{ patterns: ConnectWeeklyPattern[]; plan: ConnectSchedulePlan }> {
    const { data } = await api.get<{ data: ConnectWeeklyPattern[]; plan: ConnectSchedulePlan }>(
      `/connect/classes/${classId}/weekly-patterns`,
    )
    return { patterns: data.data, plan: data.plan }
  },

  async syncWeeklyPatterns(
    classId: number,
    payload: { patterns: ConnectWeeklyPattern[]; generate?: boolean; replace_future?: boolean },
  ): Promise<{ patterns: ConnectWeeklyPattern[]; plan: ConnectSchedulePlan; generation?: { created: number; skipped: number; errors: string[] } }> {
    const { data } = await api.put<{
      data: ConnectWeeklyPattern[]
      plan: ConnectSchedulePlan
      generation?: { created: number; skipped: number; errors: string[] }
    }>(`/connect/classes/${classId}/weekly-patterns`, payload)
    return { patterns: data.data, plan: data.plan, generation: data.generation }
  },

  async generateClassSchedule(
    classId: number,
    replaceFuture = false,
  ): Promise<{ plan: ConnectSchedulePlan; generation: { created: number; skipped: number; errors: string[] } }> {
    const { data } = await api.post<{
      plan: ConnectSchedulePlan
      generation: { created: number; skipped: number; errors: string[] }
    }>(`/connect/classes/${classId}/generate-schedule`, { replace_future: replaceFuture })
    return { plan: data.plan, generation: data.generation }
  },

  async getCalendarSemesters(): Promise<string[]> {
    const { data } = await api.get<{ data: string[] }>('/connect/calendar/semesters')
    return data.data
  },

  async provisionClassAttendance(classId: number): Promise<{ created: number; skipped: number }> {
    const { data } = await api.post<{ data: { created: number; skipped: number } }>(
      `/connect/classes/${classId}/provision-attendance`,
    )
    return data.data
  },

  async getClassAttendanceSummary(params: {
    connect_class_id: number
    from_date?: string
    to_date?: string
  }): Promise<import('../types/connect').ConnectClassAttendanceSummary> {
    const { data } = await api.get<{ data: import('../types/connect').ConnectClassAttendanceSummary }>(
      '/connect/attendance/class-summary',
      { params },
    )
    return data.data
  },

  async getAttendanceSession(params: Record<string, string | number>): Promise<ConnectAttendanceSession> {
    const { data } = await api.get<{ data: ConnectAttendanceSession }>('/connect/attendance/session', { params })
    return data.data
  },

  async saveAttendanceMarks(
    sessionId: number,
    payload: {
      marks: {
        connect_student_id: number
        status: string
        missed_lessons?: number
        max_absences_allowed?: number | null
      }[]
      lessons_count?: number
      max_absences_allowed?: number | null
      default_lessons_per_day?: number
      close_session?: boolean
    },
  ): Promise<ConnectAttendanceSession> {
    const { data } = await api.post<{ data: ConnectAttendanceSession }>(
      `/connect/attendance/sessions/${sessionId}/marks`,
      { ...payload, close_session: payload.close_session ?? true },
    )
    return data.data
  },

  async getAttendanceRecords(params?: Record<string, string | number>): Promise<PaginatedResponse<ConnectAttendanceSession>> {
    const { data } = await api.get<PaginatedResponse<ConnectAttendanceSession>>('/connect/attendance/records', { params })
    return unwrapPaginated(data)
  },

  async getLocations(params?: Record<string, string | number>): Promise<PaginatedResponse<ConnectStudentLocation>> {
    const { data } = await api.get<PaginatedResponse<ConnectStudentLocation>>('/connect/locations', { params })
    return unwrapPaginated(data)
  },

  async getCampusPeople(): Promise<CampusPersonLocation[]> {
    const { data } = await api.get<{
      data: Array<{
        id: string
        name: string
        role: string
        block_id: string
        room?: string
        detail?: string
        position?: { x: number; y: number; z: number }
      }>
    }>('/connect/campus-people')

    return data.data.map((person) => ({
      id: person.id,
      name: person.name,
      role: person.role as CampusPersonLocation['role'],
      blockId: person.block_id as CampusPersonLocation['blockId'],
      room: person.room,
      detail: person.detail,
      position: person.position,
    }))
  },

  async getContracts(params?: Record<string, string | number>): Promise<PaginatedResponse<ConnectContract>> {
    const { data } = await api.get<PaginatedResponse<ConnectContract>>('/connect/contracts', { params })
    return unwrapPaginated(data)
  },

  async createContract(payload: Record<string, unknown>): Promise<ConnectContract> {
    const { data } = await api.post<{ data: ConnectContract }>('/connect/contracts', payload)
    return data.data
  },

  async updateContract(id: number, payload: Record<string, unknown>): Promise<ConnectContract> {
    const { data } = await api.put<{ data: ConnectContract }>(`/connect/contracts/${id}`, payload)
    return data.data
  },

  async deleteContract(id: number): Promise<void> {
    await api.delete(`/connect/contracts/${id}`)
  },

  async getSalaries(params?: Record<string, string | number>): Promise<SalariesListResponse> {
    const { data } = await api.get<SalariesListResponse>('/connect/salaries', { params })
    return data
  },

  async previewSalary(params: {
    connect_student_id: number
    reference_month: string
    bonuses?: number
    deductions?: number
  }): Promise<SalaryPreviewData> {
    const { data } = await api.get<{ data: SalaryPreviewData }>('/connect/salaries/preview', { params })
    return data.data
  },

  async calculateSalary(payload: {
    connect_student_id: number
    reference_month: string
    bonuses?: number
    deductions?: number
  }): Promise<SalaryCalculationResult> {
    const { data } = await api.post<SalaryCalculationResult>('/connect/salaries/calculate', payload)
    return data
  },

  async calculateSalaryBatch(reference_month: string): Promise<{ processed: number; message: string }> {
    const { data } = await api.post<{ processed: number; message: string }>('/connect/salaries/calculate-batch', {
      reference_month,
    })
    return data
  },

  async getPeople(params?: Record<string, string | number>): Promise<PaginatedResponse<HubPerson>> {
    const { data } = await api.get<PaginatedResponse<HubPerson>>('/connect/people', { params })
    return unwrapPaginated(data)
  },

  async createPerson(payload: {
    kind: HubPersonKind
    full_name: string
    cpf?: string
    email?: string
    phone?: string
    registration_number?: string
    birth_date?: string
    specialty?: string
    status?: string
  }): Promise<HubPerson> {
    const { data } = await api.post<{ data: HubPerson }>('/connect/people', payload)
    return data.data
  },

  async updatePerson(id: number, payload: Partial<HubPerson>): Promise<HubPerson> {
    const { data } = await api.put<{ data: HubPerson }>(`/connect/people/${id}`, payload)
    return data.data
  },

  async deletePerson(id: number): Promise<void> {
    await api.delete(`/connect/people/${id}`)
  },

  async getCourseRoster(courseId: number): Promise<CourseRoster> {
    const { data } = await api.get<{ data: CourseRoster }>(`/connect/courses/${courseId}/roster`)
    return data.data
  },

  async addToCourseRoster(
    courseId: number,
    payload: { hub_person_id: number; role: CourseRosterRole },
  ): Promise<HubPerson> {
    const { data } = await api.post<{ data: HubPerson }>(`/connect/courses/${courseId}/roster`, payload)
    return data.data
  },

  async removeFromCourseRoster(courseId: number, personId: number, role: CourseRosterRole): Promise<void> {
    await api.delete(`/connect/courses/${courseId}/roster/${personId}`, { params: { role } })
  },

  async getClassRoster(classId: number): Promise<HubPerson[]> {
    const { data } = await api.get<{ data: HubPerson[] }>(`/connect/classes/${classId}/roster`)
    return data.data
  },

  async addToClassRoster(classId: number, hubPersonId: number): Promise<HubPerson> {
    const { data } = await api.post<{ data: HubPerson }>(`/connect/classes/${classId}/roster`, {
      hub_person_id: hubPersonId,
    })
    return data.data
  },

  async removeFromClassRoster(classId: number, personId: number): Promise<void> {
    await api.delete(`/connect/classes/${classId}/roster/${personId}`)
  },

  async getStudentProfile(id: number): Promise<StudentProfileData> {
    const { data } = await api.get<{ data: StudentProfileData }>(`/connect/students/${id}/profile`)
    return data.data
  },

  async getTeacherProfile(id: number): Promise<TeacherProfileData> {
    const { data } = await api.get<{ data: TeacherProfileData }>(`/connect/teachers/${id}/profile`)
    return data.data
  },

  async getClassProfile(id: number): Promise<ClassProfileData> {
    const { data } = await api.get<{ data: ClassProfileData }>(`/connect/classes/${id}/profile`)
    return data.data
  },

  async getCourseProfile(id: number): Promise<CourseProfileData> {
    const { data } = await api.get<{ data: CourseProfileData }>(`/connect/courses/${id}/profile`)
    return data.data
  },

  async getPersonProfile(id: number): Promise<PersonProfileData> {
    const { data } = await api.get<{ data: PersonProfileData }>(`/connect/people/${id}/profile`)
    return data.data
  },

  async getContractProfile(id: number): Promise<ContractProfileData> {
    const { data } = await api.get<{ data: ContractProfileData }>(`/connect/contracts/${id}/profile`)
    return data.data
  },
}
