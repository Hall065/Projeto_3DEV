import { Eye, EyeOff } from 'lucide-react'

interface PasswordToggleProps {
  visible: boolean
  onToggle: () => void
  labelShow: string
  labelHide: string
}

export function PasswordToggle({ visible, onToggle, labelShow, labelHide }: PasswordToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex h-8 w-8 items-center justify-center rounded-md text-hub-text-muted transition hover:text-hub-text"
      aria-label={visible ? labelHide : labelShow}
    >
      {visible ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
    </button>
  )
}
