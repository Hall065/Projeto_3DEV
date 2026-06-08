import { ChevronsLeft, ChevronsRight } from 'lucide-react'

export const SIDEBAR_WIDTH_EXPANDED = 280
export const SIDEBAR_WIDTH_COLLAPSED = 88

/**
 * Botão flutuante na borda da sidebar — renderizar no layout (GlassShell), não no header,
 * para ficar acima da sidebar e centralizado na divisória.
 */
export function SidebarRailToggle({
  collapsed,
  onClick,
  expandedWidth = SIDEBAR_WIDTH_EXPANDED,
  collapsedWidth = SIDEBAR_WIDTH_COLLAPSED,
}: {
  collapsed: boolean
  onClick: () => void
  expandedWidth?: number
  collapsedWidth?: number
}) {
  const seamLeft = collapsed ? collapsedWidth : expandedWidth
  // Centraliza na divisória, levemente para o painel principal e abaixo da área da logo.
  const toggleLeft = seamLeft + 2
  const toggleTop = collapsed ? '5.25rem' : '2.75rem'

  return (
    <div
      className="pointer-events-none absolute z-[100] hidden -translate-x-1/2 transition-[left,top] duration-300 ease-in-out lg:block"
      style={{ left: toggleLeft, top: toggleTop }}
      aria-hidden
    >
      <button
        type="button"
        onClick={onClick}
        className="pointer-events-auto flex h-10 w-10 cursor-pointer touch-manipulation items-center justify-center rounded-full border-0 bg-transparent p-0 transition active:scale-95"
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        <span className="sidebar-rail-toggle-face flex h-8 w-8 items-center justify-center rounded-full border ring-2 ring-[var(--tw-ring-color)] transition">
          {collapsed ? (
            <ChevronsRight className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
          ) : (
            <ChevronsLeft className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
          )}
        </span>
      </button>
    </div>
  )
}
