import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useSupportChat } from '../../contexts/SupportChatContext'

type SupportChatTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
}

export function SupportChatTrigger({ children, onClick, ...props }: SupportChatTriggerProps) {
  const { open } = useSupportChat()

  return (
    <button
      type="button"
      {...props}
      onClick={(event) => {
        open()
        onClick?.(event)
      }}
    >
      {children}
    </button>
  )
}
