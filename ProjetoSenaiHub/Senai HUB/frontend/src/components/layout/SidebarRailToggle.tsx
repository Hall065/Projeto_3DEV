import { ChevronsLeft, ChevronsRight } from 'lucide-react'

/** Botão de recolher/expandir sidebar — mesmo visual em Hub, Connect e Grid */
export function SidebarRailToggle({
  collapsed,
  onClick,
  className = '',
}: {
  collapsed: boolean
  onClick: () => void
  /** ex.: max-lg:hidden no Connect */
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute -left-4 top-1/2 z-[60] flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-hub-navy text-white shadow-md transition hover:brightness-110 ${className}`}
      aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
    >
      {collapsed ? (
        <ChevronsRight className="h-4 w-4 shrink-0" strokeWidth={2} />
      ) : (
        <ChevronsLeft className="h-4 w-4 shrink-0" strokeWidth={2} />
      )}
    </button>
  )
}
