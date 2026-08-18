import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getSidebarBrandAssets, type SidebarAppSlug } from '../../utils/appBrandAssets'

export function SidebarAppLogo({
  app,
  collapsed,
  onNavigate,
}: {
  app: SidebarAppSlug
  collapsed: boolean
  onNavigate?: () => void
}) {
  const { t } = useTranslation()
  const assets = getSidebarBrandAssets(app)
  const src = collapsed ? assets.icon : assets.expanded

  return (
    <Link
      to={assets.dashboardTo}
      onClick={onNavigate}
      className={`block transition-opacity hover:opacity-90 ${collapsed ? 'mx-auto' : ''}`}
      aria-label={t('common.goToDashboard', { name: assets.name })}
    >
      {collapsed ? (
        <span className="sidebar-app-logo-mark mx-auto flex h-12 w-12 items-center justify-center rounded-2xl">
          <img src={src} alt={assets.name} className="h-9 w-9 object-contain object-center" />
        </span>
      ) : (
        <img src={src} alt={assets.name} className="h-auto w-full max-w-[220px] object-contain" />
      )}
    </Link>
  )
}
