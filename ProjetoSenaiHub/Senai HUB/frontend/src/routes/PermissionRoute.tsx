import { Navigate, Outlet, useLocation } from 'react-router-dom'
import {
  connectRoutePermissions,
  gridRoutePermissions,
  safeRoutePermissions,
} from '../config/navPermissions'
import type { RoutePermissionMap, RoutePermissionValue } from '../generated/navManifest'
import { usePermissions } from '../hooks/usePermissions'

/** Nested IDs not present in the generated nav map (e.g. /safe/autorizacoes/12). */
const DYNAMIC_ROUTE_PERMISSIONS: Record<string, RoutePermissionValue> = {
  '/safe/autorizacoes/:id': ['safe.authorizations.manage', 'safe.approve', 'safe.portaria', 'safe.dashboard'],
}

function matchDynamicRoute(pathname: string): RoutePermissionValue | undefined {
  for (const [pattern, permission] of Object.entries(DYNAMIC_ROUTE_PERMISSIONS)) {
    const regex = new RegExp(`^${pattern.replace(/:[^/]+/g, '[^/]+')}$`)
    if (regex.test(pathname)) {
      return permission
    }
  }
  return undefined
}

function lookupRoutePermission(pathname: string, map: RoutePermissionMap): RoutePermissionValue | undefined {
  if (map[pathname]) {
    return map[pathname]
  }

  const dynamic = matchDynamicRoute(pathname)
  if (dynamic) {
    return dynamic
  }

  const keys = Object.keys(map).sort((a, b) => b.length - a.length)
  for (const key of keys) {
    if (!pathname.startsWith(`${key}/`)) {
      continue
    }
    const rest = pathname.slice(key.length + 1)
    if (/^[^/]+$/.test(rest) && (/^\d+$/.test(rest) || /^[0-9a-f-]{8,}$/i.test(rest))) {
      return map[key]
    }
  }

  return undefined
}

function canAccessRoute(
  pathname: string,
  map: RoutePermissionMap,
  can: (permission: string) => boolean,
  isAdmin: boolean,
): boolean {
  if (isAdmin) return true

  const permission = lookupRoutePermission(pathname, map)
  if (!permission) {
    const modulePrefix = pathname.split('/').slice(0, 2).join('/')
    const knownUnderModule = Object.keys(map).some((key) => key === modulePrefix || key.startsWith(`${modulePrefix}/`))
    return !knownUnderModule
  }

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
