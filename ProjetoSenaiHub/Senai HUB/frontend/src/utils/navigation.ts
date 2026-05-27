import type { NavigateFunction } from 'react-router-dom'

/** Volta para a tela anterior; se não houver histórico, usa o fallback. */
export function navigateBack(navigate: NavigateFunction, fallback = '/hub') {
  const idx = (window.history.state as { idx?: number } | null)?.idx
  if (typeof idx === 'number' && idx > 0) {
    navigate(-1)
    return
  }
  if (window.history.length > 1) {
    navigate(-1)
    return
  }
  navigate(fallback)
}
