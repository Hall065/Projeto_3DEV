import i18n from '../i18n'

const MODULE_LABEL_KEYS: Record<string, string> = {
  connect: 'permissions.modules.connect',
  grid: 'permissions.modules.grid',
  hub: 'permissions.modules.hub',
}

export function formatPermissionLabel(permission: string): string {
  if (permission === '*') {
    return i18n.t('permissions.fullAccess')
  }

  const key = `permissions.labels.${permission}`
  const translated = i18n.t(key)
  if (translated !== key) {
    return translated
  }

  return permission.replaceAll('.', ' · ').replaceAll('_', ' ')
}

export function groupPermissions(permissions: string[]): { module: string; items: string[] }[] {
  if (permissions.includes('*')) {
    return [{ module: i18n.t('permissions.modules.system'), items: [i18n.t('permissions.fullAccess')] }]
  }

  const groups = new Map<string, string[]>()

  for (const permission of permissions) {
    const [prefix] = permission.split('.')
    const moduleKey = MODULE_LABEL_KEYS[prefix] ?? 'permissions.modules.other'
    const module = i18n.t(moduleKey)
    const list = groups.get(module) ?? []
    list.push(formatPermissionLabel(permission))
    groups.set(module, list)
  }

  return Array.from(groups.entries()).map(([module, items]) => ({ module, items }))
}
