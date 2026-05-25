import type { InputHTMLAttributes, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon: LucideIcon
  error?: string
  rightSlot?: ReactNode
}

export function AuthField({
  label,
  icon: Icon,
  error,
  rightSlot,
  id,
  className = '',
  ...props
}: AuthFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={fieldId} className="text-sm font-medium text-hub-text">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-hub-text-muted" />
        <input
          id={fieldId}
          className={`h-12 w-full rounded-xl border border-hub-border bg-white pl-11 pr-11 text-sm text-hub-text outline-none transition placeholder:text-hub-text-muted/70 focus:border-hub-red focus:ring-2 focus:ring-hub-red/15 ${error ? 'border-red-500' : ''} ${className}`}
          {...props}
        />
        {rightSlot && (
          <div className="absolute inset-y-0 right-0 flex w-11 items-center justify-center">
            {rightSlot}
          </div>
        )}
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
