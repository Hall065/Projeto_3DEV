import { Eye } from 'lucide-react'
import type { ConnectRowAction } from './ConnectRowActionsMenu'

/** Ação padrão "Ver" para menus de três pontos. */
export function viewRowAction(onView: () => void): ConnectRowAction {
  return {
    key: 'view',
    label: 'Ver',
    icon: Eye,
    onClick: onView,
  }
}
