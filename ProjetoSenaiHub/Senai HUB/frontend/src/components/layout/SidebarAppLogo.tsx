import { Link } from 'react-router-dom'
import { logoConnectBlack, logoGridBlack } from '../../assets/brand'

type SidebarApp = 'connect' | 'grid'

const appConfig: Record<SidebarApp, { src: string; alt: string; dashboardTo: string }> = {
  connect: {
    src: logoConnectBlack,
    alt: 'SENAI Connect',
    dashboardTo: '/connect',
  },
  grid: {
    src: logoGridBlack,
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
  const { src, alt, dashboardTo } = appConfig[app]

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
        className={`object-contain ${collapsed ? 'h-10 w-10' : 'h-auto w-full max-w-[200px]'}`}
      />
    </Link>
  )
}
