import i18n from '../i18n'

const CUSTOM_IMAGE_KEY = 'senai_hub_custom_wallpaper'
const MAX_FILE_BYTES = 5 * 1024 * 1024
const MAX_DIMENSION = 1920
const JPEG_QUALITY = 0.82

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function readCustomWallpaperImage(): string | null {
  try {
    const raw = localStorage.getItem(CUSTOM_IMAGE_KEY)
    return raw && raw.startsWith('data:image/') ? raw : null
  } catch {
    return null
  }
}

export function writeCustomWallpaperImage(dataUrl: string): void {
  localStorage.setItem(CUSTOM_IMAGE_KEY, dataUrl)
}

export function removeCustomWallpaperImage(): void {
  localStorage.removeItem(CUSTOM_IMAGE_KEY)
}

export function validateWallpaperFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return i18n.t('images.wallpaper.invalidType')
  }
  if (file.size > MAX_FILE_BYTES) {
    return i18n.t('images.wallpaper.tooLarge')
  }
  return null
}

export async function compressWallpaperFile(file: File): Promise<string> {
  const validation = validateWallpaperFile(file)
  if (validation) {
    throw new Error(validation)
  }

  const objectUrl = URL.createObjectURL(file)

  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height))
        const width = Math.max(1, Math.round(img.width * scale))
        const height = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error(i18n.t('images.wallpaper.processFailed')))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
      }
      img.onerror = () => reject(new Error(i18n.t('images.wallpaper.loadFailed')))
      img.src = objectUrl
    })

    return dataUrl
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
