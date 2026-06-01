export interface User {
  id: number
  name: string
  email: string
  role?: string
  role_label?: string
  company_name?: string | null
  is_admin?: boolean
  permissions?: string[]
  application_slugs?: string[]
  avatar_url?: string | null
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isInitializing: boolean
  isSubmitting: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
  password_confirmation: string
}
