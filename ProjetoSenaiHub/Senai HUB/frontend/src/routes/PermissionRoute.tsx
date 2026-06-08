import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { connectRoutePermissions, gridRoutePermissions } from '../config/navPermissions'
import { usePermissions } from '../hooks/usePermissions'

function canAccessRoute(
  pathname: string,
  map: Record<string, string | string[]>,
  can: (permission: string) => boolean,
  isAdmin: boolean,
): boolean {
  if (isAdmin) return true

  const permission = map[pathname]
  if (!permission) return true

  if (Array.isArray(permission)) {
    return permission.some((p) => can(p))
  }

  return can(permission)
}

export function PermissionRoute({ module }: { module: 'connect' | 'grid' }) {
  const { pathname } = useLocation()
  const { can, isAdmin } = usePermissions()
  const map = module === 'connect' ? connectRoutePermissions : gridRoutePermissions

  if (!canAccessRoute(pathname, map, can, isAdmin)) {
    return <Navigate to="/acesso-negado" replace state={{ from: pathname }} />
  }

  return <Outlet />
}
