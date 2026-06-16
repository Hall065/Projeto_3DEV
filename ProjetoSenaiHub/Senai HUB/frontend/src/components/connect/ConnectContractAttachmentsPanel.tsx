import { FileText, Loader2, Paperclip, Sparkles, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormField, OutlineButton } from './ConnectShared'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import { connectService } from '../../services/connectService'
import { useConfirmAction } from '../../hooks/useConfirmAction'
import { useCrudToast } from '../../hooks/useCrudToast'
import { resolveMediaUrl } from '../../utils/mediaUrl'
import type { ConnectContractAttachment } from '../../types/connect'

const MAX_FILES = 5
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,application/pdf'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface ConnectContractAttachmentsPanelProps {
  contractId?: number | null
  attachments?: ConnectContractAttachment[]
  onAttachmentsChange?: (attachments: ConnectContractAttachment[]) => void
  readOnly?: boolean
}

export function ConnectContractAttachmentsPanel({
  contractId,
  attachments = [],
  onAttachmentsChange,
  readOnly = false,
}: ConnectContractAttachmentsPanelProps) {
  const { t } = useTranslation()
  const crudToast = useCrudToast()
  const { confirmAction } = useConfirmAction()
  const { user } = useAuth()
  const { can } = usePermissions()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [removingId, setRemovingId] = useState<number | null>(null)

  const canManage = !readOnly && can('connect.contracts.manage')
  const atLimit = attachments.length >= MAX_FILES

  const handlePickFiles = (files: FileList | null) => {
    if (!files?.length || !contractId || !onAttachmentsChange) return
    void uploadFiles(Array.from(files))
  }

  const uploadFiles = async (files: File[]) => {
    if (!contractId || !onAttachmentsChange) return

    setUploading(true)
    const next = [...attachments]

    try {
      for (const file of files) {
        if (next.length >= MAX_FILES) break
        const uploaded = await connectService.uploadContractAttachment(contractId, file)
        next.push(uploaded)
      }
      onAttachmentsChange(next)
      crudToast.notifySuccess(t('connect.contracts.attachments.uploadSuccess'))
    } catch (err: unknown) {
      crudToast.notifyError(err, t('connect.contracts.attachments.uploadError'))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleGenerate = async () => {
    if (!contractId || !onAttachmentsChange) return

    setGenerating(true)
    try {
      const attachment = await connectService.generateContractDocument(contractId, true)
      const withoutGenerated = attachments.filter((item) => !item.is_generated)
      onAttachmentsChange([...withoutGenerated, attachment])
      crudToast.notifySuccess(t('connect.contracts.attachments.generateSuccess'))
    } catch (err: unknown) {
      crudToast.notifyError(err, t('connect.contracts.attachments.generateError'))
    } finally {
      setGenerating(false)
    }
  }

  const removeAttachment = async (attachment: ConnectContractAttachment) => {
    if (!contractId || !onAttachmentsChange) return
    if (!(await confirmAction({ message: t('connect.contracts.attachments.removeConfirm'), variant: 'danger' }))) return

    setRemovingId(attachment.id)
    try {
      await connectService.deleteContractAttachment(contractId, attachment.id)
      onAttachmentsChange(attachments.filter((item) => item.id !== attachment.id))
      crudToast.notifyDeleted()
    } catch (err: unknown) {
      crudToast.notifyError(err, t('connect.contracts.attachments.removeError'))
    } finally {
      setRemovingId(null)
    }
  }

  const canRemoveAttachment = (attachment: ConnectContractAttachment) => {
    if (!canManage) return false
    if (can('connect.contracts.manage')) return true
    return attachment.uploaded_by_user_id != null && attachment.uploaded_by_user_id === user?.id
  }

  return (
    <div>
      <FormField label={t('connect.contracts.attachments.title')}>
        <div className="space-y-3 rounded-xl border border-hub-border/60 bg-hub-surface/40 p-3">
          <p className="text-xs text-hub-text-muted">{t('connect.contracts.attachments.hint')}</p>

          {!contractId ? (
            <p className="text-sm text-hub-text-muted">{t('connect.contracts.attachments.saveFirst')}</p>
          ) : canManage ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPT}
                multiple
                className="hidden"
                onChange={(e) => handlePickFiles(e.target.files)}
              />
              <OutlineButton type="button" onClick={() => fileRef.current?.click()} disabled={uploading || atLimit}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {t('connect.contracts.attachments.add')}
              </OutlineButton>
              <OutlineButton type="button" onClick={() => void handleGenerate()} disabled={generating || atLimit}>
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {t('connect.contracts.attachments.generate')}
              </OutlineButton>
              <span className="text-xs text-hub-text-muted">
                {t('connect.contracts.attachments.count', { count: attachments.length, max: MAX_FILES })}
              </span>
            </div>
          ) : null}

          {attachments.length === 0 ? (
            <p className="text-sm text-hub-text-muted">{t('connect.contracts.attachments.empty')}</p>
          ) : (
            <ul className="space-y-2">
              {attachments.map((attachment) => {
                const url = resolveMediaUrl(attachment.url)
                return (
                  <li
                    key={attachment.id}
                    className="flex items-center gap-3 rounded-lg border border-hub-border/50 bg-white/60 px-3 py-2 dark:bg-hub-surface/80"
                  >
                    {attachment.is_image && url ? (
                      <a href={url} target="_blank" rel="noreferrer" className="shrink-0">
                        <img
                          src={url}
                          alt={attachment.original_name}
                          className="h-12 w-12 rounded-md border border-hub-border/40 object-cover"
                        />
                      </a>
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-hub-border/40 bg-hub-bg">
                        {attachment.mime_type === 'application/pdf' ? (
                          <FileText className="h-5 w-5 text-hub-red" />
                        ) : (
                          <Paperclip className="h-5 w-5 text-hub-text-muted" />
                        )}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="block truncate text-sm font-medium text-hub-navy hover:text-hub-red"
                        >
                          {attachment.original_name}
                        </a>
                      ) : (
                        <p className="truncate text-sm font-medium text-hub-navy">{attachment.original_name}</p>
                      )}
                      <p className="text-xs text-hub-text-muted">
                        {formatFileSize(attachment.size_bytes)}
                        {attachment.is_generated ? ` · ${t('connect.contracts.attachments.generated')}` : ''}
                      </p>
                    </div>

                    {canRemoveAttachment(attachment) && (
                      <button
                        type="button"
                        onClick={() => void removeAttachment(attachment)}
                        disabled={removingId === attachment.id}
                        className="rounded-lg p-2 text-hub-text-muted transition hover:bg-red-50 hover:text-red-600"
                        aria-label={t('connect.contracts.attachments.remove')}
                      >
                        {removingId === attachment.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </FormField>
    </div>
  )
}
