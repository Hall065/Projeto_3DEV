import { Search } from 'lucide-react'
import { useGlobalSearch } from '../../contexts/GlobalSearchContext'

export function GlobalSearchTrigger({ className = '' }: { className?: string }) {
  const { openSearch } = useGlobalSearch()

  return (
    <button
      type="button"
      onClick={openSearch}
      className={`glass-input flex w-full max-w-2xl min-w-0 items-center gap-2 rounded-full border border-white/50 px-3 py-2 text-left transition hover:border-hub-red/30 ${className}`}
    >
      <Search className="h-4 w-4 shrink-0 text-hub-text-muted" />
      <span className="min-w-0 flex-1 truncate text-sm text-hub-text-muted">Pesquisar... (Ctrl+K)</span>
    </button>
  )
}
