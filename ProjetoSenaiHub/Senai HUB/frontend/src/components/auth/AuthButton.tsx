import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  children: ReactNode
}

export function AuthButton({ isLoading = false, disabled, children, className = '', ...props }: AuthButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled || isLoading}
      className={`flex h-12 w-full items-center justify-center rounded-xl bg-hub-red text-sm font-semibold text-white transition hover:bg-hub-red-hover disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
      ) : (
        children
      )}
    </button>
  )
}
