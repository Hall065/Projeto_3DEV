import api from './api'
import type { User } from '../types/auth'

export interface HubRoleOption {
  key: string
  label: string
  module: string
  description: string
  assignable: boolean
}

export interface PaginatedUsers {
  data: User[]
  meta: {
    current_page: number
    last_page: number
    total: number
  }
}

export const adminService = {
  async getRoles(): Promise<HubRoleOption[]> {
    const { data } = await api.get<{ data: HubRoleOption[] }>('/admin/roles')
    return data.data
  },

  async getUsers(params?: Record<string, string | number>): Promise<PaginatedUsers> {
    const { data } = await api.get<PaginatedUsers>('/admin/users', { params })
    return data
  },

  async createUser(payload: {
    name: string
    email: string
    password: string
    role: string
    company_name?: string
  }): Promise<User> {
    const { data } = await api.post<{ data: User }>('/admin/users', payload)
    return data.data
  },

  async updateUser(
    id: number,
    payload: Partial<{ name: string; email: string; password: string; role: string; company_name: string | null }>,
  ): Promise<User> {
    const { data } = await api.put<{ data: User }>(`/admin/users/${id}`, payload)
    return data.data
  },

  async deleteUser(id: number): Promise<void> {
    await api.delete(`/admin/users/${id}`)
  },
}
