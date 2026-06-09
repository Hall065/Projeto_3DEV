import { useEffect, useState } from 'react'
import { fetchPublicConfig, type PublicConfig } from '../services/publicConfigService'

let cachedConfig: PublicConfig | null = null

export function usePublicConfig() {
  const [config, setConfig] = useState<PublicConfig | null>(cachedConfig)

  useEffect(() => {
    if (cachedConfig) {
      return
    }

    fetchPublicConfig()
      .then((data) => {
        cachedConfig = data
        setConfig(data)
      })
      .catch(() => setConfig({ campus_map_simulation: true, campus_blocks: [] }))
  }, [])

  return config
}
