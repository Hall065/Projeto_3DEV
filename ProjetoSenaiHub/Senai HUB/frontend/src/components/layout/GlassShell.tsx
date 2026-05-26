import type { ReactNode } from 'react'
import { useAppearance } from '../../contexts/AppearanceContext'

export function GlassShell({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const { wallpaper } = useAppearance()

  return (
    <div className={`relative min-h-screen min-h-[100dvh] ${className}`}>
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute inset-0" style={{ backgroundColor: wallpaper.baseColor }} />
        <div
          className="absolute inset-0"
          style={{ background: wallpaper.mesh.replace(/\s+/g, ' ').trim() }}
        />
        {wallpaper.blobs.map((blobClass, i) => (
          <div key={`${blobClass.slice(0, 24)}-${i}`} className={blobClass} />
        ))}
        {/* leve véu — não apagar o mesh */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/8 via-transparent to-white/12" />
      </div>
      {children}
    </div>
  )
}
