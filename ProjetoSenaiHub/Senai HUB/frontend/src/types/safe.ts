import type { PaginatedMeta, PaginatedResponse } from './connect'

export type SafeAuthorizationType = 'entrada' | 'saida'

export type SafeAuthorizationStatus =
  | 'pendente_aqv'
  | 'aguardando_professor'
  | 'liberado_portaria'
  | 'finalizado'
  | 'negado'

export interface SafeStudent {
  id: number
  connect_student_id?: number | null
  registration: string
  name: string
  class_name: string
  active: boolean
  source?: 'connect' | 'legacy'
  authorizations_count?: number
  created_at?: string
  updated_at?: string
}

export interface SafeAuthorizationLog {
  id: number
  action: string
  user_id?: number | null
  user_name?: string | null
  created_at?: string
}

export interface SafeAuthorization {
  id: number
  protocol: string
  safe_student_id?: number | null
  student_name: string
  class_name: string
  type: SafeAuthorizationType
  type_label: string
  reason: string
  absence_count?: number | null
  scheduled_at?: string
  notes?: string
  status: SafeAuthorizationStatus
  status_label: string
  requested_by?: number
  requester_name?: string | null
  approved_by_teacher?: number | null
  teacher_approver_name?: string | null
  approved_by_portaria?: number | null
  portaria_approver_name?: string | null
  teacher_approved_at?: string | null
  portaria_confirmed_at?: string | null
  finalized_at?: string | null
  student?: SafeStudent
  logs?: SafeAuthorizationLog[]
  created_at?: string
  updated_at?: string
}

export interface SafeAqvDashboard {
  view: 'aqv'
  kpis: {
    requests_today: number
    pending_teacher: number
    approved_today: number
    finalized_today: number
    awaiting_portaria: number
    denied: number
  }
  status_breakdown: Record<string, number>
  recent_authorizations: SafeAuthorization[]
}

export interface SafeProfessorDashboard {
  view: 'professor'
  kpis: {
    pending: number
    approved_by_me: number
  }
  authorizations: SafeAuthorization[]
}

export interface SafePortariaDashboard {
  view: 'portaria'
  kpis: {
    awaiting_confirmation: number
    finalized_today: number
  }
  authorizations: SafeAuthorization[]
}

export type SafeDashboardData = SafeAqvDashboard | SafeProfessorDashboard | SafePortariaDashboard

export interface SafeAuthorizationHistory {
  authorization: SafeAuthorization
  logs: SafeAuthorizationLog[]
}

export interface SafeAuthorizationPayload {
  safe_student_id?: number | null
  connect_student_id?: number | null
  student_name?: string
  class_name?: string
  type: SafeAuthorizationType
  reason: string
  absence_count?: number | null
  date: string
  time: string
  notes?: string
}

export type { PaginatedMeta, PaginatedResponse }
