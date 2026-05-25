import { useEffect, useRef, useState } from 'react'
import { Bell, ChevronsLeft, ChevronsRight, LogOut, Settings, User as UserIcon } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
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
    <header className="relative flex items-center justify-end gap-4 border-b border-hub-border/60 bg-white px-8 py-4">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="absolute -left-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-hub-border bg-hub-navy text-white shadow-md transition hover:bg-[#032654]"
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
      </button>

      <button
        type="button"
        className="rounded-lg p-2 text-hub-text-muted transition hover:bg-hub-bg hover:text-hub-text"
        aria-label="Notificacoes"
      >
        <Bell className="h-5 w-5" />
      </button>

      <div className="relative" ref={menuRef}>
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
            className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-xl border border-hub-border bg-white py-2 shadow-xl"
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
