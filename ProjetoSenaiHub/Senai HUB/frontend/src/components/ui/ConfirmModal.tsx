import { AlertTriangle, X } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { OutlineButton, PrimaryButton } from '../connect/ConnectShared'

export type ConfirmVariant = 'default' | 'danger'

export interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmVariant
  warning?: string | null
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'default',
  warning,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onCancel])

  if (!open) return null

  const resolvedTitle = title.trim() || t('common.confirmTitle')

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-4" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="glass-panel-solid w-full max-w-md overflow-hidden rounded-2xl shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-hub-border/50 px-5 py-4">
          <div className="min-w-0 pr-4">
            <h2 id="confirm-modal-title" className="text-lg font-semibold text-hub-navy">
              {resolvedTitle}
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm text-hub-text-muted">{message}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-hub-text-muted transition hover:bg-hub-surface hover:text-hub-navy"
            aria-label={cancelLabel ?? t('common.cancel')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {warning && (
          <div className="mx-5 mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{warning}</p>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2 px-5 py-4">
          <OutlineButton onClick={onCancel}>{cancelLabel ?? t('common.cancel')}</OutlineButton>
          {variant === 'danger' ? (
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/30 disabled:opacity-50"
            >
              {confirmLabel ?? t('common.confirmAction')}
            </button>
          ) : (
            <PrimaryButton onClick={onConfirm}>{confirmLabel ?? t('common.confirmAction')}</PrimaryButton>
          )}
        </div>
      </div>
    </div>
  )
}
