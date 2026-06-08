import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { usePermissions } from '../hooks/usePermissions'

export function AdminRoute() {
  const { pathname } = useLocation()
  const { isAdmin } = usePermissions()

  if (!isAdmin) {
    return <Navigate to="/acesso-negado" replace state={{ from: pathname }} />
  }

  return <Outlet />
}
