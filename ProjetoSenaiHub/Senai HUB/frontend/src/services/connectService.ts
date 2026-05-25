import api from './api'
import type {
  ConnectAttendanceSession,
  ConnectClass,
  ConnectContract,
  ConnectCourse,
  ConnectSalaryRecord,
  ConnectStudent,
  ConnectStudentLocation,
  ConnectTeacher,
  DashboardData,
  PaginatedResponse,
  SalaryCalculationResult,
} from '../types/connect'

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

  async createStudent(payload: Partial<ConnectStudent> & { connect_class_id?: number }): Promise<ConnectStudent> {
    const { data } = await api.post<{ data: ConnectStudent }>('/connect/students', payload)
    return data.data
  },

  async getTeachers(params?: Record<string, string | number>): Promise<PaginatedResponse<ConnectTeacher>> {
    const { data } = await api.get<PaginatedResponse<ConnectTeacher>>('/connect/teachers', { params })
    return unwrapPaginated(data)
  },

  async createTeacher(payload: Partial<ConnectTeacher>): Promise<ConnectTeacher> {
    const { data } = await api.post<{ data: ConnectTeacher }>('/connect/teachers', payload)
    return data.data
  },

  async getClasses(params?: Record<string, string | number>): Promise<PaginatedResponse<ConnectClass>> {
    const { data } = await api.get<PaginatedResponse<ConnectClass>>('/connect/classes', { params })
    return unwrapPaginated(data)
  },

  async createClass(payload: Record<string, unknown>): Promise<ConnectClass> {
    const { data } = await api.post<{ data: ConnectClass }>('/connect/classes', payload)
    return data.data
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

  async getAttendanceSession(params: Record<string, string | number>): Promise<ConnectAttendanceSession> {
    const { data } = await api.get<{ data: ConnectAttendanceSession }>('/connect/attendance/session', { params })
    return data.data
  },

  async saveAttendanceMarks(
    sessionId: number,
    marks: { connect_student_id: number; status: string }[],
  ): Promise<ConnectAttendanceSession> {
    const { data } = await api.post<{ data: ConnectAttendanceSession }>(
      `/connect/attendance/sessions/${sessionId}/marks`,
      { marks, close_session: true },
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

  async getContracts(params?: Record<string, string | number>): Promise<PaginatedResponse<ConnectContract>> {
    const { data } = await api.get<PaginatedResponse<ConnectContract>>('/connect/contracts', { params })
    return unwrapPaginated(data)
  },

  async createContract(payload: Record<string, unknown>): Promise<ConnectContract> {
    const { data } = await api.post<{ data: ConnectContract }>('/connect/contracts', payload)
    return data.data
  },

  async getSalaries(params?: Record<string, string | number>): Promise<PaginatedResponse<ConnectSalaryRecord>> {
    const { data } = await api.get<PaginatedResponse<ConnectSalaryRecord>>('/connect/salaries', { params })
    return unwrapPaginated(data)
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
}
