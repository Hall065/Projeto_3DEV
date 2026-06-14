import api from './api'
import type { ConnectClass, PaginatedMeta, PaginatedResponse } from '../types/connect'
import type { GridTicket } from '../types/grid'
import type { SafeAuthorization } from '../types/safe'

function unwrapPaginated<T>(payload: PaginatedResponse<T>): PaginatedResponse<T> {
  return payload
}

export type ArchiveModuleKey = 'connect' | 'grid' | 'safe'

export type ArchiveSummary = {
  modules: Partial<Record<ArchiveModuleKey, {
    key: ArchiveModuleKey
    classes_count?: number
    attendance_sessions_count?: number
    tickets_count?: number
    authorizations_count?: number
  }>>
  auto_archive: {
    pending_classes: number
    can_run: boolean
  }
}

export const archiveService = {
  async getSummary(): Promise<ArchiveSummary> {
    const { data } = await api.get<{ data: ArchiveSummary }>('/archive/summary')
    return data.data
  },

  async getConnectClasses(params?: Record<string, string | number>): Promise<PaginatedResponse<ConnectClass>> {
    const { data } = await api.get<PaginatedResponse<ConnectClass>>('/archive/connect/classes', { params })
    return unwrapPaginated(data)
  },

  async getGridTickets(params?: Record<string, string | number>): Promise<PaginatedResponse<GridTicket>> {
    const { data } = await api.get<PaginatedResponse<GridTicket>>('/archive/grid/tickets', { params })
    return unwrapPaginated(data)
  },

  async getSafeAuthorizations(params?: Record<string, string | number>): Promise<PaginatedResponse<SafeAuthorization>> {
    const { data } = await api.get<PaginatedResponse<SafeAuthorization>>('/archive/safe/authorizations', { params })
    return unwrapPaginated(data)
  },

  async runAutoArchive(): Promise<{ message: string; archived: number; pending: number }> {
    const { data } = await api.post<{ message: string; data: { archived: number; pending: number } }>(
      '/archive/run-auto-archive',
    )
    return { message: data.message, archived: data.data.archived, pending: data.data.pending }
  },
}

export type { PaginatedMeta }
