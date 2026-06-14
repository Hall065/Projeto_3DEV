import { Archive, ChevronRight, Headphones, LayoutGrid, Mail, MessageCircle, Shield, Users, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SidebarAppLogo } from '../layout/SidebarAppLogo'
import { usePermissions } from '../../hooks/usePermissions'

interface HubSidebarProps {
  collapsed: boolean
}

export function HubSidebar({ collapsed }: HubSidebarProps) {
  const { t } = useTranslation()
  const { isAdmin, canAny } = usePermissions()
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

  const showArchive =
    isAdmin ||
    canAny('connect.classes.view', 'connect.classes.manage') ||
    canAny('grid.tickets.view', 'grid.tickets.manage') ||
    canAny('safe.access', 'safe.authorizations.manage', 'safe.approve', 'safe.portaria')

  return (
    <aside
      className={`hub-chrome-sidebar flex min-h-screen flex-col text-white transition-all duration-300 ${
        collapsed ? 'w-[88px] px-4' : 'w-[280px] px-6'
      } py-8`}
    >
      <div className={`mb-8 shrink-0 ${collapsed ? 'flex justify-center px-0' : ''}`}>
        <SidebarAppLogo app="hub" collapsed={collapsed} />
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        <NavLink
          to="/hub"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
              isActive ? 'bg-hub-red text-white' : 'text-white/85 hover:bg-white/10'
            } ${collapsed ? 'justify-center px-3' : ''}`
          }
          title={t('header.appHub')}
        >
          <LayoutGrid className="h-5 w-5 shrink-0" />
          {!collapsed && <span>{t('header.appHub')}</span>}
        </NavLink>

        {showArchive && (
          <NavLink
            to="/hub/arquivo"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive ? 'bg-hub-red text-white' : 'text-white/85 hover:bg-white/10'
              } ${collapsed ? 'justify-center px-3' : ''}`
            }
            title={t('hubSidebar.archive')}
          >
            <Archive className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{t('hubSidebar.archive')}</span>}
          </NavLink>
        )}

        {isAdmin && (
          <NavLink
            to="/hub/usuarios"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive ? 'bg-hub-red text-white' : 'text-white/85 hover:bg-white/10'
              } ${collapsed ? 'justify-center px-3' : ''}`
            }
            title={t('hubSidebar.usersAndRoles')}
          >
            <Users className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{t('hubSidebar.usersAndRoles')}</span>}
          </NavLink>
        )}

        <div className="relative" ref={supportRef}>
          <button
            type="button"
            onClick={() => setSupportOpen((open) => !open)}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-white/85 transition hover:bg-white/10 ${
              collapsed ? 'justify-center px-3' : ''
            }`}
            aria-expanded={supportOpen}
          >
            <Headphones className="h-5 w-5 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1">{t('safe.sidebar.support')}</span>
                <ChevronRight className={`h-4 w-4 transition ${supportOpen ? 'rotate-90' : ''}`} />
              </>
            )}
          </button>

          {supportOpen && !collapsed && (
            <div className="mt-1 rounded-xl border border-white/10 bg-[#002847] p-3 shadow-lg">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/70">{t('safe.sidebar.support')}</p>
                <button
                  type="button"
                  onClick={() => setSupportOpen(false)}
                  className="rounded p-1 hover:bg-white/10"
                  aria-label={t('header.closeMenu')}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <ul className="space-y-1 text-sm">
                <li>
                  <a href="mailto:suporte@senaihub.local" className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-white/10">
                    <Mail className="h-4 w-4" />
                    suporte@senaihub.local
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:suporte@senaihub.local?subject=Suporte%20SENAI%20HUB"
                    className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-white/10"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {t('sidebar.openChat')}
                  </a>
                </li>
              </ul>
            </div>
          )}
        </div>
      </nav>

      {!collapsed && (
        <div className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-white/60">
          <Shield className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{t('safe.sidebar.profileHint')}</p>
        </div>
      )}
    </aside>
  )
}
