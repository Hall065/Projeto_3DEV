import { Link } from 'react-router-dom'
import {
  connectLogoExpanded,
  connectLogoIcon,
  gridLogoExpanded,
  gridLogoIcon,
  hubLogoExpanded,
  hubLogoIcon,
} from '../../assets/brand'

type SidebarApp = 'hub' | 'connect' | 'grid'

const appConfig: Record<
  SidebarApp,
  { expanded: string; icon: string; alt: string; dashboardTo: string }
> = {
  hub: {
    expanded: hubLogoExpanded,
    icon: hubLogoIcon,
    alt: 'SENAI HUB',
    dashboardTo: '/hub',
  },
  connect: {
    expanded: connectLogoExpanded,
    icon: connectLogoIcon,
    alt: 'SENAI Connect',
    dashboardTo: '/connect',
  },
  grid: {
    expanded: gridLogoExpanded,
    icon: gridLogoIcon,
    alt: 'SENAI Grid',
    dashboardTo: '/grid',
  },
}

export function SidebarAppLogo({
  app,
  collapsed,
  onNavigate,
}: {
  app: SidebarApp
  collapsed: boolean
  onNavigate?: () => void
}) {
  const { expanded, icon, alt, dashboardTo } = appConfig[app]
  const src = collapsed ? icon : expanded

  return (
    <Link
      to={dashboardTo}
      onClick={onNavigate}
      className={`block transition-opacity hover:opacity-90 ${collapsed ? 'mx-auto' : ''}`}
      aria-label={`${alt} — ir para o dashboard`}
    >
      <img
        src={src}
        alt={alt}
        className={
          collapsed
            ? 'mx-auto h-11 w-11 object-contain object-center'
            : 'h-auto w-full max-w-[220px] object-contain'
        }
      />
    </Link>
  )
}
