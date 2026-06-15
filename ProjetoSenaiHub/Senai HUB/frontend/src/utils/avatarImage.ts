import i18n from '../i18n'

const MAX_FILE_BYTES = 2 * 1024 * 1024
const MAX_DIMENSION = 512
const JPEG_QUALITY = 0.88

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function validateAvatarFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return i18n.t('images.avatar.invalidType')
  }
  if (file.size > MAX_FILE_BYTES) {
    return i18n.t('images.avatar.tooLarge')
  }
  return null
}

export async function prepareAvatarFile(file: File): Promise<File> {
  const validation = validateAvatarFile(file)
  if (validation) {
    throw new Error(validation)
  }

  if (file.type === 'image/gif') {
    return file
  }

  const objectUrl = URL.createObjectURL(file)

  try {
    const blob = await new Promise<Blob>((resolve, reject) => {
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
          reject(new Error(i18n.t('images.avatar.processFailed')))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (result) => {
            if (!result) {
              reject(new Error(i18n.t('images.avatar.processFailed')))
              return
            }
            resolve(result)
          },
          'image/jpeg',
          JPEG_QUALITY,
        )
      }
      img.onerror = () => reject(new Error(i18n.t('images.avatar.readFailed')))
      img.src = objectUrl
    })

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'avatar'
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export function readAvatarPreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error(i18n.t('images.avatar.readFailed')))
    reader.readAsDataURL(file)
  })
}
