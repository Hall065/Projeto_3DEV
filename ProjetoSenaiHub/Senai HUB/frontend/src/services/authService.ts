import api from './api'
import type { User } from '../types/auth'
import { parseApiError } from '../utils/parseApiError'

interface AuthResponse {
  data: {
    user: User
    token: string
  }
}

export async function loginRequest(email: string, password: string): Promise<AuthResponse['data']> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
  return data.data
}

export async function forgotPasswordRequest(email: string): Promise<string> {
  const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email })
  return data.message
}

export async function resetPasswordRequest(payload: {
  email: string
  token: string
  password: string
  password_confirmation: string
}): Promise<string> {
  const { data } = await api.post<{ message: string }>('/auth/reset-password', payload)
  return data.message
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

export async function uploadAvatarRequest(file: File): Promise<User> {
  const form = new FormData()
  form.append('avatar', file)
  const { data } = await api.post<{ data: User; message: string }>('/auth/avatar', form)
  return data.data
}

export async function removeAvatarRequest(): Promise<User> {
  const { data } = await api.delete<{ data: User; message: string }>('/auth/avatar')
  return data.data
}

export function parseAuthError(error: unknown): string {
  return parseApiError(error)
}

export { parseApiError }
