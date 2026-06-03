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
  created_at?: string | null
}

export interface HubApplicationDetail {
  slug: string
  name: string
  description?: string | null
}

export interface HubUserDetail extends User {
  updated_at?: string | null
  email_verified_at?: string | null
  role_description?: string | null
  role_module?: string | null
  applications_detail?: HubApplicationDetail[]
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
