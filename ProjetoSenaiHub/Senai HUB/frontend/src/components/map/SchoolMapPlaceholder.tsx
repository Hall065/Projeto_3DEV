import { Layers, MapPin } from 'lucide-react'
import { useMapState } from '../../hooks/useMapState'
import mapPlaceholder from '../../assets/map-placeholder.svg'

interface SchoolMapPlaceholderProps {
  className?: string
}

/**
 * Placeholder visual do mapa escolar 3D.
 * Substituir por SchoolMapCanvas (React Three Fiber) na proxima fase.
 */
export function SchoolMapPlaceholder({ className = '' }: SchoolMapPlaceholderProps) {
  const { config, activeFloor, activeFloorId, setActiveFloorId } = useMapState()

  return (
    <section className={`overflow-hidden rounded-xl border border-slate-200 bg-white ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold text-slate-900">{config.name}</h3>
            <p className="text-xs text-slate-500">Visualizacao 3D em desenvolvimento</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-slate-400" />
          <select
            value={activeFloorId}
            onChange={(e) => setActiveFloorId(e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
          >
            {config.floors.map((floor) => (
              <option key={floor.id} value={floor.id}>
                {floor.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="relative aspect-video bg-slate-100">
        <img
          src={mapPlaceholder}
          alt="Placeholder do mapa escolar 3D"
          className="h-full w-full object-cover opacity-80"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40">
          <div className="rounded-lg bg-white/95 px-6 py-4 text-center shadow-lg">
            <p className="text-sm font-medium text-slate-900">Mapa 3D — Em breve</p>
            <p className="mt-1 text-xs text-slate-500">
              React Three Fiber + multiplos andares + entidades em tempo real
            </p>
            {activeFloor && (
              <p className="mt-2 text-xs text-primary">
                Andar ativo: {activeFloor.name} ({activeFloor.entities.length} entidades mock)
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

