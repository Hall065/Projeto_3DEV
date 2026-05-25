import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/layout/Sidebar'

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
