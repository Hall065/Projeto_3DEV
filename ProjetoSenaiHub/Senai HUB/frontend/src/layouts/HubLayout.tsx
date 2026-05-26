import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { HubHeader } from '../components/hub/HubHeader'
import { HubSidebar } from '../components/hub/HubSidebar'
import { GlassShell } from '../components/layout/GlassShell'

export function HubLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <GlassShell className="flex min-h-screen">
      <HubSidebar collapsed={collapsed} />
      <div className="relative z-50 flex flex-1 flex-col">
        <HubHeader collapsed={collapsed} onToggleSidebar={() => setCollapsed((value) => !value)} />
        <main className="scrollbar-app-main relative z-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </GlassShell>
  )
}
