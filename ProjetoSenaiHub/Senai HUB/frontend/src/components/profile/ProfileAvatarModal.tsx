import { ImagePlus, Loader2, Trash2, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { UserAvatar } from '../ui/UserAvatar'
import { OutlineButton, PrimaryButton } from '../connect/ConnectShared'
import { useAuth } from '../../contexts/AuthContext'
import { useCrudToast } from '../../hooks/useCrudToast'
import { prepareAvatarFile, readAvatarPreview, validateAvatarFile } from '../../utils/avatarImage'
import { resolveMediaUrl } from '../../utils/mediaUrl'

interface ProfileAvatarModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

function mapAvatarValidationError(message: string | null, t: (key: string) => string): string | null {
  if (!message) return null
  if (message.includes('JPG') || message.includes('PNG') || message.includes('WebP') || message.includes('GIF')) {
    return t('profileAvatar.invalidType')
  }
  if (message.includes('2 MB') || message.includes('2MB')) {
    return t('profileAvatar.tooLarge')
  }
  return message
}

export function ProfileAvatarModal({ open, onClose, onSuccess, onError }: ProfileAvatarModalProps) {
  const { t } = useTranslation()
  const { user, uploadAvatar, removeAvatar, isSubmitting } = useAuth()
  const crudToast = useCrudToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (!open) {
      setPreviewUrl(null)
      setSelectedFile(null)
      setLocalError(null)
      setProcessing(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open || !user) {
    return null
  }

  const displayUrl = previewUrl ?? resolveMediaUrl(user.avatar_url)
  const busy = isSubmitting || processing

  async function handleFileChange(file: File | null) {
    if (!file) return

    const validation = validateAvatarFile(file)
    if (validation) {
      setLocalError(mapAvatarValidationError(validation, t))
      return
    }

    setLocalError(null)
    setProcessing(true)

    try {
      const prepared = await prepareAvatarFile(file)
      const preview = await readAvatarPreview(prepared)
      setSelectedFile(prepared)
      setPreviewUrl(preview)
    } catch (error) {
      setLocalError(
        mapAvatarValidationError(error instanceof Error ? error.message : null, t) ?? t('profileAvatar.processError'),
      )
      setSelectedFile(null)
      setPreviewUrl(null)
    } finally {
      setProcessing(false)
    }
  }

  async function handleSave() {
    if (!selectedFile) {
      setLocalError(t('profileAvatar.selectBeforeSave'))
      return
    }

    setLocalError(null)

    try {
      await uploadAvatar(selectedFile)
      const message = t('profileAvatar.updated')
      crudToast.notifySuccess(message)
      onSuccess?.(message)
      onClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : t('profileAvatar.saveError')
      setLocalError(message)
      crudToast.notifyError(error, t('profileAvatar.saveError'))
      onError?.(message)
    }
  }

  async function handleRemove() {
    if (!user?.avatar_url) return

    setLocalError(null)

    try {
      await removeAvatar()
      const message = t('profileAvatar.removed')
      crudToast.notifySuccess(message)
      onSuccess?.(message)
      onClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : t('profileAvatar.removeError')
      setLocalError(message)
      crudToast.notifyError(error, t('profileAvatar.removeError'))
      onError?.(message)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-avatar-title"
        className="glass-panel-solid w-full max-w-md overflow-hidden rounded-2xl shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-hub-border/50 px-5 py-4">
          <div>
            <h2 id="profile-avatar-title" className="text-lg font-semibold text-hub-navy">
              {t('profileAvatar.title')}
            </h2>
            <p className="mt-0.5 text-sm text-hub-text-muted">{t('profileAvatar.hint')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-hub-text-muted transition hover:bg-hub-bg hover:text-hub-navy"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-6">
          <div className="flex flex-col items-center gap-4">
            {displayUrl ? (
              <img
                src={displayUrl}
                alt={t('profileAvatar.previewAlt', { name: user.name })}
                className="h-32 w-32 rounded-full object-cover ring-4 ring-white shadow-md"
              />
            ) : (
              <UserAvatar name={user.name} size="lg" className="ring-4 ring-white shadow-md" />
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                void handleFileChange(file)
                event.target.value = ''
              }}
            />

            <div className="flex flex-wrap justify-center gap-2">
              <OutlineButton type="button" onClick={() => fileRef.current?.click()} disabled={busy}>
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {t('profileAvatar.chooseImage')}
              </OutlineButton>
              {user.avatar_url && !selectedFile && (
                <OutlineButton type="button" onClick={() => void handleRemove()} disabled={busy}>
                  <Trash2 className="h-4 w-4" />
                  {t('profileAvatar.removePhoto')}
                </OutlineButton>
              )}
            </div>
          </div>

          {localError && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {localError}
            </p>
          )}

          {!selectedFile && (
            <div className="rounded-xl border border-dashed border-hub-border bg-hub-bg/50 px-4 py-5 text-center text-sm text-hub-text-muted">
              <ImagePlus className="mx-auto mb-2 h-6 w-6 text-hub-text-muted" />
              {t('profileAvatar.emptyHint')}
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-hub-border/50 px-5 py-4">
          <OutlineButton type="button" onClick={onClose} disabled={busy}>
            {t('common.cancel')}
          </OutlineButton>
          <PrimaryButton type="button" onClick={() => void handleSave()} disabled={!selectedFile || busy}>
            {busy ? t('connect.common.saving') : t('profileAvatar.savePhoto')}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}
