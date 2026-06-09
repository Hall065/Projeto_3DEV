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
export function parseApiError(error: unknown, fallback = 'Ocorreu um erro. Tente novamente.'): string {
  const status = readAxiosStatus(error)
  const payload = readAxiosPayload(error)

  if (status === 419) {
    return 'Sessao expirada. Tente novamente.'
  }

  if (status === 403) {
    return payload?.message ?? 'Voce nao tem permissao para esta acao.'
  }

  if (status === 404) {
    return payload?.message ?? 'Recurso nao encontrado.'
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
      return 'Nao foi possivel conectar ao servidor. Verifique se o backend esta rodando.'
    }
  }

  if (status && status >= 500) {
    return 'Erro interno do servidor. Tente novamente em instantes.'
  }

  return fallback
}
