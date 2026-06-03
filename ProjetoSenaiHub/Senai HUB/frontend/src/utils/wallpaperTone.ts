import type { ResolvedWallpaper } from '../constants/wallpapers'

export type WallpaperTone = 'light' | 'dark'

const DARK_LUMINANCE_THRESHOLD = 0.38
const IMAGE_DARK_THRESHOLD = 0.42

function parseHexColor(hex: string): [number, number, number] | null {
  const raw = hex.trim().replace('#', '')
  if (raw.length === 3) {
    return [
      parseInt(raw[0] + raw[0], 16),
      parseInt(raw[1] + raw[1], 16),
      parseInt(raw[2] + raw[2], 16),
    ]
  }
  if (raw.length === 6) {
    return [parseInt(raw.slice(0, 2), 16), parseInt(raw.slice(2, 4), 16), parseInt(raw.slice(4, 6), 16)]
  }
  return null
}

function channelLinear(value: number): number {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** Luminância relativa WCAG (0 = preto, 1 = branco). */
export function colorLuminance(hex: string): number {
  const rgb = parseHexColor(hex)
  if (!rgb) return 1

  const [r, g, b] = rgb.map(channelLinear)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function luminanceToWallpaperTone(luminance: number, threshold = DARK_LUMINANCE_THRESHOLD): WallpaperTone {
  return luminance < threshold ? 'dark' : 'light'
}

export function resolvePresetWallpaperTone(wallpaper: ResolvedWallpaper): WallpaperTone {
  if (wallpaper.category === 'dark') return 'dark'
  return luminanceToWallpaperTone(colorLuminance(wallpaper.baseColor))
}

/** Amostra a imagem (32×32) e estima se o fundo é escuro ou claro. */
export function detectImageWallpaperTone(src: string): Promise<WallpaperTone> {
  return new Promise((resolve) => {
    const img = new Image()
    img.decoding = 'async'

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const size = 32
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) {
          resolve('dark')
          return
        }

        ctx.drawImage(img, 0, 0, size, size)
        const { data } = ctx.getImageData(0, 0, size, size)
        let sum = 0
        const pixels = data.length / 4

        for (let i = 0; i < data.length; i += 4) {
          const r = channelLinear(data[i])
          const g = channelLinear(data[i + 1])
          const b = channelLinear(data[i + 2])
          sum += 0.2126 * r + 0.7152 * g + 0.0722 * b
        }

        const avg = sum / pixels
        // Véu escuro das imagens personalizadas — inclina para texto claro se ambíguo
        const adjusted = src.startsWith('data:image/') ? avg * 0.88 - 0.04 : avg
        resolve(luminanceToWallpaperTone(adjusted, IMAGE_DARK_THRESHOLD))
      } catch {
        resolve('dark')
      }
    }

    img.onerror = () => resolve('dark')
    img.src = src
  })
}

export async function resolveWallpaperTone(
  wallpaper: ResolvedWallpaper,
  imageUrl: string | null,
): Promise<WallpaperTone> {
  if (wallpaper.kind === 'image' && imageUrl) {
    return detectImageWallpaperTone(imageUrl)
  }
  return resolvePresetWallpaperTone(wallpaper)
}
