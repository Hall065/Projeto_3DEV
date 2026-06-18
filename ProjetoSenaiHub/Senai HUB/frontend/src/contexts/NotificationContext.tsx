import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { notificationService } from '../services/notificationService'
import type { HubNotification } from '../types/notification'
import { useAuth } from './AuthContext'

interface NotificationContextValue {
  unreadCount: number
  notifications: HubNotification[]
  isLoading: boolean
  isOpen: boolean
  setOpen: (open: boolean) => void
  refreshUnreadCount: () => Promise<void>
  loadNotifications: () => Promise<void>
  markRead: (id: number) => Promise<void>
  markAllRead: () => Promise<void>
  remove: (id: number) => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

const POLL_INTERVAL_MS = 15_000

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<HubNotification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setOpen] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0)
      return
    }
    try {
      const count = await notificationService.unreadCount()
      setUnreadCount(count)
    } catch {
      /* ignore polling errors */
    }
  }, [isAuthenticated])

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([])
      return
    }
    setIsLoading(true)
    try {
      const response = await notificationService.list({ per_page: 25 })
      setNotifications(response.data)
      setUnreadCount(response.unread_count)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  const markRead = useCallback(async (id: number) => {
    const result = await notificationService.markRead(id)
    setUnreadCount(result.unread_count)
    setNotifications((items) =>
      items.map((item) =>
        item.id === id ? { ...item, is_read: true, read_at: result.notification.read_at } : item,
      ),
    )
  }, [])

  const markAllRead = useCallback(async () => {
    await notificationService.markAllRead()
    setUnreadCount(0)
    setNotifications((items) =>
      items.map((item) => ({ ...item, is_read: true, read_at: item.read_at ?? new Date().toISOString() })),
    )
  }, [])

  const remove = useCallback(async (id: number) => {
    const count = await notificationService.remove(id)
    setUnreadCount(count)
    setNotifications((items) => items.filter((item) => item.id !== id))
  }, [])

  useEffect(() => {
    if (isInitializing || !isAuthenticated) {
      setUnreadCount(0)
      setNotifications([])
      return
    }

    const poll = () => {
      if (isOpen) {
        void loadNotifications()
      } else {
        void refreshUnreadCount()
      }
    }

    void poll()
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [isAuthenticated, isInitializing, isOpen, refreshUnreadCount, loadNotifications])

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      void loadNotifications()
    }
  }, [isOpen, isAuthenticated, loadNotifications])

  const value = useMemo(
    () => ({
      unreadCount,
      notifications,
      isLoading,
      isOpen,
      setOpen,
      refreshUnreadCount,
      loadNotifications,
      markRead,
      markAllRead,
      remove,
    }),
    [
      unreadCount,
      notifications,
      isLoading,
      isOpen,
      refreshUnreadCount,
      loadNotifications,
      markRead,
      markAllRead,
      remove,
    ],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}
