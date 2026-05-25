export type GridPriority = 'alta' | 'media' | 'baixa'
export type GridTicketStatus = 'aberto' | 'em_andamento' | 'concluido' | 'pendente'
export type GridTaskColumn = 'a_fazer' | 'em_andamento' | 'concluidas'
export type GridInventoryStatus = 'disponivel' | 'baixo' | 'reservado'

export interface GridKpiTrend {
  direction: 'up' | 'down' | 'neutral'
  value: string
  label: string
}

export interface GridTicket {
  id: string
  code: string
  requester: string
  title: string
  summary: string
  room: string
  block: string
  priority: GridPriority
  opened_at: string
  status: GridTicketStatus
  assignee: string
}

export interface GridTaskCard {
  id: string
  code: string
  opened_by: string
  title: string
  description: string
  room: string
  block: string
  opened_at: string
  assignee: string | null
  items: string[]
  priority: GridPriority
  column: GridTaskColumn
  status_label: string
}

export interface GridInventoryItem {
  id: number
  title: string
  description: string
  category: string
  qty_available: number
  qty_min: number
  location: string
  supplier: string
  cost: number
  status: GridInventoryStatus
}

export interface GridUser {
  id: number
  name: string
  email: string
  phone: string
  role: string
  created_at: string
  updated_at: string
  status: string
  cpf: string
}

export interface PaginatedMeta {
  current_page: number
  last_page: number
  total: number
  from: number | null
  to: number | null
}

export interface GridDashboardData {
  kpis: {
    open_tickets: number
    in_progress: number
    completed_month: number
    low_stock: number
  }
  kpi_trends: Record<string, GridKpiTrend>
  recent_tickets: GridTicket[]
  maintenance_breakdown: { label: string; value: number; color: string }[]
  priority_breakdown: { label: string; value: number; color: string }[]
  low_stock_items: { id: string; category: string; current: number; minimum: number; unit: string }[]
  urgent_items: { id: string; title: string; priority: GridPriority; when: string }[]
  activities: { id: string; title: string; progress: number }[]
}
