export type NotificationModule = 'hub' | 'connect' | 'grid'

export type NotificationSeverity = 'info' | 'warning' | 'urgent'

export interface HubNotification {
  id: number
  module: NotificationModule
  type: string
  title: string
  message: string
  action_url: string | null
  entity_type: string | null
  entity_id: number | null
  severity: NotificationSeverity
  is_read: boolean
  read_at: string | null
  actor_name?: string | null
  created_at: string
}

export interface NotificationPreferences {
  in_app: boolean
  email: boolean
  modules: {
    hub: boolean
    connect: boolean
    grid: boolean
  }
}

export interface NotificationListMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface NotificationListResponse {
  data: HubNotification[]
  meta: NotificationListMeta
  unread_count: number
}
