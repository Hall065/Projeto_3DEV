import { Navigate, Outlet } from 'react-router-dom'
import { usePermissions } from '../hooks/usePermissions'

export function AdminRoute() {
  const { isAdmin } = usePermissions()

  if (!isAdmin) {
    return <Navigate to="/hub" replace />
  }

  return <Outlet />
}
