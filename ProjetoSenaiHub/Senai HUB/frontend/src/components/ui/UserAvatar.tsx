import { User } from 'lucide-react'

interface UserAvatarProps {
  name?: string
  avatarUrl?: string | null
  size?: 'sm' | 'md'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
}

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
}

export function UserAvatar({ name, avatarUrl, size = 'md', className = '' }: UserAvatarProps) {
  const sizeClass = sizeClasses[size]
  const iconSize = iconSizes[size]

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name ? `Avatar de ${name}` : 'Avatar do usuario'}
        className={`rounded-full object-cover ${sizeClass} ${className}`}
      />
    )
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-[#d1d5db] text-[#6b7280] ${sizeClass} ${className}`}
      aria-hidden={!name}
      title={name}
    >
      <User className={iconSize} />
    </span>
  )
}
