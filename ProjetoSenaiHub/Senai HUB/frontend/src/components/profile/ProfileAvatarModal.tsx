import { ImagePlus, Loader2, Trash2, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { UserAvatar } from '../ui/UserAvatar'
import { OutlineButton, PrimaryButton } from '../connect/ConnectShared'
import { useAuth } from '../../contexts/AuthContext'
import { prepareAvatarFile, readAvatarPreview, validateAvatarFile } from '../../utils/avatarImage'

interface ProfileAvatarModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

export function ProfileAvatarModal({ open, onClose, onSuccess, onError }: ProfileAvatarModalProps) {
  const { user, uploadAvatar, removeAvatar, isSubmitting } = useAuth()
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

  const displayUrl = previewUrl ?? user.avatar_url ?? null
  const busy = isSubmitting || processing

  async function handleFileChange(file: File | null) {
    if (!file) return

    const validation = validateAvatarFile(file)
    if (validation) {
      setLocalError(validation)
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
      setLocalError(error instanceof Error ? error.message : 'Nao foi possivel processar a imagem.')
      setSelectedFile(null)
      setPreviewUrl(null)
    } finally {
      setProcessing(false)
    }
  }

  async function handleSave() {
    if (!selectedFile) {
      setLocalError('Selecione uma imagem antes de salvar.')
      return
    }

    setLocalError(null)

    try {
      await uploadAvatar(selectedFile)
      onSuccess?.('Foto de perfil atualizada com sucesso.')
      onClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel salvar a foto.'
      setLocalError(message)
      onError?.(message)
    }
  }

  async function handleRemove() {
    if (!user?.avatar_url) return

    setLocalError(null)

    try {
      await removeAvatar()
      onSuccess?.('Foto de perfil removida.')
      onClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel remover a foto.'
      setLocalError(message)
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
              Foto de perfil
            </h2>
            <p className="mt-0.5 text-sm text-hub-text-muted">JPG, PNG, WebP ou GIF. Maximo 2 MB.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-hub-text-muted transition hover:bg-hub-bg hover:text-hub-navy"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-6">
          <div className="flex flex-col items-center gap-4">
            {displayUrl ? (
              <img
                src={displayUrl}
                alt={`Preview da foto de ${user.name}`}
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
                Escolher imagem
              </OutlineButton>
              {user.avatar_url && !selectedFile && (
                <OutlineButton type="button" onClick={() => void handleRemove()} disabled={busy}>
                  <Trash2 className="h-4 w-4" />
                  Remover foto
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
              Clique em &quot;Escolher imagem&quot; para enviar uma nova foto de perfil.
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-hub-border/50 px-5 py-4">
          <OutlineButton type="button" onClick={onClose} disabled={busy}>
            Cancelar
          </OutlineButton>
          <PrimaryButton type="button" onClick={() => void handleSave()} disabled={!selectedFile || busy}>
            {busy ? 'Salvando...' : 'Salvar foto'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}
