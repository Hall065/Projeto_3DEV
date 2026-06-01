import api from './api'

export interface SearchResultItem {
  id: string
  title: string
  subtitle: string
  url: string
  meta?: string
}

export interface SearchResultGroup {
  module: string
  label: string
  items: SearchResultItem[]
}

export const searchService = {
  async search(query: string): Promise<SearchResultGroup[]> {
    const { data } = await api.get<{ data: { groups: SearchResultGroup[] } }>('/search', {
      params: { q: query },
    })
    return data.data.groups
  },
}
