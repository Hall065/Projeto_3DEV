import { useMemo, useState } from 'react'
import type { MapFloor, RealtimeEntityUpdate, SchoolMapConfig } from '../types/map'

const mockMapConfig: SchoolMapConfig = {
  id: 'senai-campus-01',
  name: 'Campus SENAI',
  defaultFloorId: 'floor-1',
  floors: [
    {
      id: 'floor-1',
      name: 'Terreo',
      level: 0,
      entities: [
        {
          id: 'room-101',
          type: 'room',
          floorId: 'floor-1',
          label: 'Sala 101',
          position: { x: 0, y: 0, z: 0 },
        },
      ],
    },
    {
      id: 'floor-2',
      name: '1o Andar',
      level: 1,
      entities: [],
    },
  ],
}

/**
 * Hook preparado para estado do mapa 3D e entidades em tempo real.
 * Sera expandido com React Three Fiber + WebSocket/Supabase.
 */
export function useMapState(initialConfig: SchoolMapConfig = mockMapConfig) {
  const [config] = useState(initialConfig)
  const [activeFloorId, setActiveFloorId] = useState(config.defaultFloorId)
  const [realtimeUpdates, setRealtimeUpdates] = useState<RealtimeEntityUpdate[]>([])

  const activeFloor: MapFloor | undefined = useMemo(
    () => config.floors.find((floor) => floor.id === activeFloorId),
    [config.floors, activeFloorId],
  )

  const applyRealtimeUpdate = (update: RealtimeEntityUpdate) => {
    setRealtimeUpdates((prev) => [...prev.slice(-49), update])
  }

  return {
    config,
    activeFloor,
    activeFloorId,
    setActiveFloorId,
    realtimeUpdates,
    applyRealtimeUpdate,
  }
}
