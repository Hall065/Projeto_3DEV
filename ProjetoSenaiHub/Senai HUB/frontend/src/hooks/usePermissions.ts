import { useAuth } from '../contexts/AuthContext'

function matchesPermission(granted: string[], required: string): boolean {
  if (granted.includes('*')) {
    return true
  }

  if (granted.includes(required)) {
    return true
  }

  const parts = required.split('.')
  while (parts.length > 1) {
    parts.pop()
    if (granted.includes(`${parts.join('.')}.*`)) {
      return true
    }
  }

  return false
}

export function usePermissions() {
  const { user } = useAuth()
  const permissions = user?.permissions ?? []

  const can = (permission: string) => matchesPermission(permissions, permission)

  const canAny = (...required: string[]) => required.some((p) => can(p))

  const canAccessModule = (slug: 'connect' | 'grid' | 'safe') =>
    user?.is_admin === true || (user?.application_slugs?.includes(slug) ?? false)

  return {
    user,
    role: user?.role,
    roleLabel: user?.role_label,
    isAdmin: user?.is_admin === true,
    can,
    canAny,
    canAccessModule,
  }
}
