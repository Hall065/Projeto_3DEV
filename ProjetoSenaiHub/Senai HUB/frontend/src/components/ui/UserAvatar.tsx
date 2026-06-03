import { ImagePlus, User } from 'lucide-react'
import type { ReactElement } from 'react'

interface UserAvatarProps {
  name?: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
  interactive?: boolean
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-24 w-24 text-2xl',
}

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-10 w-10',
}

const overlayIconSizes = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-7 w-7',
}

export function getUserInitials(name?: string): string {
  if (!name?.trim()) {
    return '?'
  }

  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}

export function UserAvatar({
  name,
  avatarUrl,
  size = 'md',
  className = '',
  onClick,
  interactive = false,
}: UserAvatarProps) {
  const sizeClass = sizeClasses[size]
  const iconSize = iconSizes[size]
  const overlayIconSize = overlayIconSizes[size]

  let content: ReactElement

  if (avatarUrl) {
    content = (
      <img
        src={avatarUrl}
        alt={name ? `Avatar de ${name}` : 'Avatar do usuario'}
        className={`rounded-full object-cover ${sizeClass} ${className}`}
      />
    )
  } else if (name?.trim()) {
    content = (
      <span
        className={`inline-flex items-center justify-center rounded-full bg-hub-red font-semibold text-white ${sizeClass} ${className}`}
        aria-hidden={false}
        title={name}
      >
        {getUserInitials(name)}
      </span>
    )
  } else {
    content = (
      <span
        className={`inline-flex items-center justify-center rounded-full bg-[#d1d5db] text-[#6b7280] ${sizeClass} ${className}`}
        aria-hidden={!name}
        title={name}
      >
        <User className={iconSize} />
      </span>
    )
  }

  if (!onClick) {
    return content
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hub-red ${
        interactive ? 'cursor-pointer' : ''
      }`}
      aria-label={name ? `Alterar foto de ${name}` : 'Alterar foto de perfil'}
    >
      {content}
      {interactive && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/45 opacity-0 transition group-hover:opacity-100">
          <ImagePlus className={`${overlayIconSize} text-white`} />
        </span>
      )}
    </button>
  )
}
