import { useEffect, useRef, useState } from 'react'
import { Bell, LogOut, Settings, User as UserIcon } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { SidebarRailToggle } from '../layout/SidebarRailToggle'
import { UserAvatar } from '../ui/UserAvatar'

interface HubHeaderProps {
  collapsed: boolean
  onToggleSidebar: () => void
}

export function HubHeader({ collapsed, onToggleSidebar }: HubHeaderProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [menuOpen])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="glass-nav relative z-50 flex items-center justify-end gap-4 border-b px-8 py-4">
      <SidebarRailToggle collapsed={collapsed} onClick={onToggleSidebar} />

      <button
        type="button"
        className="rounded-lg p-2 text-hub-text-muted transition hover:bg-hub-bg hover:text-hub-text"
        aria-label="Notificacoes"
      >
        <Bell className="h-5 w-5" />
      </button>

      <div className="relative z-50" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-hub-bg"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <UserAvatar name={user?.name} avatarUrl={user?.avatar_url} />
          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold text-hub-text">{user?.name ?? 'Usuario'}</p>
            <p className="text-xs text-hub-text-muted">{user?.role_label ?? 'Perfil'}</p>
          </div>
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="glass-panel-solid absolute right-0 top-full z-[60] mt-2 w-52 overflow-hidden rounded-xl py-2 shadow-xl"
          >
            <Link
              to="/configuracoes"
              role="menuitem"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-hub-text transition hover:bg-hub-bg"
              onClick={() => setMenuOpen(false)}
            >
              <Settings className="h-4 w-4 text-hub-text-muted" />
              Configuracoes
            </Link>
            <Link
              to="/perfil"
              role="menuitem"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-hub-text transition hover:bg-hub-bg"
              onClick={() => setMenuOpen(false)}
            >
              <UserIcon className="h-4 w-4 text-hub-text-muted" />
              Perfil
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-hub-text transition hover:bg-hub-bg"
            >
              <LogOut className="h-4 w-4 text-hub-text-muted" />
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
