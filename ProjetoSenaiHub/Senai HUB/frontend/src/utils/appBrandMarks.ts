import { getAppBrandMarkSrc } from './appBrandAssets'
import type { WallpaperTone } from './wallpaperTone'

export { APP_BRAND_ASSETS, MODULE_BRAND_SLUGS, getAppBrandAssets, getAppBrandMarkSrc, getAppBrandName } from './appBrandAssets'

export function getAppBrandMark(slug: string, tone: WallpaperTone): string | undefined {
  return getAppBrandMarkSrc(slug, tone)
}
