import axios from 'axios'

export function getApiErrorMessage(error: unknown, fallback = 'Operação falhou.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as {
      message?: string
      errors?: Record<string, string[]>
    } | undefined

    if (data?.errors) {
      const first = Object.values(data.errors).flat()[0]
      if (first) {
        return first
      }
    }

    if (data?.message) {
      return data.message
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}
