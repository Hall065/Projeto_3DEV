import api from './api'

export interface PermissionsCatalog {
  roles: Record<string, { label?: string; module?: string; description?: string }>
  role_permissions: Record<string, string[]>
  nav_permissions: Record<string, Array<{ key: string; label: string; group?: string }>>
  application_slugs_by_role: Record<string, string[]>
}

const CACHE_KEY = 'senai_hub_permissions_catalog'

export async function fetchPermissionsCatalog(): Promise<PermissionsCatalog> {
  const { data } = await api.get<{ data: PermissionsCatalog }>('/auth/permissions-catalog')
  sessionStorage.setItem(CACHE_KEY, JSON.stringify(data.data))
  return data.data
}

export function readCachedPermissionsCatalog(): PermissionsCatalog | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as PermissionsCatalog) : null
  } catch {
    return null
  }
}

export function resolvePermissionLabel(
  catalog: PermissionsCatalog | null,
  permissionKey: string | undefined,
  fallback: string,
): string {
  if (!catalog || !permissionKey) {
    return fallback
  }

  for (const moduleItems of Object.values(catalog.nav_permissions)) {
    const match = moduleItems.find((item) => item.key === permissionKey)
    if (match?.label) {
      return match.label
    }
  }

  return fallback
}
