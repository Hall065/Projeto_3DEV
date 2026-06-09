import api from './api'

export async function submitAccessRequest(payload: {
  name: string
  email: string
  organization?: string
  message?: string
}): Promise<string> {
  const { data } = await api.post<{ message: string }>('/access-requests', payload)
  return data.message
}
