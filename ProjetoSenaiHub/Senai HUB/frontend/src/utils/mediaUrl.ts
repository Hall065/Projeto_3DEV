const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api').replace(/\/api\/?$/, '')

function storagePathname(url: string): string | null {
  if (url.startsWith('/storage/')) return url

  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const { pathname } = new URL(url)
      return pathname.startsWith('/storage/') ? pathname : null
    } catch {
      return null
    }
  }

  if (url.startsWith('storage/')) return `/${url}`

  return null
}

/** URLs públicas de mídia (storage Laravel) — alinha host com VITE_API_URL e mantém previews locais. */
export function resolveMediaUrl(url?: string | null): string | null {
  if (!url?.trim()) return null

  const trimmed = url.trim()

  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed
  }

  const storagePath = storagePathname(trimmed)
  if (storagePath) {
    return `${API_BASE}${storagePath}`
  }

  if (trimmed.startsWith('/')) {
    return `${API_BASE}${trimmed}`
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  return `${API_BASE}/${trimmed}`
}
