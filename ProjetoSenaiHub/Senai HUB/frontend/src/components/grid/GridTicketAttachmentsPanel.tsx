import { FileText, ImagePlus, Loader2, Paperclip, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormField, OutlineButton } from '../connect/ConnectShared'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import { gridService } from '../../services/gridService'
import { parseApiError } from '../../utils/parseApiError'
import { resolveMediaUrl } from '../../utils/mediaUrl'
import type { GridTicketAttachment } from '../../types/grid'

const MAX_FILES = 10
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,application/pdf'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface GridTicketAttachmentsPanelProps {
  ticketId?: number | null
  attachments?: GridTicketAttachment[]
  pendingFiles?: File[]
  onPendingFilesChange?: (files: File[]) => void
  onAttachmentsChange?: (attachments: GridTicketAttachment[]) => void
  readOnly?: boolean
}

export function GridTicketAttachmentsPanel({
  ticketId,
  attachments = [],
  pendingFiles = [],
  onPendingFilesChange,
  onAttachmentsChange,
  readOnly = false,
}: GridTicketAttachmentsPanelProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { can } = usePermissions()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [removingId, setRemovingId] = useState<number | null>(null)

  const canUpload = !readOnly && (can('grid.tickets.manage') || can('grid.tickets.view'))
  const canManage = can('grid.tickets.manage')

  const totalCount = attachments.length + pendingFiles.length
  const atLimit = totalCount >= MAX_FILES

  const addPendingFiles = (files: FileList | null) => {
    if (!files?.length || !onPendingFilesChange) return

    const next = [...pendingFiles]
    for (const file of Array.from(files)) {
      if (next.length + attachments.length >= MAX_FILES) break
      next.push(file)
    }
    onPendingFilesChange(next)
  }

  const handlePickFiles = (files: FileList | null) => {
    if (!files?.length) return

    if (!ticketId) {
      addPendingFiles(files)
      return
    }

    void uploadFiles(Array.from(files))
  }

  const uploadFiles = async (files: File[]) => {
    if (!ticketId || !onAttachmentsChange) return

    setUploading(true)
    const next = [...attachments]

    try {
      for (const file of files) {
        if (next.length >= MAX_FILES) break
        const uploaded = await gridService.uploadTicketAttachment(ticketId, file)
        next.push(uploaded)
      }
      onAttachmentsChange(next)
    } catch (err: unknown) {
      window.alert(parseApiError(err, t('grid.tickets.attachments.uploadError')))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removePending = (index: number) => {
    if (!onPendingFilesChange) return
    onPendingFilesChange(pendingFiles.filter((_, i) => i !== index))
  }

  const removeAttachment = async (attachment: GridTicketAttachment) => {
    if (!ticketId || !onAttachmentsChange) return
    if (!window.confirm(t('grid.tickets.attachments.removeConfirm'))) return

    setRemovingId(attachment.id)
    try {
      await gridService.deleteTicketAttachment(ticketId, attachment.id)
      onAttachmentsChange(attachments.filter((item) => item.id !== attachment.id))
    } catch (err: unknown) {
      window.alert(parseApiError(err, t('grid.tickets.attachments.removeError')))
    } finally {
      setRemovingId(null)
    }
  }

  const canRemoveAttachment = (attachment: GridTicketAttachment) => {
    if (readOnly) return false
    if (canManage) return true
    return attachment.uploaded_by_user_id != null && attachment.uploaded_by_user_id === user?.id
  }

  return (
    <div className="sm:col-span-2">
      <FormField label={t('grid.tickets.attachments.title')}>
        <div className="space-y-3 rounded-xl border border-hub-border/60 bg-hub-surface/40 p-3">
          <p className="text-xs text-hub-text-muted">{t('grid.tickets.attachments.hint')}</p>

          {canUpload && (
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
                {t('grid.tickets.attachments.add')}
              </OutlineButton>
              <span className="text-xs text-hub-text-muted">
                {t('grid.tickets.attachments.count', { count: totalCount, max: MAX_FILES })}
              </span>
            </div>
          )}

          {attachments.length === 0 && pendingFiles.length === 0 ? (
            <p className="text-sm text-hub-text-muted">{t('grid.tickets.attachments.empty')}</p>
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
                      <p className="text-xs text-hub-text-muted">{formatFileSize(attachment.size_bytes)}</p>
                    </div>

                    {canRemoveAttachment(attachment) && (
                      <button
                        type="button"
                        onClick={() => void removeAttachment(attachment)}
                        disabled={removingId === attachment.id}
                        className="rounded-lg p-2 text-hub-text-muted transition hover:bg-red-50 hover:text-red-600"
                        aria-label={t('grid.tickets.attachments.remove')}
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

              {pendingFiles.map((file, index) => {
                const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null
                return (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-3 rounded-lg border border-dashed border-hub-border/60 bg-hub-bg/40 px-3 py-2"
                  >
                    {preview ? (
                      <img src={preview} alt={file.name} className="h-12 w-12 rounded-md border object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-white/70">
                        <ImagePlus className="h-5 w-5 text-hub-text-muted" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-hub-navy">{file.name}</p>
                      <p className="text-xs text-hub-text-muted">
                        {formatFileSize(file.size)} · {t('grid.tickets.attachments.pending')}
                      </p>
                    </div>
                    {canUpload && (
                      <button
                        type="button"
                        onClick={() => removePending(index)}
                        className="rounded-lg p-2 text-hub-text-muted transition hover:bg-red-50 hover:text-red-600"
                        aria-label={t('grid.tickets.attachments.remove')}
                      >
                        <Trash2 className="h-4 w-4" />
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

export async function uploadPendingTicketAttachments(ticketId: number, files: File[]): Promise<GridTicketAttachment[]> {
  const uploaded: GridTicketAttachment[] = []
  for (const file of files) {
    uploaded.push(await gridService.uploadTicketAttachment(ticketId, file))
  }
  return uploaded
}
