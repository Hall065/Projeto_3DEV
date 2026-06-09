import { NotificationBell } from '../notifications/NotificationBell'
import { GlobalSearchTrigger } from '../search/GlobalSearchTrigger'
import { UserAccountMenu } from '../layout/UserAccountMenu'

export function HubHeader() {
  return (
    <header className="glass-nav relative z-50 flex items-center gap-4 border-b px-8 py-4">
      <div className="mx-auto hidden max-w-xl flex-1 md:block">
        <GlobalSearchTrigger />
      </div>

      <NotificationBell variant="hub" />
      <UserAccountMenu />
    </header>
  )
}
