import { Header } from '../components/layout/Header'
import { SchoolMapPlaceholder } from '../components/map/SchoolMapPlaceholder'

export function MapPage() {
  return (
    <>
      <Header title="Mapa Escolar" subtitle="Visualizacao do campus — placeholder 3D" />
      <section className="flex-1 overflow-y-auto p-8">
        <SchoolMapPlaceholder className="h-full min-h-[500px]" />
      </section>
    </>
  )
}
