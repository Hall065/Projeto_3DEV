import { Package } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { inventoryDisplayImageUrl, resolveInventoryImageFallback } from '../../utils/inventoryImageFallback'

export function GridInventoryThumb({
  title,
  imageUrl,
  category,
  size = 'md',
  className = '',
}: {
  title: string
  imageUrl?: string | null
  category?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const [candidateIndex, setCandidateIndex] = useState(0)

  const candidates = useMemo(() => {
    const primary = inventoryDisplayImageUrl(title, imageUrl, category)
    const fallback = resolveInventoryImageFallback(title, category)
    return primary === fallback ? [primary] : [primary, fallback]
  }, [title, imageUrl, category])

  const src = candidates[candidateIndex] ?? candidates[0]

  useEffect(() => {
    setFailed(false)
    setCandidateIndex(0)
  }, [candidates])

  const box =
    size === 'sm'
      ? 'h-11 w-11 rounded-lg'
      : size === 'lg'
        ? 'h-28 w-28 rounded-2xl'
        : 'h-16 w-16 rounded-xl'

  if (failed) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center border border-hub-border/50 bg-hub-bg/80 text-hub-text-muted ${box} ${className}`}
        title={title}
      >
        <Package className={size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6'} />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={title}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        if (candidateIndex < candidates.length - 1) {
          setCandidateIndex((index) => index + 1)
          return
        }
        setFailed(true)
      }}
      className={`shrink-0 border border-hub-border/40 bg-white object-contain object-center p-1.5 ${box} ${className}`}
    />
  )
}
