import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { usePermissions } from '../hooks/usePermissions'
import { canAccessHubArchive } from '../utils/archiveAccess'

export function ArchiveAccessRoute() {
  const { pathname } = useLocation()
  const { isAdmin, canAny } = usePermissions()

  if (!canAccessHubArchive(isAdmin, canAny)) {
    return <Navigate to="/acesso-negado" replace state={{ from: pathname }} />
  }

  return <Outlet />
}
