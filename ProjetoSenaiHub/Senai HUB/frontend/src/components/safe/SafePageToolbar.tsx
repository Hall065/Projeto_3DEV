import type { ReactNode } from 'react'
import { ConnectCard, FormField, inputClass } from '../connect/ConnectShared'

interface SafePageToolbarProps {
  search?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  searchLabel?: string
  filters?: ReactNode
  actions?: ReactNode
}

export function SafePageToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  searchLabel,
  filters,
  actions,
}: SafePageToolbarProps) {
  const filterCount = filters ? 1 : 0
  const gridCols = filterCount > 0 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-1 lg:grid-cols-2'

  return (
    <ConnectCard className="mb-4 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className={`grid flex-1 gap-4 ${gridCols}`}>
          {onSearchChange && (
            <FormField label={searchLabel ?? ''}>
              <input
                type="search"
                placeholder={searchPlaceholder}
                value={search ?? ''}
                onChange={(e) => onSearchChange(e.target.value)}
                className={inputClass}
              />
            </FormField>
          )}
          {filters}
        </div>
        {actions ? (
          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end [&_button]:w-full sm:[&_button]:w-auto">
            {actions}
          </div>
        ) : null}
      </div>
    </ConnectCard>
  )
}
