import { Archive, Headphones, LayoutGrid, Shield, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SidebarAppLogo } from '../layout/SidebarAppLogo'
import { usePermissions } from '../../hooks/usePermissions'
import { useSupportChat } from '../../contexts/SupportChatContext'

interface HubSidebarProps {
  collapsed: boolean
}

export function HubSidebar({ collapsed }: HubSidebarProps) {
  const { t } = useTranslation()
  const { isAdmin, canAny } = usePermissions()
  const { open: openSupportChat } = useSupportChat()

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

        <button
          type="button"
          onClick={openSupportChat}
          className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-white/85 transition hover:bg-white/10 ${
            collapsed ? 'justify-center px-3' : ''
          }`}
          aria-label={t('safe.sidebar.support')}
        >
          <Headphones className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="flex-1">{t('safe.sidebar.support')}</span>}
        </button>
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
