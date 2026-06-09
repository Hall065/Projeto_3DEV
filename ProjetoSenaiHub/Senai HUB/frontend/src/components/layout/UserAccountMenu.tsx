import { useEffect, useRef, useState } from 'react'
import { LayoutGrid, LogOut, Paintbrush, Settings, User as UserIcon } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { UserAvatar } from '../ui/UserAvatar'

export function UserAccountMenu({ showHubLink = false }: { showHubLink?: boolean }) {
  const { t } = useTranslation()
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

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
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
          <p className="truncate text-sm font-semibold text-hub-text">{user?.name ?? t('common.user')}</p>
          <p className="truncate text-xs text-hub-text-muted">{user?.role_label ?? t('common.role')}</p>
        </div>
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="glass-panel-menu absolute right-0 top-full z-[60] mt-2 w-52 overflow-hidden rounded-xl py-2 shadow-xl"
        >
          {showHubLink && (
            <Link
              to="/hub"
              role="menuitem"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-hub-text transition hover:bg-hub-bg"
              onClick={() => setMenuOpen(false)}
            >
              <LayoutGrid className="h-4 w-4 text-hub-text-muted" />
              {t('header.appHub')}
            </Link>
          )}
          <Link
            to="/perfil"
            role="menuitem"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-hub-text transition hover:bg-hub-bg"
            onClick={() => setMenuOpen(false)}
          >
            <UserIcon className="h-4 w-4 text-hub-text-muted" />
            {t('common.profile')}
          </Link>
          <Link
            to="/temas"
            role="menuitem"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-hub-text transition hover:bg-hub-bg"
            onClick={() => setMenuOpen(false)}
          >
            <Paintbrush className="h-4 w-4 text-hub-text-muted" />
            {t('common.themes')}
          </Link>
          <Link
            to="/configuracoes"
            role="menuitem"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-hub-text transition hover:bg-hub-bg"
            onClick={() => setMenuOpen(false)}
          >
            <Settings className="h-4 w-4 text-hub-text-muted" />
            {t('common.settings')}
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => void handleLogout()}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-hub-text transition hover:bg-hub-bg"
          >
            <LogOut className="h-4 w-4 text-hub-text-muted" />
            {t('common.logout')}
          </button>
        </div>
      )}
    </div>
  )
}
