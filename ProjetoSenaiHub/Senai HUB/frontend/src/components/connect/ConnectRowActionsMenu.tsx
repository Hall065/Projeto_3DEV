import type { LucideIcon } from 'lucide-react'
import { MoreVertical } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

export interface ConnectRowAction {
  key: string
  label: string
  icon?: LucideIcon
  onClick: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
}

interface ConnectRowActionsMenuProps {
  actions: ConnectRowAction[]
  /** Rótulo do botão para leitores de tela */
  ariaLabel?: string
  align?: 'left' | 'right'
}

export function ConnectRowActionsMenu({
  actions,
  ariaLabel = 'Abrir menu de ações',
  align = 'right',
}: ConnectRowActionsMenuProps) {
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const visibleActions = actions.filter((a) => !a.disabled)

  if (visibleActions.length === 0) return null

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-hub-text-muted transition hover:bg-hub-bg hover:text-hub-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-hub-red"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className={`glass-panel-solid absolute top-full z-[70] mt-1 min-w-[168px] overflow-hidden rounded-xl py-1 shadow-xl ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {visibleActions.map((action) => {
            const Icon = action.icon
            const isDanger = action.variant === 'danger'
            return (
              <button
                key={action.key}
                type="button"
                role="menuitem"
                disabled={action.disabled}
                onClick={() => {
                  setOpen(false)
                  action.onClick()
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  isDanger
                    ? 'text-hub-red hover:bg-red-50'
                    : 'text-hub-text hover:bg-hub-bg/80'
                }`}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0 opacity-80" />}
                <span>{action.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
