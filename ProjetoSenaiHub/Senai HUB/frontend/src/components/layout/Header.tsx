import { Bell, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/Button'

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user, logout } = useAuth()

  return (
    <header className="hub-chrome flex items-center justify-between border-b px-8 py-4">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-white/70">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-lg p-2 text-white/75 transition hover:bg-white/10 hover:text-white"
          aria-label="Notificacoes"
        >
          <Bell className="h-5 w-5" />
        </button>

        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-white">{user?.name ?? 'Usuario Demo'}</p>
          <p className="text-xs text-white/70">{user?.email ?? 'demo@senaihub.local'}</p>
        </div>

        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </header>
  )
}
