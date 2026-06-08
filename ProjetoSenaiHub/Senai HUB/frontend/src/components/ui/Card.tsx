import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  description?: string
  children?: ReactNode
  className?: string
}

export function Card({ title, description, children, className = '' }: CardProps) {
  return (
    <section className={`glass-panel rounded-xl p-6 ${className}`}>
      {(title || description) && (
        <header className="mb-4">
          {title && <h2 className="text-lg font-semibold text-hub-navy">{title}</h2>}
          {description && <p className="mt-1 text-sm text-hub-text-muted">{description}</p>}
        </header>
      )}
      {children}
    </section>
  )
}
