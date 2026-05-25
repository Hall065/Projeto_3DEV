import { useEffect, useState } from 'react'
import { fetchHealthCheck } from '../services/healthService'
import type { HealthCheckResponse } from '../types/api'

export function useHealthCheck() {
  const [data, setData] = useState<HealthCheckResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    fetchHealthCheck()
      .then((response) => {
        if (mounted) {
          setData(response)
          setError(null)
        }
      })
      .catch(() => {
        if (mounted) {
          setError('Nao foi possivel conectar ao backend.')
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  return { data, loading, error }
}
