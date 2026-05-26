import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_WALLPAPER_ID,
  getWallpaperPreset,
  type WallpaperId,
  type WallpaperPreset,
} from '../constants/wallpapers'

const STORAGE_KEY = 'senai_hub_wallpaper'

interface AppearanceContextValue {
  wallpaperId: WallpaperId
  wallpaper: WallpaperPreset
  setWallpaperId: (id: WallpaperId) => void
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null)

function readStoredWallpaper(): WallpaperId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw && getWallpaperPreset(raw)) return raw as WallpaperId
  } catch {
    /* ignore */
  }
  return DEFAULT_WALLPAPER_ID
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [wallpaperId, setWallpaperIdState] = useState<WallpaperId>(readStoredWallpaper)

  const setWallpaperId = useCallback((id: WallpaperId) => {
    setWallpaperIdState(id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      /* ignore */
    }
  }, [])

  const wallpaper = useMemo(() => getWallpaperPreset(wallpaperId), [wallpaperId])

  useEffect(() => {
    document.documentElement.dataset.wallpaper = wallpaperId
  }, [wallpaperId])

  const value = useMemo(
    () => ({ wallpaperId, wallpaper, setWallpaperId }),
    [wallpaperId, wallpaper, setWallpaperId],
  )

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>
}

export function useAppearance() {
  const ctx = useContext(AppearanceContext)
  if (!ctx) {
    throw new Error('useAppearance must be used within AppearanceProvider')
  }
  return ctx
}
