import { Package } from 'lucide-react'
import { useState } from 'react'

export function GridInventoryThumb({
  title,
  imageUrl,
  size = 'md',
  className = '',
}: {
  title: string
  imageUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const [failed, setFailed] = useState(false)

  const box =
    size === 'sm'
      ? 'h-10 w-10 rounded-lg'
      : size === 'lg'
        ? 'h-20 w-20 rounded-xl'
        : 'h-14 w-14 rounded-xl'

  if (!imageUrl || failed) {
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
      src={imageUrl}
      alt={title}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`shrink-0 border border-hub-border/40 bg-white object-contain p-1 ${box} ${className}`}
    />
  )
}
