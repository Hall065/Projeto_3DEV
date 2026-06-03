export type GridPriority = 'alta' | 'media' | 'baixa'
export type GridTicketStatus =
  | 'aberto'
  | 'pendente'
  | 'em_atendimento'
  | 'aguardando_aprovacao'
  | 'avaliacao_pendente'
  | 'concluido'
export type GridTaskColumn = 'a_fazer' | 'em_andamento' | 'concluidas'
export type GridInventoryStatus = 'disponivel' | 'baixo' | 'reservado'

export interface GridInventoryLine {
  inventory_item_id: number
  quantity: number
  title?: string
}

export interface GridKpiTrend {
  direction: 'up' | 'down' | 'neutral'
  value: string
  label: string
}

export interface GridTicket {
  id: number
  code: string
  requester: string
  title: string
  summary: string
  room: string
  block: string
  priority: GridPriority
  opened_at: string
  started_at?: string | null
  completed_at?: string | null
  status: GridTicketStatus
  assignee: string
  resolution_summary?: string
  fixed_description?: string
  considerations?: string
  evaluation_rating?: number | null
  evaluation_notes?: string
  evaluated_by?: string
  evaluated_at?: string | null
  approved_by?: string
  approved_at?: string | null
  approval_notes?: string
  workflow_locked?: boolean
  primary_task_id?: number | null
  tasks_count?: number
  created_at?: string
  updated_at?: string
}

export interface GridTaskCard {
  id: number
  grid_ticket_id?: number | null
  ticket_code?: string | null
  code: string
  opened_by: string
  title: string
  description: string
  room: string
  block: string
  opened_at: string
  completed_at?: string | null
  assignee: string | null
  items: string[]
  inventory_items?: GridInventoryLine[]
  priority: GridPriority
  column: GridTaskColumn
  status_label: string
  created_at?: string
  updated_at?: string
}

export interface GridInventoryItem {
  id: number
  title: string
  description: string
  category: string
  sku?: string | null
  image_url?: string | null
  purchased_at?: string | null
  qty_available: number
  qty_reserved?: number
  qty_min: number
  location: string
  supplier: string
  cost: number
  status: GridInventoryStatus
  created_at?: string
  updated_at?: string
}

export interface GridInventoryReservationRow {
  id: number
  quantity: number
  status: string
  task_code?: string | null
  task_title?: string | null
  task_column?: string | null
  ticket_code?: string | null
  created_at?: string | null
}

export interface GridInventoryItemDetail extends GridInventoryItem {
  qty_in_use: number
  qty_committed: number
  qty_consumed: number
  qty_total: number
  stock_value?: number
  reservations: GridInventoryReservationRow[]
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

export interface GridUserActivityRow {
  type: 'task' | 'ticket'
  id: number
  code: string
  title: string
  status: string
  column?: string
  updated_at?: string | null
}

export interface GridUserDetail extends GridUser {
  stats: {
    tasks_total: number
    tasks_in_progress: number
    tasks_completed: number
    tickets_assigned: number
  }
  activity: GridUserActivityRow[]
}

export interface PaginatedMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginatedMeta
}

export interface GridBreakdownItem {
  label: string
  value: number
  count?: number
  color: string
}

export interface GridReportKpis {
  created: number
  pending: number
  without_technician: number
  in_progress: number
  awaiting_approval?: number
  awaiting_evaluation: number
  finished: number
  urgent?: number
}

export interface GridDashboardActivity {
  id: string
  code: string
  title: string
  assignee: string | null
  column: string
  status_label: string
  room: string
  block: string
}

export interface GridDashboardData {
  kpis: {
    total_tickets?: number
    open_tickets: number
    pending_tickets?: number
    in_progress: number
    awaiting_evaluation?: number
    finished?: number
    completed_month: number
    low_stock: number
    reserved_inventory?: number
    urgent_tickets?: number
  }
  report_kpis?: GridReportKpis
  kpi_trends: Record<string, GridKpiTrend>
  recent_tickets: GridTicket[]
  maintenance_breakdown: GridBreakdownItem[]
  priority_breakdown: GridBreakdownItem[]
  tasks_by_column?: { label: string; count: number }[]
  low_stock_items: { id: string; category: string; current: number; minimum: number; unit: string }[]
  urgent_items: { id: string; title: string; priority: GridPriority; when: string }[]
  activities: GridDashboardActivity[]
  kpi_sparklines?: {
    open_tickets: number[]
    in_progress: number[]
    completed_month: number[]
    low_stock: number[]
    urgent?: number[]
  }
  tickets_by_month?: { label: string; count: number }[]
  tickets_by_technician?: { name: string; count: number }[]
  top_inventory?: { name: string; count: number }[]
}

export interface GridMapData {
  tasks: GridTaskCard[]
  tickets: GridTicket[]
  stats: {
    total: number
    todo: number
    in_progress: number
    done_today: number
    late: number
  }
}

export interface GridTicketReport {
  ticket: GridTicket
  timeline: {
    opened_at?: string | null
    started_at?: string | null
    completed_at?: string | null
    approved_at?: string | null
    evaluated_at?: string | null
    duration_minutes?: number | null
    duration_label?: string | null
  }
  tasks: GridTaskCard[]
  materials: { task_code: string; item: string; quantity: number; status: string }[]
  location: { room: string; block: string }
}
