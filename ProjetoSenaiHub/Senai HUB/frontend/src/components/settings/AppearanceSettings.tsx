import { Check } from 'lucide-react'
import { WALLPAPER_PRESETS, type WallpaperId } from '../../constants/wallpapers'
import { useAppearance } from '../../contexts/AppearanceContext'

function WallpaperPreview({ presetId, baseColor, mesh }: { presetId: WallpaperId; baseColor: string; mesh: string }) {
  return (
    <div className="relative h-28 overflow-hidden rounded-lg">
      <div className="absolute inset-0" style={{ backgroundColor: baseColor }} />
      <div className="absolute inset-0" style={{ background: mesh.replace(/\s+/g, ' ').trim() }} />
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-white/15" />
      {presetId === 'senai-dawn' && (
        <>
          <div className="absolute -left-4 -top-4 h-20 w-20 rounded-full bg-[#ffb4a2]/50 blur-2xl" />
          <div className="absolute -right-2 top-0 h-16 w-16 rounded-full bg-[#a8c5ff]/45 blur-2xl" />
        </>
      )}
    </div>
  )
}

export function AppearanceSettings() {
  const { wallpaperId, setWallpaperId, wallpaper } = useAppearance()

  return (
    <section className="glass-panel rounded-2xl p-6">
      <header className="mb-5">
        <h2 className="text-lg font-semibold text-hub-navy">Aparência</h2>
        <p className="mt-1 text-sm text-hub-text-muted">
          Plano de fundo colorido com efeito vidro no Hub, Connect e página inicial. O preset{' '}
          <strong className="font-medium text-hub-navy">Amanhecer</strong> é o mais próximo do estilo
          glass moderno.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {WALLPAPER_PRESETS.map((preset) => {
          const selected = wallpaperId === preset.id
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => setWallpaperId(preset.id)}
              className={`group relative overflow-hidden rounded-xl border-2 p-1 text-left transition ${
                selected
                  ? 'border-hub-red ring-2 ring-hub-red/25'
                  : 'border-white/60 hover:border-hub-navy/30'
              }`}
            >
              <WallpaperPreview presetId={preset.id} baseColor={preset.baseColor} mesh={preset.mesh} />
              {selected && (
                <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-hub-red text-white shadow-md">
                  <Check className="h-4 w-4" />
                </span>
              )}
              <div className="px-2 py-2.5">
                <p className="text-sm font-semibold text-hub-navy">{preset.name}</p>
                <p className="mt-0.5 text-xs text-hub-text-muted">{preset.description}</p>
              </div>
            </button>
          )
        })}
      </div>

      <p className="mt-4 text-xs text-hub-text-muted">
        Ativo: <span className="font-medium text-hub-navy">{wallpaper.name}</span>
      </p>
    </section>
  )
}
