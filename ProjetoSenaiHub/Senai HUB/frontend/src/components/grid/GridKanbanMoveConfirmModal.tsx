import { AlertTriangle, X } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { OutlineButton, PrimaryButton } from '../connect/ConnectShared'

export interface GridKanbanMoveConfirmModalProps {
  open: boolean
  itemLabel: string
  fromLabel: string
  toLabel: string
  warning?: string | null
  showAssignAction?: boolean
  assignActionLabel?: string
  confirmDisabled?: boolean
  onConfirm: () => void
  onCancel: () => void
  onAssign?: () => void
}

export function GridKanbanMoveConfirmModal({
  open,
  itemLabel,
  fromLabel,
  toLabel,
  warning,
  showAssignAction = false,
  assignActionLabel,
  confirmDisabled = false,
  onConfirm,
  onCancel,
  onAssign,
}: GridKanbanMoveConfirmModalProps) {
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

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 px-4" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kanban-move-title"
        className="glass-panel-solid w-full max-w-md overflow-hidden rounded-2xl shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-hub-border/50 px-5 py-4">
          <div className="min-w-0 pr-4">
            <h2 id="kanban-move-title" className="text-lg font-semibold text-hub-navy">
              {t('grid.kanban.confirmMove.title')}
            </h2>
            <p className="mt-2 text-sm text-hub-text-muted">
              {t('grid.kanban.confirmMove.message', { item: itemLabel, from: fromLabel, to: toLabel })}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-hub-text-muted transition hover:bg-hub-surface hover:text-hub-navy"
            aria-label={t('common.cancel')}
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
          <OutlineButton onClick={onCancel}>{t('common.cancel')}</OutlineButton>
          {showAssignAction && onAssign && (
            <OutlineButton onClick={onAssign}>
              {assignActionLabel ?? t('grid.kanban.confirmMove.assign')}
            </OutlineButton>
          )}
          <PrimaryButton onClick={onConfirm} disabled={confirmDisabled}>
            {t('grid.kanban.confirmMove.confirm')}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}
