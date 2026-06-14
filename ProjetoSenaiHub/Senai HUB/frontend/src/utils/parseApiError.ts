import i18n from '../i18n'

interface ApiValidationError {
  message?: string
  errors?: Record<string, string[]>
}

function readAxiosPayload(error: unknown): ApiValidationError | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return undefined
  }

  return (error as { response?: { data?: ApiValidationError } }).response?.data
}

function readAxiosStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return undefined
  }

  return (error as { response?: { status?: number } }).response?.status
}

/**
 * Converte erros Axios/Laravel em mensagem legível para o usuário.
 */
export function parseApiError(error: unknown, fallback?: string): string {
  const defaultFallback = fallback ?? i18n.t('errors.api.fallback')
  const status = readAxiosStatus(error)
  const payload = readAxiosPayload(error)

  if (status === 419) {
    return i18n.t('errors.api.sessionExpired')
  }

  if (status === 403) {
    return payload?.message ?? i18n.t('errors.api.forbidden')
  }

  if (status === 404) {
    return payload?.message ?? i18n.t('errors.api.notFound')
  }

  if (status === 422 && payload?.errors) {
    const firstError = Object.values(payload.errors)[0]?.[0]
    if (firstError) {
      return firstError
    }
  }

  if (payload?.message) {
    return payload.message
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: string }).message
    if (message === 'Network Error') {
      return i18n.t('errors.api.networkError')
    }
  }

  if (status && status >= 500) {
    return i18n.t('errors.api.serverError')
  }

  return defaultFallback
}
