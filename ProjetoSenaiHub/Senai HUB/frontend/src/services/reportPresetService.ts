import api from './api'
import type { ReportBuildConfig, ReportModule } from '../types/reports'

export interface ReportPreset {
  id: number
  name: string
  module: ReportModule
  config: ReportBuildConfig
  is_shared: boolean
  is_owner: boolean
  created_at?: string
}

export const reportPresetService = {
  async list(module: ReportModule): Promise<ReportPreset[]> {
    const { data } = await api.get<{ data: ReportPreset[] }>(`/reports/${module}/presets`)
    return data.data
  },

  async create(module: ReportModule, payload: { name: string; config: ReportBuildConfig; is_shared?: boolean }) {
    const { data } = await api.post<{ data: ReportPreset }>(`/reports/${module}/presets`, payload)
    return data.data
  },

  async remove(module: ReportModule, id: number): Promise<void> {
    await api.delete(`/reports/${module}/presets/${id}`)
  },
}
