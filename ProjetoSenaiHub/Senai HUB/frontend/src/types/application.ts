export interface HubApplication {
  id: number
  slug: string
  name: string
  description: string
  route_path: string
  icon: 'users' | 'building' | string
  sort_order: number
}
