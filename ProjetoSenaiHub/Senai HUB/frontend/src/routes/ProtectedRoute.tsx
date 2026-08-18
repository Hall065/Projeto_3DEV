import { Navigate, Outlet } from 'react-router-dom'
import { AppBootSkeleton } from '../components/ui/PageLoader'
import { useAuth } from '../contexts/AuthContext'
import { CampusMapHostProvider } from '../contexts/CampusMapHostContext'

export function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth()

  if (isInitializing) {
    return <AppBootSkeleton />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <CampusMapHostProvider>
      <Outlet />
    </CampusMapHostProvider>
  )
}
