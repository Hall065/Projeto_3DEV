import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Contact,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  MapPin,
  School,
  Users,
  Wallet,
  BarChart3,
  LayoutDashboard,
  ListTodo,
  MapPin as GridMapPin,
  Package,
  Signpost,
} from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  permission?: string | string[]
}

export function filterNavItems(items: NavItem[], can: (permission: string) => boolean): NavItem[] {
  return items.filter((item) => {
    if (!item.permission) {
      return true
    }
    const required = Array.isArray(item.permission) ? item.permission : [item.permission]
    return required.some((p) => can(p))
  })
}

export const connectNavItems: NavItem[] = [
  { to: '/connect', label: 'Visao Geral', icon: LayoutDashboard, end: true, permission: 'connect.dashboard' },
  { to: '/connect/pessoas', label: 'Pessoas', icon: Contact, permission: 'connect.people.manage' },
  { to: '/connect/alunos', label: 'Alunos', icon: GraduationCap, permission: ['connect.students.view', 'connect.students.manage'] },
  { to: '/connect/professores', label: 'Professores', icon: Users, permission: ['connect.teachers.view', 'connect.teachers.manage'] },
  { to: '/connect/turmas', label: 'Turmas', icon: School, permission: ['connect.classes.view', 'connect.classes.manage'] },
  { to: '/connect/cursos', label: 'Cursos', icon: BookOpen, permission: ['connect.courses.view', 'connect.courses.manage'] },
  { to: '/connect/frequencia', label: 'Frequencia', icon: CalendarCheck, permission: ['connect.attendance.view', 'connect.attendance.view_own', 'connect.attendance.manage'] },
  { to: '/connect/gerenciar-frequencia', label: 'Gerenciar Frequencia', icon: ClipboardList, permission: ['connect.attendance.view', 'connect.attendance.manage'] },
  { to: '/connect/relatorio', label: 'Relatorio', icon: FileText, permission: ['connect.reports.view', 'connect.reports.manage'] },
  { to: '/connect/localizacao', label: 'Localizacao', icon: MapPin, permission: 'connect.location.view' },
  { to: '/connect/planilhas', label: 'Planilhas', icon: FileSpreadsheet, permission: 'connect.spreadsheets' },
]

export const connectContractNav: NavItem = {
  to: '/connect/contratos/alunos',
  label: 'Contrato Alunos',
  icon: FileText,
  permission: ['connect.contracts.view', 'connect.contracts.view_own', 'connect.contracts.manage'],
}

export const connectSalaryNav: NavItem = {
  to: '/connect/salario',
  label: 'Salario',
  icon: Wallet,
  permission: ['connect.salary.view', 'connect.salary.view_own'],
}

export const gridNavItems: NavItem[] = [
  { to: '/grid', label: 'Dashboard', icon: LayoutDashboard, end: true, permission: 'grid.dashboard' },
  { to: '/grid/controle', label: 'Controle', icon: Signpost, permission: 'grid.controle' },
  { to: '/grid/chamados', label: 'Chamados', icon: ClipboardList, permission: ['grid.tickets.view', 'grid.tickets.manage'] },
  { to: '/grid/tarefas', label: 'Tarefas', icon: ListTodo, permission: 'grid.tasks.manage' },
  { to: '/grid/relatorios', label: 'Relatorios', icon: BarChart3, permission: 'grid.reports.view' },
  { to: '/grid/estoque', label: 'Estoque', icon: Package, permission: ['grid.inventory.view', 'grid.inventory.manage'] },
  { to: '/grid/mapa', label: 'Mapa de tarefas', icon: GridMapPin, permission: 'grid.tasks.map' },
  { to: '/grid/usuarios', label: 'Usuarios Grid', icon: Users, permission: 'grid.users.manage' },
  { to: '/grid/planilhas', label: 'Planilhas', icon: FileSpreadsheet, permission: 'grid.spreadsheets' },
]

/** Mapa de rotas Connect -> permissao necessaria */
export const connectRoutePermissions: Record<string, string | string[]> = {
  '/connect': 'connect.dashboard',
  '/connect/pessoas': 'connect.people.manage',
  '/connect/alunos': ['connect.students.view', 'connect.students.manage'],
  '/connect/professores': ['connect.teachers.view', 'connect.teachers.manage'],
  '/connect/turmas': ['connect.classes.view', 'connect.classes.manage'],
  '/connect/cursos': ['connect.courses.view', 'connect.courses.manage'],
  '/connect/frequencia': ['connect.attendance.view', 'connect.attendance.view_own', 'connect.attendance.manage'],
  '/connect/gerenciar-frequencia': ['connect.attendance.view', 'connect.attendance.manage'],
  '/connect/relatorio': ['connect.reports.view', 'connect.reports.manage'],
  '/connect/localizacao': 'connect.location.view',
  '/connect/planilhas': 'connect.spreadsheets',
  '/connect/contratos/alunos': ['connect.contracts.view', 'connect.contracts.view_own', 'connect.contracts.manage'],
  '/connect/salario': ['connect.salary.view', 'connect.salary.view_own'],
}

/** Mapa de rotas Grid -> permissao necessaria */
export const gridRoutePermissions: Record<string, string | string[]> = {
  '/grid': 'grid.dashboard',
  '/grid/controle': 'grid.controle',
  '/grid/chamados': ['grid.tickets.view', 'grid.tickets.manage'],
  '/grid/tarefas': 'grid.tasks.manage',
  '/grid/relatorios': 'grid.reports.view',
  '/grid/estoque': ['grid.inventory.view', 'grid.inventory.manage'],
  '/grid/mapa': 'grid.tasks.map',
  '/grid/usuarios': 'grid.users.manage',
  '/grid/planilhas': 'grid.spreadsheets',
}
