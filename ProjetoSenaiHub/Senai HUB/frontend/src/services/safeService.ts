import api from './api'
import type {
  PaginatedResponse,
  SafeAuthorization,
  SafeAuthorizationHistory,
  SafeAuthorizationPayload,
  SafeDashboardData,
  SafeStudent,
} from '../types/safe'

export const safeService = {
  async getDashboard(): Promise<SafeDashboardData> {
    const { data } = await api.get<{ data: SafeDashboardData }>('/safe/dashboard')
    return data.data
  },

  async getStudents(params?: Record<string, string | number | boolean>): Promise<PaginatedResponse<SafeStudent>> {
    const { data } = await api.get<PaginatedResponse<SafeStudent>>('/safe/students', { params })
    return data
  },

  async getStudent(id: number): Promise<SafeStudent> {
    const { data } = await api.get<{ data: SafeStudent }>(`/safe/students/${id}`)
    return data.data
  },

  async createStudent(payload: Partial<SafeStudent>): Promise<SafeStudent> {
    const { data } = await api.post<{ data: SafeStudent }>('/safe/students', payload)
    return data.data
  },

  async updateStudent(id: number, payload: Partial<SafeStudent>): Promise<SafeStudent> {
    const { data } = await api.put<{ data: SafeStudent }>(`/safe/students/${id}`, payload)
    return data.data
  },

  async deleteStudent(id: number): Promise<void> {
    await api.delete(`/safe/students/${id}`)
  },

  async getAuthorizations(params?: Record<string, string | number>): Promise<PaginatedResponse<SafeAuthorization>> {
    const { data } = await api.get<PaginatedResponse<SafeAuthorization>>('/safe/authorizations', { params })
    return data
  },

  async getAuthorization(id: number): Promise<SafeAuthorization> {
    const { data } = await api.get<{ data: SafeAuthorization }>(`/safe/authorizations/${id}`)
    return data.data
  },

  async createAuthorization(payload: SafeAuthorizationPayload): Promise<SafeAuthorization> {
    const { data } = await api.post<{ data: SafeAuthorization }>('/safe/authorizations', payload)
    return data.data
  },

  async updateAuthorization(id: number, payload: Partial<SafeAuthorizationPayload>): Promise<SafeAuthorization> {
    const { data } = await api.put<{ data: SafeAuthorization }>(`/safe/authorizations/${id}`, payload)
    return data.data
  },

  async getAuthorizationHistory(id: number): Promise<SafeAuthorizationHistory> {
    const { data } = await api.get<{ data: SafeAuthorizationHistory }>(`/safe/authorizations/${id}/history`)
    return data.data
  },

  async getTeacherQueue(params?: Record<string, string | number>): Promise<PaginatedResponse<SafeAuthorization>> {
    const { data } = await api.get<PaginatedResponse<SafeAuthorization>>('/safe/teacher/authorizations', { params })
    return data
  },

  async approveByTeacher(id: number): Promise<SafeAuthorization> {
    const { data } = await api.post<{ data: SafeAuthorization }>(`/safe/teacher/authorizations/${id}/approve`)
    return data.data
  },

  async denyByTeacher(id: number): Promise<SafeAuthorization> {
    const { data } = await api.post<{ data: SafeAuthorization }>(`/safe/teacher/authorizations/${id}/deny`)
    return data.data
  },

  async getPortariaQueue(params?: Record<string, string | number>): Promise<PaginatedResponse<SafeAuthorization>> {
    const { data } = await api.get<PaginatedResponse<SafeAuthorization>>('/safe/portaria/authorizations', { params })
    return data
  },

  async confirmByPortaria(id: number): Promise<SafeAuthorization> {
    const { data } = await api.post<{ data: SafeAuthorization }>(`/safe/portaria/authorizations/${id}/confirm`)
    return data.data
  },

  async denyByPortaria(id: number): Promise<SafeAuthorization> {
    const { data } = await api.post<{ data: SafeAuthorization }>(`/safe/portaria/authorizations/${id}/deny`)
    return data.data
  },
}
