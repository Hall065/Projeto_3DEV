import { useEffect, useRef, useState } from 'react'
import { Bell, LayoutGrid, LogOut, Menu, Paintbrush, Search, Settings, User as UserIcon } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { SidebarRailToggle } from '../layout/SidebarRailToggle'
import { UserAvatar } from '../ui/UserAvatar'

interface GridHeaderProps {
  collapsed: boolean
  onToggleSidebar: () => void
  isMobileNavOpen?: boolean
}

export function GridHeader({ collapsed, onToggleSidebar, isMobileNavOpen }: GridHeaderProps) {
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

  const mobileMenuLabel = isMobileNavOpen ? 'Fechar menu' : 'Abrir menu'

  return (
    <header className="glass-nav relative z-50 flex shrink-0 items-center gap-2 border-b px-4 py-4 sm:gap-4 sm:px-6 lg:px-8">
      <SidebarRailToggle collapsed={collapsed} onClick={onToggleSidebar} className="max-lg:hidden" />

      <button
        type="button"
        onClick={onToggleSidebar}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-hub-border text-hub-navy transition hover:bg-white/40 lg:hidden"
        aria-label={mobileMenuLabel}
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex min-w-0 flex-1 items-center justify-center px-1 sm:px-4">
        <div className="glass-input flex w-full max-w-2xl min-w-0 items-center gap-2 rounded-full border border-white/50 px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-hub-text-muted" />
          <input
            type="search"
            placeholder="Buscar chamados, tarefas, equipamentos..."
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-hub-text-muted"
          />
        </div>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-4">
        <button
          type="button"
          className="rounded-lg p-2 text-hub-text-muted transition hover:bg-white/40 hover:text-hub-text"
          aria-label="Notificações"
        >
          <Bell className="h-5 w-5" />
        </button>

        <div className="relative z-50" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-white/40"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <UserAvatar name={user?.name} avatarUrl={user?.avatar_url} />
            <div className="hidden text-left sm:block">
              <p className="truncate text-sm font-semibold text-hub-text">{user?.name ?? 'Usuário'}</p>
              <p className="truncate text-xs text-hub-text-muted">{user?.role_label ?? 'Perfil'}</p>
            </div>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="glass-panel-solid absolute right-0 top-full z-[60] mt-2 w-52 overflow-hidden rounded-xl py-2 shadow-xl"
            >
              <Link
                to="/hub"
                role="menuitem"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-hub-text transition hover:bg-hub-bg"
                onClick={() => setMenuOpen(false)}
              >
                <LayoutGrid className="h-4 w-4 text-hub-text-muted" />
                Hub de Aplicações
              </Link>
              <Link
                to="/perfil"
                role="menuitem"
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-hub-bg"
                onClick={() => setMenuOpen(false)}
              >
                <UserIcon className="h-4 w-4" /> Perfil
              </Link>
              <Link
                to="/temas"
                role="menuitem"
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-hub-bg"
                onClick={() => setMenuOpen(false)}
              >
                <Paintbrush className="h-4 w-4 text-hub-text-muted" />
                Temas
              </Link>
              <Link
                to="/configuracoes"
                role="menuitem"
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-hub-bg"
                onClick={() => setMenuOpen(false)}
              >
                <Settings className="h-4 w-4" /> Configurações
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-hub-bg"
              >
                <LogOut className="h-4 w-4" /> Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
