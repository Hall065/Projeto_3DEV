import api from './api'
import type {
  GridDashboardData,
  GridInventoryItem,
  GridInventoryLine,
  GridMapData,
  GridTaskCard,
  GridTicket,
  GridTicketAttachment,
  GridTicketReport,
  GridUser,
  PaginatedResponse,
} from '../types/grid'

export const gridService = {
  async getDashboard(): Promise<GridDashboardData> {
    const { data } = await api.get<{ data: GridDashboardData }>('/grid/dashboard')
    return data.data
  },

  async getTickets(params?: Record<string, string | number | boolean>): Promise<PaginatedResponse<GridTicket>> {
    const { data } = await api.get<PaginatedResponse<GridTicket>>('/grid/tickets', { params })
    return data
  },

  async getTicket(id: number): Promise<GridTicket> {
    const { data } = await api.get<{ data: GridTicket }>(`/grid/tickets/${id}`)
    return data.data
  },

  async getTicketReport(id: number): Promise<GridTicketReport> {
    const { data } = await api.get<{ data: GridTicketReport }>(`/grid/tickets/${id}/report`)
    return data.data
  },

  async createTicket(payload: Partial<GridTicket>): Promise<GridTicket> {
    const { data } = await api.post<{ data: GridTicket }>('/grid/tickets', payload)
    return data.data
  },

  async updateTicket(id: number, payload: Partial<GridTicket>): Promise<GridTicket> {
    const { data } = await api.put<{ data: GridTicket }>(`/grid/tickets/${id}`, payload)
    return data.data
  },

  async approveTicketService(
    id: number,
    payload: { approved_by: string; notes?: string; resolution_summary?: string },
  ): Promise<GridTicket> {
    const { data } = await api.post<{ data: GridTicket }>(`/grid/tickets/${id}/approve-service`, payload)
    return data.data
  },

  async evaluateTicket(id: number, payload: { rating: number; notes?: string; evaluated_by: string }): Promise<GridTicket> {
    const { data } = await api.post<{ data: GridTicket }>(`/grid/tickets/${id}/evaluate`, payload)
    return data.data
  },

  async createTaskFromTicket(
    ticketId: number,
    payload: {
      assignee?: string
      description?: string
      column?: string
      items?: string[]
      inventory_items?: GridInventoryLine[]
    },
  ): Promise<GridTaskCard> {
    const { data } = await api.post<{ data: GridTaskCard }>(`/grid/tickets/${ticketId}/tasks`, payload)
    return data.data
  },

  async deleteTicket(id: number): Promise<void> {
    await api.delete(`/grid/tickets/${id}`)
  },

  async uploadTicketAttachment(ticketId: number, file: File): Promise<GridTicketAttachment> {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post<{ data: GridTicketAttachment }>(`/grid/tickets/${ticketId}/attachments`, form)
    return data.data
  },

  async deleteTicketAttachment(ticketId: number, attachmentId: number): Promise<void> {
    await api.delete(`/grid/tickets/${ticketId}/attachments/${attachmentId}`)
  },

  async getTasks(params?: Record<string, string | number | boolean>): Promise<{ data: GridTaskCard[] }> {
    const { data } = await api.get<{ data: GridTaskCard[] }>('/grid/tasks', { params })
    return data
  },

  async createTask(
    payload: Partial<GridTaskCard> & { grid_ticket_id?: number | null; inventory_items?: GridInventoryLine[] },
  ): Promise<GridTaskCard> {
    const { data } = await api.post<{ data: GridTaskCard }>('/grid/tasks', payload)
    return data.data
  },

  async updateTask(
    id: number,
    payload: Partial<GridTaskCard> & { inventory_items?: GridInventoryLine[] },
  ): Promise<GridTaskCard> {
    const { data } = await api.put<{ data: GridTaskCard }>(`/grid/tasks/${id}`, payload)
    return data.data
  },

  async deleteTask(id: number): Promise<void> {
    await api.delete(`/grid/tasks/${id}`)
  },

  async getInventory(params?: Record<string, string | number>): Promise<PaginatedResponse<GridInventoryItem>> {
    const { data } = await api.get<PaginatedResponse<GridInventoryItem>>('/grid/inventory', { params })
    return data
  },

  async getInventoryItem(id: number) {
    const { data } = await api.get<{ data: import('../types/grid').GridInventoryItemDetail }>(`/grid/inventory/${id}`)
    return data.data
  },

  async createInventory(payload: Partial<GridInventoryItem>): Promise<{
    item: GridInventoryItem
    message: string
    merged?: boolean
  }> {
    const { data } = await api.post<{ data: GridInventoryItem; message: string; merged?: boolean }>(
      '/grid/inventory',
      payload,
    )
    return {
      item: data.data,
      message: data.message ?? 'Item cadastrado com sucesso.',
      merged: data.merged,
    }
  },

  async updateInventory(id: number, payload: Partial<GridInventoryItem>): Promise<GridInventoryItem> {
    const { data } = await api.put<{ data: GridInventoryItem }>(`/grid/inventory/${id}`, payload)
    return data.data
  },

  async syncInventoryImage(id: number): Promise<GridInventoryItem> {
    const { data } = await api.post<{ data: GridInventoryItem }>(`/grid/inventory/${id}/sync-image`)
    return data.data
  },

  async uploadInventoryImage(id: number, file: File): Promise<GridInventoryItem> {
    const form = new FormData()
    form.append('image', file)
    const { data } = await api.post<{ data: GridInventoryItem }>(`/grid/inventory/${id}/image`, form)
    return data.data
  },

  async adjustInventory(id: number, type: 'in' | 'out', quantity: number): Promise<GridInventoryItem> {
    const { data } = await api.post<{ data: GridInventoryItem }>(`/grid/inventory/${id}/adjust`, {
      type,
      quantity,
    })
    return data.data
  },

  async deleteInventory(id: number): Promise<void> {
    await api.delete(`/grid/inventory/${id}`)
  },

  async getUsers(params?: Record<string, string | number>): Promise<PaginatedResponse<GridUser>> {
    const { data } = await api.get<PaginatedResponse<GridUser>>('/grid/users', { params })
    return data
  },

  async getUser(id: number) {
    const { data } = await api.get<{ data: import('../types/grid').GridUserDetail }>(`/grid/users/${id}`)
    return data.data
  },

  async createUser(payload: Partial<GridUser>): Promise<GridUser> {
    const { data } = await api.post<{ data: GridUser }>('/grid/users', payload)
    return data.data
  },

  async updateUser(id: number, payload: Partial<GridUser>): Promise<GridUser> {
    const { data } = await api.put<{ data: GridUser }>(`/grid/users/${id}`, payload)
    return data.data
  },

  async deleteUser(id: number): Promise<void> {
    await api.delete(`/grid/users/${id}`)
  },

  async getMapData(): Promise<GridMapData> {
    const [tasksRes, ticketsRes] = await Promise.all([
      this.getTasks({ all: true, for_map: true }),
      this.getTickets({ for_map: true, per_page: 100 }),
    ])
    const all = tasksRes.data
    const tasks = all.filter((t) => t.column !== 'concluidas')

    return {
      tasks,
      tickets: ticketsRes.data,
      stats: {
        total: all.length,
        todo: all.filter((t) => t.column === 'a_fazer').length,
        in_progress: all.filter((t) => t.column === 'em_andamento').length,
        done_today: all.filter((t) => t.column === 'concluidas').length,
        late: all.filter((t) => t.column === 'a_fazer' && t.priority === 'alta').length,
      },
    }
  },
}
