import { GraduationCap, Loader2, Search, Wrench, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useGlobalSearch } from '../../contexts/GlobalSearchContext'
import { searchService, type SearchResultGroup } from '../../services/searchService'

export function GlobalSearchPalette() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { open, closeSearch } = useGlobalSearch()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [groups, setGroups] = useState<SearchResultGroup[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setQuery('')
      setGroups([])
      window.setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setGroups([])
      return
    }

    const timer = window.setTimeout(() => {
      setLoading(true)
      searchService
        .search(query.trim())
        .then(setGroups)
        .catch(() => setGroups([]))
        .finally(() => setLoading(false))
    }, 250)

    return () => window.clearTimeout(timer)
  }, [query, open])

  if (!open) return null

  const go = (url: string) => {
    closeSearch()
    navigate(url)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 px-4 pt-[12vh]">
      <div className="glass-panel-solid w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl">
        <div className="flex items-center gap-3 border-b border-hub-border/50 px-4 py-3">
          <Search className="h-5 w-5 text-hub-text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="min-w-0 flex-1 cursor-text bg-transparent text-sm outline-none"
          />
          <kbd className="hidden rounded border border-hub-border px-1.5 py-0.5 text-[10px] text-hub-text-muted sm:inline">
            Esc
          </kbd>
          <button
            type="button"
            onClick={closeSearch}
            className="rounded-lg p-1 hover:bg-hub-bg"
            aria-label={t('search.close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {query.trim().length < 2 && (
            <p className="px-3 py-6 text-center text-sm text-hub-text-muted">
              {t('search.minChars')}
            </p>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-hub-text-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> {t('search.searching')}
            </div>
          )}

          {!loading && query.trim().length >= 2 && groups.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-hub-text-muted">{t('search.noResults')}</p>
          )}

          {groups.map((group) => (
            <div key={group.label} className="mb-2">
              <p className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-hub-text-muted">
                {group.module === 'connect' ? (
                  <GraduationCap className="h-3.5 w-3.5" />
                ) : (
                  <Wrench className="h-3.5 w-3.5" />
                )}
                {group.label}
              </p>
              <ul>
                {group.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => go(item.url)}
                      className="flex w-full flex-col rounded-lg px-3 py-2.5 text-left transition hover:bg-hub-bg"
                    >
                      <span className="text-sm font-medium text-hub-navy">{item.title}</span>
                      <span className="text-xs text-hub-text-muted">{item.subtitle}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
