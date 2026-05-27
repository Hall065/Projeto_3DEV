import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_WALLPAPER_ID,
  getWallpaperPreset,
  type WallpaperId,
  type WallpaperPreset,
} from '../constants/wallpapers'

const STORAGE_KEY = 'senai_hub_wallpaper'

interface AppearanceContextValue {
  /** Tema persistido (localStorage). */
  wallpaperId: WallpaperId
  wallpaper: WallpaperPreset
  /** Tema exibido agora (pré-visualização ou salvo). */
  activeWallpaper: WallpaperPreset
  /** Aplica o tema na tela sem gravar; `null` restaura o tema salvo. */
  previewWallpaperId: (id: WallpaperId | null) => void
  /** Persiste o tema e encerra qualquer pré-visualização. */
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
  const [previewId, setPreviewId] = useState<WallpaperId | null>(null)

  const activeWallpaperId = previewId ?? wallpaperId

  const setWallpaperId = useCallback((id: WallpaperId) => {
    setWallpaperIdState(id)
    setPreviewId(null)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      /* ignore */
    }
  }, [])

  const previewWallpaperId = useCallback((id: WallpaperId | null) => {
    setPreviewId(id)
  }, [])

  const wallpaper = useMemo(() => getWallpaperPreset(wallpaperId), [wallpaperId])
  const activeWallpaper = useMemo(() => getWallpaperPreset(activeWallpaperId), [activeWallpaperId])

  useEffect(() => {
    document.documentElement.dataset.wallpaper = activeWallpaperId
  }, [activeWallpaperId])

  const value = useMemo(
    () => ({ wallpaperId, wallpaper, activeWallpaper, previewWallpaperId, setWallpaperId }),
    [wallpaperId, wallpaper, activeWallpaper, previewWallpaperId, setWallpaperId],
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
