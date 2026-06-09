import api from './api'

export interface CampusBlockConfig {
  id: string
  name: string
}

export interface PublicConfig {
  campus_map_simulation: boolean
  campus_blocks: CampusBlockConfig[]
}

export async function fetchPublicConfig(): Promise<PublicConfig> {
  const { data } = await api.get<{ data: PublicConfig }>('/public-config')
  return data.data
}
