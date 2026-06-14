import api from './api'
import type { HubUserDetail, User } from '../types/auth'

export interface HubRoleOption {
  key: string
  label: string
  module: string
  description: string
  assignable: boolean
  default_permissions: string[]
}

export interface NavPermissionOption {
  key: string
  label: string
  group: string
}

export type NavPermissionsByModule = Record<'connect' | 'grid' | 'safe', NavPermissionOption[]>

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

  async getNavPermissions(): Promise<NavPermissionsByModule> {
    const { data } = await api.get<{ data: NavPermissionsByModule }>('/admin/nav-permissions')
    return data.data
  },

  async getUsers(params?: Record<string, string | number>): Promise<PaginatedUsers> {
    const { data } = await api.get<PaginatedUsers>('/admin/users', { params })
    return data
  },

  async getUser(id: number): Promise<HubUserDetail> {
    const { data } = await api.get<{ data: HubUserDetail }>(`/admin/users/${id}`)
    return data.data
  },

  async createUser(payload: {
    name: string
    email: string
    password: string
    role?: string
    company_name?: string
    custom_permissions?: string[]
  }): Promise<User> {
    const { data } = await api.post<{ data: User }>('/admin/users', payload)
    return data.data
  },

  async updateUser(
    id: number,
    payload: Partial<{
      name: string
      email: string
      password: string
      role: string
      company_name: string | null
      custom_permissions: string[] | null
      reset_permissions: boolean
    }>,
  ): Promise<User> {
    const { data } = await api.put<{ data: User }>(`/admin/users/${id}`, payload)
    return data.data
  },

  async deleteUser(id: number): Promise<void> {
    await api.delete(`/admin/users/${id}`)
  },
}
