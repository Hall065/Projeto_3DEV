import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { ConnectHeader } from '../components/connect/ConnectHeader'
import { ConnectSidebar } from '../components/connect/ConnectSidebar'
import { GlassShell } from '../components/layout/GlassShell'

export function ConnectLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileNavOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileNavOpen])

  return (
    <GlassShell className="flex h-screen max-h-[100dvh] min-w-0 overflow-hidden">
      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          aria-label="Fechar menu"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <ConnectSidebar
        collapsed={collapsed}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <div className="relative z-50 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <ConnectHeader
          collapsed={collapsed}
          onToggleSidebar={() => {
            if (window.innerWidth < 1024) {
              setMobileNavOpen((open) => !open)
            } else {
              setCollapsed((v) => !v)
            }
          }}
          isMobileNavOpen={mobileNavOpen}
        />
        <main className="scrollbar-app-main relative z-0 min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1600px] min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
    </GlassShell>
  )
}
