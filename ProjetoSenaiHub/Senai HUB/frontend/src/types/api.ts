export interface ApiResponse<T = unknown> {
  data?: T
  message?: string
  status?: string
}

export interface HealthCheckResponse {
  status: 'ok' | 'error'
}

export interface ApiError {
  message: string
  status?: number
}
