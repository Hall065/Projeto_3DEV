import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { usePermissions } from '../hooks/usePermissions'

export function ModuleAccessRoute({ module }: { module: 'connect' | 'grid' | 'safe' }) {
  const { pathname } = useLocation()
  const { canAccessModule, isAdmin } = usePermissions()

  if (!canAccessModule(module) && !isAdmin) {
    return <Navigate to="/acesso-negado" replace state={{ from: pathname }} />
  }

  return <Outlet />
}
