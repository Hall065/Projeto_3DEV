import { getBrandMarkSrc } from './appBrandAssets'
import type { WallpaperTone } from './wallpaperTone'

export {
  APP_BRAND_ASSETS,
  HUB_BRAND_ASSETS,
  MODULE_BRAND_SLUGS,
  getAppBrandAssets,
  getAppBrandMarkSrc,
  getAppBrandName,
  getBrandMarkSrc,
  getSidebarBrandAssets,
} from './appBrandAssets'

export function getAppBrandMark(slug: string, tone: WallpaperTone): string | undefined {
  return getBrandMarkSrc(slug, tone)
}
