import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { WALLPAPER_PRESETS, getWallpaperPreset, type WallpaperId } from '../../constants/wallpapers'
import { useAppearance } from '../../contexts/AppearanceContext'
import { navigateBack } from '../../utils/navigation'
import { SettingsPageFooter } from './SettingsPageFooter'

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
  const navigate = useNavigate()
  const { wallpaperId, setWallpaperId, previewWallpaperId, wallpaper } = useAppearance()
  const [draftId, setDraftId] = useState<WallpaperId>(wallpaperId)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  useEffect(() => {
    setDraftId(wallpaperId)
  }, [wallpaperId])

  useEffect(() => {
    if (draftId === wallpaperId) {
      previewWallpaperId(null)
      return
    }
    previewWallpaperId(draftId)
  }, [draftId, wallpaperId, previewWallpaperId])

  useEffect(() => () => previewWallpaperId(null), [previewWallpaperId])

  const draftWallpaper = getWallpaperPreset(draftId)
  const dirty = draftId !== wallpaperId

  function handleSave() {
    setWallpaperId(draftId)
    setSavedMessage('Tema salvo com sucesso.')
    window.setTimeout(() => setSavedMessage(null), 3000)
  }

  function handleBack() {
    setDraftId(wallpaperId)
    previewWallpaperId(null)
    navigateBack(navigate)
  }

  return (
    <section className="glass-panel rounded-2xl p-6">
      <header className="mb-5">
        <h2 className="text-lg font-semibold text-hub-navy">Plano de fundo</h2>
        <p className="mt-1 text-sm text-hub-text-muted">
          Clique em um tema para ver a pré-visualização na tela inteira. O tema só é aplicado de
          forma permanente ao Hub, Connect e Grid depois de clicar em{' '}
          <strong className="font-medium text-hub-navy">Salvar</strong>.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {WALLPAPER_PRESETS.map((preset) => {
          const selected = draftId === preset.id
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setDraftId(preset.id)
                setSavedMessage(null)
              }}
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
        {dirty ? (
          <>
            Pré-visualizando: <span className="font-medium text-hub-navy">{draftWallpaper.name}</span>
            {' · '}
            Salvo: <span className="font-medium text-hub-navy">{wallpaper.name}</span>
          </>
        ) : (
          <>
            Tema salvo: <span className="font-medium text-hub-navy">{wallpaper.name}</span>
          </>
        )}
      </p>

      {savedMessage && (
        <p className="mt-3 text-sm font-medium text-emerald-700" role="status">
          {savedMessage}
        </p>
      )}

      <SettingsPageFooter
        onSave={handleSave}
        onBack={handleBack}
        saveDisabled={!dirty}
        saveVariant="danger"
      />
    </section>
  )
}
