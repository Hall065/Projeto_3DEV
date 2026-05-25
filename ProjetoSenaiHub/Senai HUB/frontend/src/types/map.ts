/**
 * Tipos para visualização 3D do mapa escolar.
 * Preparado para integração futura com React Three Fiber + Three.js.
 */

export interface MapEntity {
  id: string
  type: 'room' | 'corridor' | 'equipment' | 'person' | 'sensor'
  floorId: string
  label: string
  position: { x: number; y: number; z: number }
  rotation?: { x: number; y: number; z: number }
  metadata?: Record<string, unknown>
}

export interface MapFloor {
  id: string
  name: string
  level: number
  modelUrl?: string
  entities: MapEntity[]
}

export interface SchoolMapConfig {
  id: string
  name: string
  floors: MapFloor[]
  defaultFloorId: string
}

export interface RealtimeEntityUpdate {
  entityId: string
  floorId: string
  position: MapEntity['position']
  timestamp: string
}
