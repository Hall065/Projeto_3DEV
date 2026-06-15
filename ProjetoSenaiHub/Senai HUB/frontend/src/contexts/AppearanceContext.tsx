import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import i18n from '../i18n'
import {
  CUSTOM_WALLPAPER_ID,
  DEFAULT_WALLPAPER_ID,
  isPresetWallpaperId,
  resolveWallpaper,
  type ResolvedWallpaper,
  type WallpaperId,
} from '../constants/wallpapers'
import {
  readCustomWallpaperImage,
  removeCustomWallpaperImage,
  writeCustomWallpaperImage,
} from '../utils/wallpaperImage'
import { resolveWallpaperTone, type WallpaperTone } from '../utils/wallpaperTone'

const STORAGE_KEY = 'senai_hub_wallpaper'

interface AppearanceContextValue {
  wallpaperId: WallpaperId
  wallpaper: ResolvedWallpaper
  activeWallpaper: ResolvedWallpaper
  wallpaperTone: WallpaperTone
  customImageUrl: string | null
  previewWallpaperId: (id: WallpaperId | null) => void
  previewCustomImageUrl: (url: string | null) => void
  setWallpaperId: (id: WallpaperId) => void
  setCustomWallpaper: (dataUrl: string) => void
  removeCustomWallpaper: () => void
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null)

function readStoredWallpaperId(): WallpaperId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === CUSTOM_WALLPAPER_ID) {
      return readCustomWallpaperImage() ? CUSTOM_WALLPAPER_ID : DEFAULT_WALLPAPER_ID
    }
    if (raw && isPresetWallpaperId(raw)) {
      return raw
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_WALLPAPER_ID
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [wallpaperId, setWallpaperIdState] = useState<WallpaperId>(readStoredWallpaperId)
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(() => readCustomWallpaperImage())
  const [previewId, setPreviewId] = useState<WallpaperId | null>(null)
  const [previewCustomUrl, setPreviewCustomUrl] = useState<string | null>(null)
  const [wallpaperTone, setWallpaperTone] = useState<WallpaperTone>('light')

  const activeId = previewId ?? wallpaperId
  const activeCustomUrl = previewCustomUrl ?? (activeId === CUSTOM_WALLPAPER_ID ? customImageUrl : null)

  const wallpaper = useMemo(
    () => resolveWallpaper(wallpaperId, customImageUrl),
    [wallpaperId, customImageUrl],
  )
  const activeWallpaper = useMemo(
    () => resolveWallpaper(activeId, activeCustomUrl),
    [activeId, activeCustomUrl],
  )

  const setWallpaperId = useCallback((id: WallpaperId) => {
    setWallpaperIdState(id)
    setPreviewId(null)
    setPreviewCustomUrl(null)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      /* ignore */
    }
  }, [])

  const setCustomWallpaper = useCallback((dataUrl: string) => {
    try {
      writeCustomWallpaperImage(dataUrl)
    } catch {
      throw new Error(i18n.t('appearanceContext.imageTooLarge'))
    }
    setCustomImageUrl(dataUrl)
    setWallpaperIdState(CUSTOM_WALLPAPER_ID)
    setPreviewId(null)
    setPreviewCustomUrl(null)
    try {
      localStorage.setItem(STORAGE_KEY, CUSTOM_WALLPAPER_ID)
    } catch {
      /* ignore */
    }
  }, [])

  const removeCustomWallpaper = useCallback(() => {
    removeCustomWallpaperImage()
    setCustomImageUrl(null)
    setPreviewCustomUrl(null)
    if (wallpaperId === CUSTOM_WALLPAPER_ID) {
      setWallpaperIdState(DEFAULT_WALLPAPER_ID)
      try {
        localStorage.setItem(STORAGE_KEY, DEFAULT_WALLPAPER_ID)
      } catch {
        /* ignore */
      }
    }
  }, [wallpaperId])

  const previewWallpaperId = useCallback((id: WallpaperId | null) => {
    setPreviewId(id)
  }, [])

  const previewCustomImageUrl = useCallback((url: string | null) => {
    setPreviewCustomUrl(url)
  }, [])

  useEffect(() => {
    let cancelled = false

    void resolveWallpaperTone(activeWallpaper, activeCustomUrl).then((tone) => {
      if (!cancelled) setWallpaperTone(tone)
    })

    return () => {
      cancelled = true
    }
  }, [activeWallpaper, activeCustomUrl])

  useEffect(() => {
    document.documentElement.dataset.wallpaper = activeId
    document.documentElement.dataset.wallpaperCategory = activeWallpaper.category
    document.documentElement.dataset.wallpaperTone = wallpaperTone
  }, [activeId, activeWallpaper.category, wallpaperTone])

  const value = useMemo(
    () => ({
      wallpaperId,
      wallpaper,
      activeWallpaper,
      wallpaperTone,
      customImageUrl,
      previewWallpaperId,
      previewCustomImageUrl,
      setWallpaperId,
      setCustomWallpaper,
      removeCustomWallpaper,
    }),
    [
      wallpaperId,
      wallpaper,
      activeWallpaper,
      wallpaperTone,
      customImageUrl,
      previewWallpaperId,
      previewCustomImageUrl,
      setWallpaperId,
      setCustomWallpaper,
      removeCustomWallpaper,
    ],
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
