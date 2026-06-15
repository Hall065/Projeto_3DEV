import i18n from '../i18n'

export const GRID_API_ROLE_TECHNICIAN = 'Técnico de manutenção'
export const GRID_API_ROLE_MANAGER = 'Gerente de manutenção'

export const GRID_API_ROLES = [
  GRID_API_ROLE_TECHNICIAN,
  GRID_API_ROLE_MANAGER,
  'Administrador',
  'Professor',
  'Secretaria',
] as const

const ROLE_I18N_KEYS: Record<string, string> = {
  [GRID_API_ROLE_TECHNICIAN]: 'grid.users.roles.technician',
  [GRID_API_ROLE_MANAGER]: 'grid.users.roles.manager',
  Administrador: 'grid.users.roles.administrator',
  Professor: 'grid.users.roles.teacher',
  Secretaria: 'grid.users.roles.secretary',
}

export function gridRoleLabel(role: string): string {
  const key = ROLE_I18N_KEYS[role]
  return key ? i18n.t(key) : role
}
