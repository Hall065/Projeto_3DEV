import type { ReactNode } from 'react'
import { useAppearance } from '../../contexts/AppearanceContext'

export function GlassShell({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const { activeWallpaper } = useAppearance()

  return (
    <div className={`app-wallpaper-surface relative min-h-screen min-h-[100dvh] ${className}`}>
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute inset-0" style={{ backgroundColor: activeWallpaper.baseColor }} />

        {activeWallpaper.kind === 'image' && activeWallpaper.imageUrl ? (
          <>
            <img
              src={activeWallpaper.imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className={`absolute inset-0 ${activeWallpaper.veil}`} />
          </>
        ) : (
          <>
            <div
              className="absolute inset-0"
              style={{ background: activeWallpaper.mesh.replace(/\s+/g, ' ').trim() }}
            />
            {activeWallpaper.blobs.map((blobClass, i) => (
              <div key={`${blobClass.slice(0, 24)}-${i}`} className={blobClass} />
            ))}
            <div className={`absolute inset-0 ${activeWallpaper.veil}`} />
          </>
        )}
      </div>
      {children}
    </div>
  )
}
