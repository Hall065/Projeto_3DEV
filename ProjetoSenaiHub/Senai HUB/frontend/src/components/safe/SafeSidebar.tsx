import { useTranslation } from 'react-i18next'
import { ChevronRight, Headphones, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { filterNavItems, safeNavItems } from '../../config/navPermissions'
import { usePermissions } from '../../hooks/usePermissions'
import { useNavLabel } from '../../hooks/useNavLabel'
import { SidebarAppLogo } from '../layout/SidebarAppLogo'

interface SafeSidebarProps {
  collapsed: boolean
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function SafeSidebar({ collapsed, mobileOpen = false, onMobileClose }: SafeSidebarProps) {
  const { t } = useTranslation()
  const isCollapsed = collapsed && !mobileOpen
  const { can } = usePermissions()
  const navLabel = useNavLabel('safe')
  const mainNav = filterNavItems(safeNavItems, can)
  const [supportOpen, setSupportOpen] = useState(false)
  const supportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!supportOpen) return
    const onClickOutside = (event: MouseEvent) => {
      if (supportRef.current && !supportRef.current.contains(event.target as Node)) {
        setSupportOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [supportOpen])

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
      isActive ? 'bg-hub-red text-white' : 'text-white/85 hover:bg-white/10'
    } ${isCollapsed ? 'justify-center px-3' : ''}`

  return (
    <aside
      className={`hub-chrome-sidebar fixed inset-y-0 left-0 z-50 flex h-[100dvh] max-h-screen shrink-0 flex-col text-white transition-all duration-300 lg:sticky lg:top-0 lg:z-30 lg:h-screen ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${isCollapsed ? 'w-[88px] px-4 lg:w-[88px]' : 'w-[85vw] max-w-[280px] px-6 lg:w-[280px]'} py-6 sm:py-8`}
    >
      <div className={`mb-4 flex shrink-0 items-start justify-between gap-2 sm:mb-5 ${isCollapsed ? 'flex-col items-center' : ''}`}>
        <div className={isCollapsed ? 'flex w-full justify-center px-0' : 'min-w-0 flex-1'}>
          <SidebarAppLogo app="safe" collapsed={isCollapsed} onNavigate={onMobileClose} />
        </div>
        {mobileOpen && (
          <button
            type="button"
            onClick={onMobileClose}
            className="rounded-lg p-2 hover:bg-white/10 lg:hidden"
            aria-label={t('header.closeMenu')}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="scrollbar-sidebar-navy flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain pr-1">
        {mainNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={linkClass}
            title={navLabel(item)}
            onClick={onMobileClose}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>{navLabel(item)}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto shrink-0 pt-4">
        {!isCollapsed && (
          <div className="mb-4 flex items-start gap-2 text-xs leading-relaxed text-white/60">
            <p>{t('safe.sidebar.profileHint')}</p>
          </div>
        )}
        <div className="relative" ref={supportRef}>
          <button
            type="button"
            onClick={() => setSupportOpen((open) => !open)}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10 ${
              isCollapsed ? 'justify-center px-3' : ''
            }`}
          >
            <Headphones className="h-5 w-5 shrink-0" />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">{t('safe.sidebar.support')}</span>
                <ChevronRight className={`h-4 w-4 ${supportOpen ? 'rotate-90' : ''}`} />
              </>
            )}
          </button>
          {supportOpen && !isCollapsed && (
            <div className="mt-1 rounded-xl border border-white/10 bg-[#002847] p-3 text-sm">
              <a href="mailto:suporte@senaihub.local" className="block rounded-lg px-2 py-2 hover:bg-white/10">
                suporte@senaihub.local
              </a>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
