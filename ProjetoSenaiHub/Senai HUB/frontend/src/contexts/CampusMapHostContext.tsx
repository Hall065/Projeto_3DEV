import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CampusMapContainer,
  type CampusMapContainerProps,
} from '../components/map/CampusMapContainer'
import { prefetchCampusMap3DAssets } from '../utils/campusMapAssets'

interface CampusMapHostContextValue {
  isWarm: boolean
  use3d: boolean | null
}

const CampusMapHostContext = createContext<CampusMapHostContextValue | null>(null)

/** Preloads 3D assets once per session after login. */
export function CampusMapHostProvider({ children }: { children: ReactNode }) {
  const [use3d, setUse3d] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false

    void prefetchCampusMap3DAssets().then((available) => {
      if (!cancelled) setUse3d(available)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const isWarm = use3d !== null

  return (
    <CampusMapHostContext.Provider value={{ isWarm, use3d }}>
      {children}
    </CampusMapHostContext.Provider>
  )
}

export function useCampusMapHost() {
  const context = useContext(CampusMapHostContext)
  if (!context) {
    throw new Error('useCampusMapHost must be used within CampusMapHostProvider')
  }
  return context
}

export function CampusMapSlot({ className = '', ...props }: CampusMapContainerProps) {
  const { t } = useTranslation()
  const { isWarm, use3d } = useCampusMapHost()
  const minHeight = props.minHeight ?? '360px'

  if (!isWarm) {
    return (
      <div
        className={`flex w-full items-center justify-center rounded-xl border border-hub-border/60 bg-[#e8edf5] text-sm text-hub-text-muted ${className}`}
        style={{ height: minHeight, minHeight }}
      >
        {t('mapComponents.container.loading')}
      </div>
    )
  }

  return <CampusMapContainer {...props} className={className} use3d={use3d} />
}
