import type {
  GridDashboardData,
  GridInventoryItem,
  GridTaskCard,
  GridTicket,
  GridUser,
  PaginatedMeta,
} from '../types/grid'

const delay = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms))

const tickets: GridTicket[] = [
  {
    id: '1',
    code: '#CH-2025-1258',
    requester: 'Ana Costa',
    title: 'Ar-condicionado não resfria',
    summary: 'Sala 207 apresenta temperatura acima do normal desde ontem.',
    room: '207',
    block: 'B',
    priority: 'alta',
    opened_at: '2025-05-19T09:15:00',
    status: 'aberto',
    assignee: 'Júlio Oliveira',
  },
  {
    id: '2',
    code: '#CH-2025-1257',
    requester: 'Carlos Mendes',
    title: 'Lâmpada queimada no corredor',
    summary: 'Corredor do bloco A, próximo à recepção.',
    room: 'Corredor',
    block: 'A',
    priority: 'media',
    opened_at: '2025-05-18T14:30:00',
    status: 'em_andamento',
    assignee: 'Maria Santos',
  },
  {
    id: '3',
    code: '#CH-2025-1256',
    requester: 'Paula Ribeiro',
    title: 'Tomada sem energia',
    summary: 'Tomada da bancada de laboratório sem funcionamento.',
    room: '112',
    block: 'C',
    priority: 'alta',
    opened_at: '2025-05-18T11:00:00',
    status: 'aberto',
    assignee: 'Júlio Oliveira',
  },
]

const tasks: GridTaskCard[] = [
  {
    id: '1',
    code: '#CH-2025-1251',
    opened_by: 'Maria Santos',
    title: 'Ar-condicionado pingando',
    description: 'Gotejamento constante na sala de aula.',
    room: '203',
    block: 'B',
    opened_at: '19/05/2025 08:30',
    assignee: null,
    items: ['Bandeja de drenagem', 'Selante'],
    priority: 'media',
    column: 'a_fazer',
    status_label: 'A fazer',
  },
  {
    id: '2',
    code: '#CH-2025-1248',
    opened_by: 'João Lima',
    title: 'Troca de lâmpadas LED',
    description: 'Substituir 6 lâmpadas no laboratório.',
    room: '105',
    block: 'A',
    opened_at: '18/05/2025 16:00',
    assignee: 'Júlio Oliveira',
    items: ['Lâmpada LED 18W x6'],
    priority: 'alta',
    column: 'em_andamento',
    status_label: 'Em andamento',
  },
  {
    id: '3',
    code: '#CH-2025-1240',
    opened_by: 'Ana Costa',
    title: 'Reparo em porta automática',
    description: 'Porta não fecha completamente.',
    room: 'Entrada',
    block: 'B',
    opened_at: '17/05/2025 10:15',
    assignee: 'Maria Santos',
    items: ['Motor de fechamento'],
    priority: 'baixa',
    column: 'concluidas',
    status_label: 'Concluída',
  },
]

const inventory: GridInventoryItem[] = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  title: 'Mouse Óptico USB',
  description: 'Mouse óptico com fio, resolução 1200 DPI.',
  category: 'Informática',
  qty_available: i === 2 ? 4 : 42,
  qty_min: 10,
  location: 'Almoxarifado - Bloco A',
  supplier: 'TechSupply Ltda',
  cost: 29.9,
  status: i === 2 ? 'baixo' : 'disponivel',
}))

const users: GridUser[] = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  name: 'Carlos Mendes',
  email: 'carlos.mendes@senai.br',
  phone: '(11) 98765-4321',
  role: 'Professor',
  created_at: '2024-03-10T10:00:00',
  updated_at: '2025-05-20T08:00:00',
  status: 'active',
  cpf: '123.456.789-00',
}))

function paginate<T>(items: T[], page: number, perPage: number): { data: T[]; meta: PaginatedMeta } {
  const total = items.length
  const last_page = Math.max(1, Math.ceil(total / perPage))
  const current_page = Math.min(page, last_page)
  const from = total === 0 ? null : (current_page - 1) * perPage + 1
  const to = total === 0 ? null : Math.min(current_page * perPage, total)
  const start = (current_page - 1) * perPage
  return {
    data: items.slice(start, start + perPage),
    meta: { current_page, last_page, total, from, to },
  }
}

export const gridService = {
  async getDashboard(): Promise<GridDashboardData> {
    await delay()
    return {
      kpis: {
        open_tickets: 128,
        in_progress: 64,
        completed_month: 342,
        low_stock: 23,
      },
      kpi_trends: {
        open_tickets: { direction: 'up', value: '8,2%', label: 'vs. mês anterior' },
        in_progress: { direction: 'up', value: '8%', label: 'vs. mês anterior' },
        completed_month: { direction: 'up', value: '15%', label: 'vs. mês anterior' },
        low_stock: { direction: 'neutral', value: '5', label: 'novos desde ontem' },
      },
      recent_tickets: tickets,
      maintenance_breakdown: [
        { label: 'Preventiva', value: 38, color: '#021a3a' },
        { label: 'Corretiva', value: 32, color: '#e30613' },
        { label: 'Preditiva', value: 18, color: '#22c55e' },
        { label: 'Outros', value: 12, color: '#94a3b8' },
      ],
      priority_breakdown: [
        { label: 'Alta', value: 24, color: '#ef4444' },
        { label: 'Média', value: 45, color: '#f59e0b' },
        { label: 'Baixa', value: 31, color: '#22c55e' },
      ],
      low_stock_items: [
        { id: '1', category: 'Lâmpada LED 18W', current: 3, minimum: 20, unit: 'un' },
        { id: '2', category: 'Filtro de ar', current: 5, minimum: 15, unit: 'un' },
        { id: '3', category: 'Cabo HDMI 2m', current: 2, minimum: 10, unit: 'un' },
      ],
      urgent_items: [
        { id: '1', title: 'Ar condicionado central apresentando falha', priority: 'alta', when: 'Hoje' },
        { id: '2', title: 'Vazamento no banheiro do bloco C', priority: 'alta', when: 'Hoje' },
      ],
      activities: [
        { id: '1', title: 'Manutenção elétrica - Bloco A', progress: 50 },
        { id: '2', title: 'Troca de luminárias - Corredor', progress: 53 },
        { id: '3', title: 'Revisão HVAC - Sala 301', progress: 60 },
      ],
    }
  },

  async getTickets(params?: { page?: number; per_page?: number; search?: string }) {
    await delay()
    const page = params?.page ?? 1
    const perPage = params?.per_page ?? 10
    let list = [...tickets]
    if (params?.search) {
      const q = params.search.toLowerCase()
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q) ||
          t.requester.toLowerCase().includes(q),
      )
    }
    return paginate(list, page, perPage)
  },

  async getTasks() {
    await delay()
    return { data: tasks }
  },

  async getInventory(params?: { page?: number; per_page?: number }) {
    await delay()
    return paginate(inventory, params?.page ?? 1, params?.per_page ?? 8)
  },

  async getUsers(params?: { page?: number; per_page?: number; search?: string }) {
    await delay()
    const page = params?.page ?? 1
    const perPage = params?.per_page ?? 6
    let list = [...users]
    if (params?.search) {
      const q = params.search.toLowerCase()
      list = list.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    }
    return paginate(list, page, perPage)
  },

  async getMapTasks() {
    await delay()
    return {
      tasks: tasks.filter((t) => t.column !== 'concluidas'),
      stats: { total: 128, todo: 64, in_progress: 48, done_today: 16, late: 5 },
    }
  },
}
