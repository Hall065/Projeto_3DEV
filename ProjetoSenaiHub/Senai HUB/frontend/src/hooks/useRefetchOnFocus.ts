import { useEffect } from 'react'

/** Reexecuta callback quando a aba/janela volta ao foco (dados de dashboard desatualizados). */
export function useRefetchOnFocus(refetch: () => void) {
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        refetch()
      }
    }

    window.addEventListener('focus', refetch)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.removeEventListener('focus', refetch)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refetch])
}
