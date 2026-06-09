import {
  connectLogoExpanded,
  connectLogoIcon,
  connectLogoMarkDark,
  connectLogoMarkLight,
  gridLogoExpanded,
  gridLogoIcon,
  gridLogoMarkDark,
  gridLogoMarkLight,
  hubLogoExpanded,
  hubLogoIcon,
  safeLogoExpanded,
  safeLogoIcon,
  safeLogoMarkDark,
  safeLogoMarkLight,
} from '../assets/brand'
import type { WallpaperTone } from './wallpaperTone'

/** Slugs com pacote completo de logos: `{slug}-logo-expanded|icon|mark-light|mark-dark`. */
export type AppBrandSlug = 'connect' | 'grid' | 'safe'

export type SidebarAppSlug = 'hub' | AppBrandSlug

export interface AppBrandAssetSet {
  slug: AppBrandSlug
  name: string
  dashboardTo: string
  expanded: string
  icon: string
  markLight: string
  markDark: string
}

export interface HubBrandAssetSet {
  slug: 'hub'
  name: string
  dashboardTo: string
  expanded: string
  icon: string
}

/**
 * Catálogo único — todos os cenários (sidebar, cards, perfil, aparência)
 * usam os mesmos arquivos por slug.
 */
export const APP_BRAND_ASSETS: Record<AppBrandSlug, AppBrandAssetSet> = {
  connect: {
    slug: 'connect',
    name: 'SENAI Connect',
    dashboardTo: '/connect',
    expanded: connectLogoExpanded,
    icon: connectLogoIcon,
    markLight: connectLogoMarkLight,
    markDark: connectLogoMarkDark,
  },
  grid: {
    slug: 'grid',
    name: 'SENAI Grid',
    dashboardTo: '/grid',
    expanded: gridLogoExpanded,
    icon: gridLogoIcon,
    markLight: gridLogoMarkLight,
    markDark: gridLogoMarkDark,
  },
  safe: {
    slug: 'safe',
    name: 'SENAI SAFE',
    dashboardTo: '/safe',
    expanded: safeLogoExpanded,
    icon: safeLogoIcon,
    markLight: safeLogoMarkLight,
    markDark: safeLogoMarkDark,
  },
}

export const HUB_BRAND_ASSETS: HubBrandAssetSet = {
  slug: 'hub',
  name: 'SENAI HUB',
  dashboardTo: '/hub',
  expanded: hubLogoExpanded,
  icon: hubLogoIcon,
}

export const MODULE_BRAND_SLUGS: AppBrandSlug[] = ['connect', 'grid', 'safe']

export function getAppBrandAssets(slug: string): AppBrandAssetSet | undefined {
  if (slug in APP_BRAND_ASSETS) {
    return APP_BRAND_ASSETS[slug as AppBrandSlug]
  }
  return undefined
}

export function getSidebarBrandAssets(app: SidebarAppSlug): AppBrandAssetSet | HubBrandAssetSet {
  if (app === 'hub') return HUB_BRAND_ASSETS
  return APP_BRAND_ASSETS[app]
}

export function getAppBrandMarkSrc(slug: string, tone: WallpaperTone): string | undefined {
  const assets = getAppBrandAssets(slug)
  if (!assets) return undefined
  return tone === 'dark' ? assets.markDark : assets.markLight
}
