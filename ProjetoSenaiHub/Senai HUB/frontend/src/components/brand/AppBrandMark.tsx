import { useAppearance } from '../../contexts/AppearanceContext'
import { getAppBrandAssets, getAppBrandMarkSrc } from '../../utils/appBrandAssets'

type AppBrandMarkSize = 'sm' | 'md'

const boxSize: Record<AppBrandMarkSize, string> = {
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
}

const imgSize: Record<AppBrandMarkSize, string> = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
}

export function AppBrandMark({
  slug,
  name,
  size = 'md',
  className = '',
}: {
  slug: string
  name: string
  size?: AppBrandMarkSize
  className?: string
}) {
  const { wallpaperTone } = useAppearance()
  const assets = getAppBrandAssets(slug)
  const mark = getAppBrandMarkSrc(slug, wallpaperTone)
  const displayName = assets?.name ?? name

  if (!mark) {
    return (
      <span
        className={`app-brand-mark app-brand-mark-fallback flex ${boxSize[size]} shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-hub-navy ${className}`}
        aria-hidden
      >
        {displayName.charAt(0)}
      </span>
    )
  }

  return (
    <span className={`app-brand-mark flex ${boxSize[size]} shrink-0 items-center justify-center rounded-2xl ${className}`}>
      <img src={mark} alt={displayName} className={`${imgSize[size]} object-contain`} />
    </span>
  )
}
