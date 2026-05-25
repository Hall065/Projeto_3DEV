import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { HubHeader } from '../components/hub/HubHeader'
import { HubSidebar } from '../components/hub/HubSidebar'

export function HubLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-hub-bg">
      <HubSidebar collapsed={collapsed} />
      <div className="relative flex flex-1 flex-col">
        <HubHeader collapsed={collapsed} onToggleSidebar={() => setCollapsed((value) => !value)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
