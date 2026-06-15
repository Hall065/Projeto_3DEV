import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ToastItem, ToastType } from '../../contexts/ToastContext'

const TYPE_STYLES: Record<
  ToastType,
  { container: string; icon: typeof CheckCircle2; iconClass: string }
> = {
  success: {
    container: 'border-emerald-200/80 bg-emerald-50 text-emerald-950 shadow-emerald-900/10',
    icon: CheckCircle2,
    iconClass: 'text-emerald-600',
  },
  error: {
    container: 'border-red-200/80 bg-red-50 text-red-950 shadow-red-900/10',
    icon: XCircle,
    iconClass: 'text-red-600',
  },
  warning: {
    container: 'border-amber-200/80 bg-amber-50 text-amber-950 shadow-amber-900/10',
    icon: AlertCircle,
    iconClass: 'text-amber-600',
  },
  info: {
    container: 'border-sky-200/80 bg-sky-50 text-sky-950 shadow-sky-900/10',
    icon: Info,
    iconClass: 'text-sky-600',
  },
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}) {
  const { t } = useTranslation()

  if (toasts.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[9999] flex flex-col items-end gap-2 px-4 sm:top-5 sm:px-6"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((toast) => {
        const styles = TYPE_STYLES[toast.type]
        const Icon = styles.icon

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-sm animate-[toast-in_0.28s_ease-out] ${styles.container}`}
          >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${styles.iconClass}`} aria-hidden />
            <p className="min-w-0 flex-1 text-sm leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 rounded-lg p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100"
              aria-label={t('toastUi.closeToast')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
