import api from './api'
import type { User } from '../types/auth'

interface AuthResponse {
  data: {
    user: User
    token: string
  }
}

interface ApiValidationError {
  message?: string
  errors?: Record<string, string[]>
}

export async function loginRequest(email: string, password: string): Promise<AuthResponse['data']> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
  return data.data
}

export async function registerRequest(payload: {
  name: string
  email: string
  password: string
  password_confirmation: string
}): Promise<AuthResponse['data']> {
  const { data } = await api.post<AuthResponse>('/auth/register', payload)
  return data.data
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await api.get<{ data: User }>('/auth/me')
  return data.data
}

export async function logoutRequest(): Promise<void> {
  await api.post('/auth/logout')
}

export async function updateProfileRequest(payload: { name: string; email: string }): Promise<User> {
  const { data } = await api.put<{ data: User; message: string }>('/auth/me', payload)
  return data.data
}

export async function changePasswordRequest(payload: {
  current_password: string
  password: string
  password_confirmation: string
}): Promise<void> {
  await api.put('/auth/password', payload)
}

export function parseAuthError(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { status?: number; data?: ApiValidationError } }).response
    const payload = response?.data

    if (response?.status === 419) {
      return 'Sessao expirada. Tente novamente.'
    }

    if (response?.status === 422 && payload?.errors) {
      const firstError = Object.values(payload.errors)[0]?.[0]
      if (firstError) {
        return firstError
      }
    }

    if (payload?.message) {
      return payload.message
    }
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: string }).message
    if (message === 'Network Error') {
      return 'Nao foi possivel conectar ao servidor. Verifique se o backend esta rodando.'
    }
  }

  return 'Ocorreu um erro. Tente novamente.'
}
