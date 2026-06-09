import { useCallback, useEffect, useRef, useState } from 'react'

interface CacheEntry<T> {
  data: T
  fetchedAt: number
}

const memoryCache = new Map<string, CacheEntry<unknown>>()

export function useCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { ttlMs?: number; enabled?: boolean } = {},
) {
  const { ttlMs = 60_000, enabled = true } = options
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const [data, setData] = useState<T | null>(() => {
    const cached = memoryCache.get(key) as CacheEntry<T> | undefined
    if (cached && Date.now() - cached.fetchedAt < ttlMs) {
      return cached.data
    }
    return null
  })
  const [loading, setLoading] = useState(!data && enabled)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(
    (force = false) => {
      if (!enabled) {
        return Promise.resolve(null)
      }

      const cached = memoryCache.get(key) as CacheEntry<T> | undefined
      if (!force && cached && Date.now() - cached.fetchedAt < ttlMs) {
        setData(cached.data)
        setLoading(false)
        return Promise.resolve(cached.data)
      }

      setLoading(true)
      setError(null)

      return fetcherRef
        .current()
        .then((result) => {
          memoryCache.set(key, { data: result, fetchedAt: Date.now() })
          setData(result)
          return result
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : 'Erro ao carregar dados.'
          setError(message)
          return null
        })
        .finally(() => setLoading(false))
    },
    [enabled, key, ttlMs],
  )

  useEffect(() => {
    void reload(false)
  }, [reload])

  return { data, loading, error, reload }
}

export function invalidateCachedQuery(key: string) {
  memoryCache.delete(key)
}
