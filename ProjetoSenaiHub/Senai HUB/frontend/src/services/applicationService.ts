import api from './api'
import type { HubApplication } from '../types/application'

export async function fetchApplications(): Promise<HubApplication[]> {
  const { data } = await api.get<{ data: HubApplication[] }>('/applications')
  return data.data
}
