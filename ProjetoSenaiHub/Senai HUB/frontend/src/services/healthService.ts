import api from './api'
import type { HealthCheckResponse } from '../types/api'

export async function fetchHealthCheck(): Promise<HealthCheckResponse> {
  const { data } = await api.get<HealthCheckResponse>('/health')
  return data
}
