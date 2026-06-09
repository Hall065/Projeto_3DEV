import { Menu } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NotificationBell } from '../notifications/NotificationBell'
import { GlobalSearchTrigger } from '../search/GlobalSearchTrigger'
import { UserAccountMenu } from '../layout/UserAccountMenu'

interface GridHeaderProps {
  onToggleSidebar: () => void
  isMobileNavOpen?: boolean
}

export function GridHeader({ onToggleSidebar, isMobileNavOpen }: GridHeaderProps) {
  const { t } = useTranslation()
  const mobileMenuLabel = isMobileNavOpen ? t('header.closeMenu') : t('header.openMenu')

  return (
    <header className="glass-nav relative z-50 flex shrink-0 items-center gap-2 border-b px-4 py-4 sm:gap-4 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-hub-border text-hub-navy transition hover:bg-hub-bg lg:hidden"
        aria-label={mobileMenuLabel}
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex min-w-0 flex-1 items-center justify-center px-1 sm:px-4">
        <GlobalSearchTrigger />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-4">
        <NotificationBell variant="grid" />
        <UserAccountMenu showHubLink />
      </div>
    </header>
  )
}
