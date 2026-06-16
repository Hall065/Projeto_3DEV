import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export type SupportChatRole = 'agent' | 'user'

export interface SupportChatMessage {
  id: string
  role: SupportChatRole
  text: string
  createdAt: number
}

type SupportChatView = 'closed' | 'minimized' | 'open'

interface SupportChatContextValue {
  view: SupportChatView
  messages: SupportChatMessage[]
  isAgentTyping: boolean
  open: () => void
  close: () => void
  minimize: () => void
  maximize: () => void
  sendMessage: (text: string) => void
}

const SupportChatContext = createContext<SupportChatContextValue | null>(null)

function createMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function SupportChatProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<SupportChatView>('closed')
  const [messages, setMessages] = useState<SupportChatMessage[]>([])
  const [isAgentTyping, setIsAgentTyping] = useState(false)
  const welcomeAddedRef = useRef(false)
  const replyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const open = useCallback(() => {
    setView('open')
    if (!welcomeAddedRef.current) {
      welcomeAddedRef.current = true
      setMessages([
        {
          id: createMessageId(),
          role: 'agent',
          text: '__welcome__',
          createdAt: Date.now(),
        },
      ])
    }
  }, [])

  const close = useCallback(() => {
    setView('closed')
    setIsAgentTyping(false)
    if (replyTimeoutRef.current) {
      clearTimeout(replyTimeoutRef.current)
      replyTimeoutRef.current = null
    }
  }, [])

  const minimize = useCallback(() => {
    setView('minimized')
  }, [])

  const maximize = useCallback(() => {
    setView('open')
  }, [])

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    setMessages((prev) => [
      ...prev,
      {
        id: createMessageId(),
        role: 'user',
        text: trimmed,
        createdAt: Date.now(),
      },
    ])

    setIsAgentTyping(true)
    if (replyTimeoutRef.current) clearTimeout(replyTimeoutRef.current)

    replyTimeoutRef.current = setTimeout(() => {
      setIsAgentTyping(false)
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          role: 'agent',
          text: '__autoReply__',
          createdAt: Date.now(),
        },
      ])
      replyTimeoutRef.current = null
    }, 1400)
  }, [])

  const value = useMemo(
    () => ({
      view,
      messages,
      isAgentTyping,
      open,
      close,
      minimize,
      maximize,
      sendMessage,
    }),
    [view, messages, isAgentTyping, open, close, minimize, maximize, sendMessage],
  )

  return <SupportChatContext.Provider value={value}>{children}</SupportChatContext.Provider>
}

export function useSupportChat(): SupportChatContextValue {
  const ctx = useContext(SupportChatContext)
  if (!ctx) {
    throw new Error('useSupportChat must be used within SupportChatProvider')
  }
  return ctx
}
