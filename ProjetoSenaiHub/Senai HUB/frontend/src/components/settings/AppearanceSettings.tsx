import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Check, ImagePlus, Trash2, Upload } from 'lucide-react'
import {
  CUSTOM_WALLPAPER_ID,
  DEFAULT_WALLPAPER_ID,
  WALLPAPER_GROUPS,
  WALLPAPER_PRESETS,
  resolveWallpaper,
  type PresetWallpaperId,
  type WallpaperId,
} from '../../constants/wallpapers'
import { AppBrandMark } from '../brand/AppBrandMark'
import { getAppBrandName, MODULE_BRAND_SLUGS } from '../../utils/appBrandAssets'
import { useAppearance } from '../../contexts/AppearanceContext'
import { useCrudToast } from '../../hooks/useCrudToast'
import { compressWallpaperFile } from '../../utils/wallpaperImage'
import { navigateBack } from '../../utils/navigation'
import { OutlineButton, PrimaryButton } from '../connect/ConnectShared'
import { SettingsPageFooter } from './SettingsPageFooter'

function WallpaperPreviewCard({
  selected,
  onClick,
  name,
  description,
  children,
}: {
  selected: boolean
  onClick: () => void
  name: string
  description: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border-2 p-1 text-left transition ${
        selected ? 'border-hub-red ring-2 ring-hub-red/25' : 'border-hub-border/50 hover:border-hub-navy/30'
      }`}
    >
      {children}
      {selected && (
        <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-hub-red text-white shadow-md">
          <Check className="h-4 w-4" />
        </span>
      )}
      <div className="px-2 py-2.5">
        <p className="text-sm font-semibold text-hub-navy">{name}</p>
        <p className="mt-0.5 text-xs text-hub-text-muted">{description}</p>
      </div>
    </button>
  )
}

function PresetPreview({ presetId, baseColor, mesh, category }: { presetId: PresetWallpaperId; baseColor: string; mesh: string; category: string }) {
  const lightVeil = category === 'dark' ? 'from-black/20 to-black/40' : 'from-white/5 to-white/15'

  return (
    <div className="relative h-28 overflow-hidden rounded-lg">
      <div className="absolute inset-0" style={{ backgroundColor: baseColor }} />
      <div className="absolute inset-0" style={{ background: mesh.replace(/\s+/g, ' ').trim() }} />
      <div className={`absolute inset-0 bg-gradient-to-b ${lightVeil}`} />
      {presetId === 'senai-dawn' && (
        <>
          <div className="absolute -left-4 -top-4 h-20 w-20 rounded-full bg-[#ffb4a2]/50 blur-2xl" />
          <div className="absolute -right-2 top-0 h-16 w-16 rounded-full bg-[#a8c5ff]/45 blur-2xl" />
        </>
      )}
    </div>
  )
}

const GROUP_LABEL_KEYS = {
  light: 'appearance.groupLight',
  dark: 'appearance.groupDark',
  vivid: 'appearance.groupVivid',
} as const

export function AppearanceSettings({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation()
  const crudToast = useCrudToast()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const {
    wallpaperId,
    customImageUrl,
    setWallpaperId,
    setCustomWallpaper,
    removeCustomWallpaper,
    previewWallpaperId,
    previewCustomImageUrl,
    wallpaper,
    wallpaperTone,
  } = useAppearance()

  const [draftId, setDraftId] = useState<WallpaperId>(wallpaperId)
  const [draftCustomUrl, setDraftCustomUrl] = useState<string | null>(
    wallpaperId === CUSTOM_WALLPAPER_ID ? customImageUrl : null,
  )
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    setDraftId(wallpaperId)
    setDraftCustomUrl(wallpaperId === CUSTOM_WALLPAPER_ID ? customImageUrl : null)
  }, [wallpaperId, customImageUrl])

  useEffect(() => {
    const samePreset = draftId === wallpaperId && draftId !== CUSTOM_WALLPAPER_ID
    const sameCustom =
      draftId === CUSTOM_WALLPAPER_ID &&
      wallpaperId === CUSTOM_WALLPAPER_ID &&
      draftCustomUrl === customImageUrl

    if (samePreset || sameCustom) {
      previewWallpaperId(null)
      previewCustomImageUrl(null)
      return
    }

    previewWallpaperId(draftId)
    previewCustomImageUrl(draftId === CUSTOM_WALLPAPER_ID ? draftCustomUrl : null)
  }, [draftId, draftCustomUrl, wallpaperId, customImageUrl, previewWallpaperId, previewCustomImageUrl])

  useEffect(
    () => () => {
      previewWallpaperId(null)
      previewCustomImageUrl(null)
    },
    [previewWallpaperId, previewCustomImageUrl],
  )

  const draftResolved = resolveWallpaper(
    draftId,
    draftId === CUSTOM_WALLPAPER_ID ? draftCustomUrl : null,
  )

  const dirty =
    draftId !== wallpaperId ||
    (draftId === CUSTOM_WALLPAPER_ID && draftCustomUrl !== customImageUrl)

  async function handleFileChange(file: File | undefined) {
    if (!file) return
    setUploadError(null)
    setUploading(true)
    try {
      const dataUrl = await compressWallpaperFile(file)
      setDraftId(CUSTOM_WALLPAPER_ID)
      setDraftCustomUrl(dataUrl)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t('appearance.uploadError'))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function handleSave() {
    try {
      if (draftId === CUSTOM_WALLPAPER_ID && draftCustomUrl) {
        setCustomWallpaper(draftCustomUrl)
      } else if (draftId !== CUSTOM_WALLPAPER_ID) {
        setWallpaperId(draftId)
      }
      crudToast.notifySuccess(t('appearance.saved'))
      setUploadError(null)
    } catch (err) {
      crudToast.notifyError(err, t('appearance.saveError'))
    }
  }

  function handleBack() {
    setDraftId(wallpaperId)
    setDraftCustomUrl(wallpaperId === CUSTOM_WALLPAPER_ID ? customImageUrl : null)
    previewWallpaperId(null)
    previewCustomImageUrl(null)
    navigateBack(navigate)
  }

  function handleRemoveCustom() {
    removeCustomWallpaper()
    setDraftId(DEFAULT_WALLPAPER_ID)
    setDraftCustomUrl(null)
    setUploadError(null)
  }

  const hasSavedCustom = Boolean(customImageUrl)

  return (
    <section className="glass-panel rounded-2xl p-6">
      <header className="mb-5">
        <h2 className="text-lg font-semibold text-hub-navy">{t('appearance.wallpaper')}</h2>
        <p className="mt-1 text-sm text-hub-text-muted">{t('appearance.wallpaperHint')}</p>
      </header>

      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-hub-border/60 bg-hub-bg/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-hub-navy">
            {t('appearance.toneTitle', {
              tone: t(wallpaperTone === 'dark' ? 'appearance.toneDark' : 'appearance.toneLight'),
            })}
          </p>
          <p className="mt-0.5 text-xs text-hub-text-muted">{t('appearance.toneHint')}</p>
        </div>
        <div className="flex items-center gap-2">
          {MODULE_BRAND_SLUGS.map((slug) => (
            <AppBrandMark key={slug} slug={slug} name={getAppBrandName(slug)} size="sm" />
          ))}
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-dashed border-hub-border/70 bg-hub-bg/40 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-lg border border-hub-border/50 sm:h-24 sm:w-40">
            {draftCustomUrl ? (
              <img src={draftCustomUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center bg-hub-bg text-hub-text-muted">
                <ImagePlus className="h-8 w-8 opacity-50" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-hub-navy">{t('appearance.customImage')}</h3>
            <p className="mt-1 text-xs text-hub-text-muted">{t('appearance.customImageHint')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => void handleFileChange(e.target.files?.[0])}
              />
              <OutlineButton type="button" disabled={uploading} onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4" />
                {uploading ? t('appearance.processing') : t('appearance.uploadImage')}
              </OutlineButton>
              {hasSavedCustom && (
                <OutlineButton type="button" onClick={handleRemoveCustom}>
                  <Trash2 className="h-4 w-4" />
                  {t('appearance.removeImage')}
                </OutlineButton>
              )}
            </div>
            {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
          </div>
        </div>

      </div>

      {WALLPAPER_GROUPS.map((group) => {
        const presets = WALLPAPER_PRESETS.filter((p) => p.category === group.category)
        if (presets.length === 0) return null

        return (
          <div key={group.category} className="mb-6 last:mb-0">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-hub-text-muted">
              {t(GROUP_LABEL_KEYS[group.category])}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {presets.map((preset) => (
                <WallpaperPreviewCard
                  key={preset.id}
                  selected={draftId === preset.id}
                  name={t(preset.nameKey)}
                  description={t(preset.descriptionKey)}
                  onClick={() => {
                    setDraftId(preset.id)
                  }}
                >
                  <PresetPreview
                    presetId={preset.id}
                    baseColor={preset.baseColor}
                    mesh={preset.mesh}
                    category={preset.category}
                  />
                </WallpaperPreviewCard>
              ))}
            </div>
          </div>
        )
      })}

      <p className="mt-4 text-xs text-hub-text-muted">
        {dirty ? (
          <>
            {t('appearance.previewing')}: <span className="font-medium text-hub-navy">{draftResolved.name}</span>
            {' · '}
            {t('appearance.savedTheme')}: <span className="font-medium text-hub-navy">{wallpaper.name}</span>
          </>
        ) : (
          <>
            {t('appearance.savedTheme')}: <span className="font-medium text-hub-navy">{wallpaper.name}</span>
          </>
        )}
      </p>

      {embedded ? (
        dirty && (
          <div className="mt-6 flex justify-end border-t border-hub-border/40 pt-4">
            <PrimaryButton type="button" onClick={handleSave}>
              {t('common.save')}
            </PrimaryButton>
          </div>
        )
      ) : (
        <SettingsPageFooter onSave={handleSave} onBack={handleBack} saveDisabled={!dirty} saveVariant="danger" />
      )}
    </section>
  )
}
