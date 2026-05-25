import { X } from 'lucide-react'
import { useEffect } from 'react'

interface ConnectDrawerProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
  width?: 'md' | 'lg' | 'xl'
}

const widthClasses = {
  md: 'w-full max-w-md',
  lg: 'w-full max-w-lg',
  xl: 'w-full max-w-xl sm:max-w-xl',
}

export function ConnectDrawer({ open, onClose, title, subtitle, children, footer, width = 'xl' }: ConnectDrawerProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end p-0 sm:p-2">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Fechar painel" />
      <div
        className={`relative flex h-full w-full max-w-[100vw] flex-col bg-white shadow-2xl ${widthClasses[width]}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between border-b border-hub-border px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-lg font-bold text-hub-navy">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-hub-text-muted">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-hub-bg" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">{children}</div>
        {footer && (
          <div className="border-t border-hub-border px-4 py-4 sm:px-6">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end [&_button]:w-full sm:[&_button]:w-auto">
              {footer}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

