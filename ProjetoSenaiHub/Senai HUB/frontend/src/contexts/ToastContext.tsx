import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { ToastContainer } from '../components/ui/ToastContainer'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  message: string
  duration: number
}

interface ToastContextValue {
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  warning: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 4000,
  error: 6500,
  warning: 5000,
  info: 4500,
}

function createToastId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
    setToasts((items) => items.filter((item) => item.id !== id))
  }, [])

  const push = useCallback(
    (type: ToastType, message: string, duration?: number) => {
      const trimmed = message.trim()
      if (!trimmed) return

      const id = createToastId()
      const resolvedDuration = duration ?? DEFAULT_DURATION[type]

      setToasts((items) => [...items.slice(-4), { id, type, message: trimmed, duration: resolvedDuration }])

      const timer = setTimeout(() => dismiss(id), resolvedDuration)
      timersRef.current.set(id, timer)
    },
    [dismiss],
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (message, duration) => push('success', message, duration),
      error: (message, duration) => push('error', message, duration),
      warning: (message, duration) => push('warning', message, duration),
      info: (message, duration) => push('info', message, duration),
      dismiss,
    }),
    [dismiss, push],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
