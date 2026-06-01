import { Navigate, Outlet } from 'react-router-dom'
import { usePermissions } from '../hooks/usePermissions'

export function ModuleAccessRoute({ module }: { module: 'connect' | 'grid' }) {
  const { canAccessModule, isAdmin } = usePermissions()

  if (!canAccessModule(module) && !isAdmin) {
    return <Navigate to="/hub" replace />
  }

  return <Outlet />
}
