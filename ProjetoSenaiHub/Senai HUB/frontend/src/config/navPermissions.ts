import type { LucideIcon } from 'lucide-react'
import type { HubPermissionKey } from '../generated/permissionKeys'
import {
  CONNECT_NAV_MANIFEST,
  GRID_NAV_MANIFEST,
  SAFE_NAV_MANIFEST,
  connectRoutePermissions,
  gridRoutePermissions,
  safeRoutePermissions,
  type NavManifestItem,
} from '../generated/navManifest'
import { NAV_ICON_MAP } from './navIcons'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  permission?: HubPermissionKey | readonly HubPermissionKey[]
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

function manifestToNavItems(manifest: readonly NavManifestItem[], labels: Record<string, string>): NavItem[] {
  return manifest.map((item) => ({
    to: item.to,
    label: labels[item.key] ?? item.key,
    icon: NAV_ICON_MAP[item.icon] ?? NAV_ICON_MAP.LayoutDashboard,
    end: item.end,
    permission: item.permission,
  }))
}

/** Labels fallback — sidebars usam useNavLabel quando o catalogo esta disponivel. */
const connectLabels: Record<string, string> = {
  'connect.dashboard': 'Visao Geral',
  'connect.people.manage': 'Pessoas',
  'connect.students.view': 'Alunos',
  'connect.teachers.view': 'Professores',
  'connect.classes.view': 'Turmas',
  'connect.courses.view': 'Cursos',
  'connect.calendar.view': 'Calendario',
  'connect.attendance.view': 'Frequencia',
  'connect.attendance.manage': 'Gerenciar Frequencia',
  'connect.reports.view': 'Relatorio',
  'connect.location.view': 'Localizacao',
  'connect.spreadsheets': 'Planilhas',
  'connect.contracts.view': 'Contrato Alunos',
  'connect.salary.view': 'Salario',
}

const gridLabels: Record<string, string> = {
  'grid.dashboard': 'Dashboard',
  'grid.controle': 'Controle',
  'grid.tickets.view': 'Chamados',
  'grid.tasks.manage': 'Tarefas',
  'grid.reports.view': 'Relatorios',
  'grid.inventory.view': 'Estoque',
  'grid.tasks.map': 'Mapa de tarefas',
  'grid.users.manage': 'Usuarios Grid',
  'grid.spreadsheets': 'Planilhas',
}

const safeLabels: Record<string, string> = {
  'safe.dashboard': 'Visao Geral',
  'safe.students.manage': 'Alunos',
  'safe.authorizations.manage': 'Autorizacoes',
  'safe.approve': 'Aprovacoes',
  'safe.portaria': 'Portaria',
}

export const connectNavItems: NavItem[] = manifestToNavItems(CONNECT_NAV_MANIFEST, connectLabels)

export const connectContractNav: NavItem = connectNavItems.find((item) => item.to === '/connect/contratos/alunos')!

export const connectSalaryNav: NavItem = connectNavItems.find((item) => item.to === '/connect/salario')!

export const gridNavItems: NavItem[] = manifestToNavItems(GRID_NAV_MANIFEST, gridLabels)

export const safeNavItems: NavItem[] = manifestToNavItems(SAFE_NAV_MANIFEST, safeLabels)

export { connectRoutePermissions, gridRoutePermissions, safeRoutePermissions }
