import type { ReactNode } from 'react'

interface AuthFormCardProps {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthFormCard({ title, subtitle, children, footer }: AuthFormCardProps) {
  return (
    <article className="w-full max-w-[420px] rounded-2xl bg-white px-8 py-9 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
      <header className="mb-7">
        <h1 className="text-[1.65rem] font-bold leading-tight text-hub-text">{title}</h1>
        <p className="mt-2 text-sm text-hub-text-muted">{subtitle}</p>
      </header>

      {children}

      {footer && <footer className="mt-6 text-center text-sm">{footer}</footer>}
    </article>
  )
}
