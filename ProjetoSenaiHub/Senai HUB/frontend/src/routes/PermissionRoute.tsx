import { Navigate, Outlet, useLocation } from 'react-router-dom'
import {
  connectRoutePermissions,
  gridRoutePermissions,
  safeRoutePermissions,
} from '../config/navPermissions'
import type { RoutePermissionMap } from '../generated/navManifest'
import { usePermissions } from '../hooks/usePermissions'

function canAccessRoute(
  pathname: string,
  map: RoutePermissionMap,
  can: (permission: string) => boolean,
  isAdmin: boolean,
): boolean {
  if (isAdmin) return true

  const permission = map[pathname]
  if (!permission) return true

  if (typeof permission === 'string') {
    return can(permission)
  }

  return permission.some((p) => can(p))
}

const routePermissionMaps = {
  connect: connectRoutePermissions,
  grid: gridRoutePermissions,
  safe: safeRoutePermissions,
} as const

export function PermissionRoute({ module }: { module: 'connect' | 'grid' | 'safe' }) {
  const { pathname } = useLocation()
  const { can, isAdmin } = usePermissions()
  const map = routePermissionMaps[module]

  if (!canAccessRoute(pathname, map, can, isAdmin)) {
    return <Navigate to="/acesso-negado" replace state={{ from: pathname }} />
  }

  return <Outlet />
}
