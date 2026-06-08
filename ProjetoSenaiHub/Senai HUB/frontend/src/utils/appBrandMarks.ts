import {
  connectLogoMarkDark,
  connectLogoMarkLight,
  gridLogoMarkDark,
  gridLogoMarkLight,
} from '../assets/brand'
import type { WallpaperTone } from './wallpaperTone'

const marksBySlug: Record<string, Record<WallpaperTone, string>> = {
  connect: {
    light: connectLogoMarkLight,
    dark: connectLogoMarkDark,
  },
  grid: {
    light: gridLogoMarkLight,
    dark: gridLogoMarkDark,
  },
}

export function getAppBrandMark(slug: string, tone: WallpaperTone): string | undefined {
  return marksBySlug[slug]?.[tone]
}
