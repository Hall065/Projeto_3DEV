import api from './api'
import type {
  HubNotification,
  NotificationListResponse,
  NotificationPreferences,
} from '../types/notification'

export const notificationService = {
  async list(params?: {
    page?: number
    per_page?: number
    unread_only?: boolean
    module?: string
  }): Promise<NotificationListResponse> {
    const { data } = await api.get<NotificationListResponse>('/notifications', { params })
    return data
  },

  async unreadCount(): Promise<number> {
    const { data } = await api.get<{ data: { unread_count: number } }>('/notifications/unread-count')
    return data.data.unread_count
  },

  async markRead(id: number): Promise<{ notification: HubNotification; unread_count: number }> {
    const { data } = await api.patch<{
      data: HubNotification
      unread_count: number
    }>(`/notifications/${id}/read`)
    return { notification: data.data, unread_count: data.unread_count }
  },

  async markAllRead(): Promise<number> {
    const { data } = await api.post<{ unread_count: number }>('/notifications/read-all')
    return data.unread_count
  },

  async remove(id: number): Promise<number> {
    const { data } = await api.delete<{ unread_count: number }>(`/notifications/${id}`)
    return data.unread_count
  },

  async getPreferences(): Promise<NotificationPreferences> {
    const { data } = await api.get<{ data: NotificationPreferences }>('/auth/notification-preferences')
    return data.data
  },

  async updatePreferences(payload: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const { data } = await api.put<{ data: NotificationPreferences }>(
      '/auth/notification-preferences',
      payload,
    )
    return data.data
  },
}
