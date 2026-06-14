import { RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { CAMPUS_BLOCKS, type CampusBlockId } from '../../constants/campusBlocks'
import type { CampusBlockStats } from '../../utils/campusBlockStats'
import type { CampusPersonLocation } from '../../types/campusPeople'
import { CAMPUS_PERSON_ROLE_COLORS } from '../../types/campusPeople'
import type { CampusTicketMarker } from '../../types/campusTickets'
import { ticketMarkerColor } from '../../utils/campusTicketMarkers'
import i18n from '../../i18n'
import { CampusMapBlockPanel } from './CampusMapBlockPanel'
import { CampusMapPeopleLegend, CampusMapPeoplePanel } from './CampusMapPeoplePanel'
import { CampusMapTicketsLegend, CampusMapTicketsPanel } from './CampusMapTicketsPanel'
import {
  buildBlockPinMarkers,
  disposePinMarkerGroup,
  type PinMarkerBlock,
} from './campusPinMarker3d'

const DIMMED_OPACITY = 0.2
const FULL_OPACITY = 1
const MIN_XRAY_OPACITY = 0.1
/** Quanto menor, mais zoom na visao inicial (0.56 ≈ campus ocupando ~75% da tela). */
const DEFAULT_CAMERA_ZOOM = 0.56
const DEFAULT_CAMERA_DIRECTION = new THREE.Vector3(0.92, 0.44, 0.78).normalize()

function computeCampusFitDistance(maxDim: number, fovDeg: number): number {
  const fovRad = (fovDeg * Math.PI) / 180
  return ((maxDim / 2) / Math.tan(fovRad / 2)) * DEFAULT_CAMERA_ZOOM
}

function applyDefaultCampusView(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  center: THREE.Vector3,
  distance: number,
) {
  controls.target.copy(center)
  camera.position.copy(center).add(DEFAULT_CAMERA_DIRECTION.clone().multiplyScalar(distance))
  controls.update()
}

interface BlockGroup {
  id: CampusBlockId
  group: THREE.Group
}

interface MeshOpacityTarget {
  mesh: THREE.Mesh
  blockId: CampusBlockId
  center: THREE.Vector3
  radius: number
}

function prepareMaterials(object: THREE.Object3D) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    if (Array.isArray(child.material)) {
      child.material = child.material.map((material) => material.clone())
    } else if (child.material) {
      child.material = child.material.clone()
    }
  })
}

function applyMeshOpacity(mesh: THREE.Mesh, opacity: number) {
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
  for (const material of materials) {
    material.opacity = opacity
    material.transparent = opacity < 0.99
    material.depthWrite = opacity >= 0.92
    material.needsUpdate = true
  }
}

function collectMeshTargets(blocks: BlockGroup[]): MeshOpacityTarget[] {
  const targets: MeshOpacityTarget[] = []
  for (const block of blocks) {
    block.group.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      const box = new THREE.Box3().setFromObject(child)
      const center = box.getCenter(new THREE.Vector3())
      const sphere = box.getBoundingSphere(new THREE.Sphere())
      targets.push({
        mesh: child,
        blockId: block.id,
        center,
        radius: Math.max(sphere.radius, 1),
      })
    })
  }
  return targets
}

function updateProximityOpacity(
  camera: THREE.PerspectiveCamera,
  lookTarget: THREE.Vector3,
  meshTargets: MeshOpacityTarget[],
  selectedBlockId: CampusBlockId | null,
  campusRadius: number,
) {
  const cameraToTarget = camera.position.distanceTo(lookTarget)
  const fadeStart = campusRadius * 0.55
  const fadeEnd = campusRadius * 0.12
  const zoomFactor = 1 - THREE.MathUtils.smoothstep(cameraToTarget, fadeEnd, fadeStart)

  const viewDir = new THREE.Vector3().subVectors(lookTarget, camera.position)
  const viewLength = viewDir.length()
  if (viewLength < 0.001) return
  viewDir.divideScalar(viewLength)

  const toCenter = new THREE.Vector3()
  const lateral = new THREE.Vector3()

  for (const { mesh, blockId, center, radius } of meshTargets) {
    const selectionOpacity =
      selectedBlockId === null || blockId === selectedBlockId ? FULL_OPACITY : DIMMED_OPACITY

    if (zoomFactor <= 0.001) {
      applyMeshOpacity(mesh, selectionOpacity)
      continue
    }

    toCenter.subVectors(center, camera.position)
    const distToMesh = toCenter.length()
    const distAlongView = toCenter.dot(viewDir)
    const lateralDistance = lateral.copy(toCenter).addScaledVector(viewDir, -distAlongView).length()

    const isObstructing =
      distAlongView > 0 &&
      distAlongView < cameraToTarget + radius * 0.5 &&
      lateralDistance < radius * 2.2

    const proximityFactor = 1 - THREE.MathUtils.smoothstep(distToMesh, fadeEnd, fadeStart)
    const obstructionWeight = isObstructing ? 1 : proximityFactor * 0.45
    const xrayStrength = zoomFactor * Math.max(proximityFactor, obstructionWeight)

    const xrayOpacity = THREE.MathUtils.lerp(FULL_OPACITY, MIN_XRAY_OPACITY, xrayStrength)
    applyMeshOpacity(mesh, selectionOpacity * xrayOpacity)
  }
}

function findBlockId(object: THREE.Object3D | null): CampusBlockId | null {
  let current: THREE.Object3D | null = object
  while (current) {
    if (current.userData.blockId) return current.userData.blockId as CampusBlockId
    current = current.parent
  }
  return null
}

function findMarkerId(object: THREE.Object3D | null): string | null {
  let current: THREE.Object3D | null = object
  while (current) {
    if (current.userData.markerId) return current.userData.markerId as string
    current = current.parent
  }
  return null
}

export interface CampusMap3DViewerProps {
  blockStats?: Record<CampusBlockId, CampusBlockStats>
  people?: CampusPersonLocation[]
  ticketMarkers?: CampusTicketMarker[]
  selectedBlockId?: CampusBlockId | null
  selectedPersonId?: string | null
  selectedTicketId?: string | null
  onSelectBlock?: (blockId: CampusBlockId | null) => void
  onSelectPerson?: (personId: string | null) => void
  onSelectTicket?: (ticketId: string | null) => void
  className?: string
  minHeight?: string
  compact?: boolean
  showPanel?: boolean
  showToolbar?: boolean
}

export function CampusMap3DViewer({
  blockStats,
  people,
  ticketMarkers,
  selectedBlockId = null,
  selectedPersonId = null,
  selectedTicketId = null,
  onSelectBlock,
  onSelectPerson,
  onSelectTicket,
  className = '',
  minHeight = '320px',
  compact = false,
  showPanel = true,
  showToolbar = true,
}: CampusMap3DViewerProps) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasHostRef = useRef<HTMLDivElement>(null)
  const blocksRef = useRef<BlockGroup[]>([])
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const campusCenterRef = useRef(new THREE.Vector3())
  const campusDistanceRef = useRef(40)
  const campusRadiusRef = useRef(40)
  const selectedBlockRef = useRef<CampusBlockId | null>(null)
  const selectedPersonRef = useRef<string | null>(null)
  const selectedTicketRef = useRef<string | null>(null)
  const peopleRef = useRef<CampusPersonLocation[]>(people ?? [])
  const ticketMarkersRef = useRef<CampusTicketMarker[]>(ticketMarkers ?? [])
  const markersGroupRef = useRef<THREE.Group | null>(null)
  const mapReadyRef = useRef(false)
  const markerRadiusRef = useRef(10)
  const sceneRefForMarkers = useRef<THREE.Scene | null>(null)
  const raycasterRef = useRef(new THREE.Raycaster())
  const pointerRef = useRef(new THREE.Vector2())
  const animationRef = useRef<number | null>(null)

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadedBlocks, setLoadedBlocks] = useState<CampusBlockId[]>([])
  const [internalSelected, setInternalSelected] = useState<CampusBlockId | null>(selectedBlockId)

  const activeBlockId = onSelectBlock ? selectedBlockId : internalSelected

  const setSelectedBlock = useCallback(
    (blockId: CampusBlockId | null) => {
      selectedBlockRef.current = blockId
      if (onSelectBlock) onSelectBlock(blockId)
      else setInternalSelected(blockId)
    },
    [onSelectBlock],
  )

  const setSelectedPerson = useCallback(
    (personId: string | null) => {
      selectedPersonRef.current = personId
      onSelectPerson?.(personId)
    },
    [onSelectPerson],
  )

  const setSelectedTicket = useCallback(
    (ticketId: string | null) => {
      selectedTicketRef.current = ticketId
      onSelectTicket?.(ticketId)
    },
    [onSelectTicket],
  )

  const syncMapMarkers = useCallback(() => {
    const scene = sceneRefForMarkers.current
    if (!scene || !mapReadyRef.current) return

    if (markersGroupRef.current) {
      scene.remove(markersGroupRef.current)
      disposePinMarkerGroup(markersGroupRef.current)
      markersGroupRef.current = null
    }

    const pinBlocks = blocksRef.current as PinMarkerBlock[]
    const scale = markerRadiusRef.current

    if (peopleRef.current.length > 0) {
      markersGroupRef.current = buildBlockPinMarkers(
        peopleRef.current,
        pinBlocks,
        scale,
        (person) => CAMPUS_PERSON_ROLE_COLORS[person.role],
      )
    } else if (ticketMarkersRef.current.length > 0) {
      markersGroupRef.current = buildBlockPinMarkers(
        ticketMarkersRef.current,
        pinBlocks,
        scale,
        (marker) => ticketMarkerColor(marker),
      )
    }

    if (markersGroupRef.current) {
      scene.add(markersGroupRef.current)
    }
  }, [])

  const focusBlock = useCallback((blockId: CampusBlockId | null) => {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return

    if (!blockId) {
      applyDefaultCampusView(camera, controls, campusCenterRef.current, campusDistanceRef.current)
      return
    }

    const block = blocksRef.current.find((entry) => entry.id === blockId)
    if (!block) return

    const box = new THREE.Box3().setFromObject(block.group)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const radius = Math.max(size.x, size.y, size.z) * 1.4

    controls.target.copy(center)
    camera.position.set(center.x + radius, center.y + radius * 0.65, center.z + radius)
    controls.update()
  }, [])

  const handleResetView = () => {
    setSelectedBlock(null)
    setSelectedPerson(null)
    setSelectedTicket(null)
    focusBlock(null)
  }

  useEffect(() => {
    peopleRef.current = people ?? []
    ticketMarkersRef.current = ticketMarkers ?? []
    syncMapMarkers()
  }, [people, ticketMarkers, syncMapMarkers])

  useEffect(() => {
    selectedBlockRef.current = activeBlockId ?? null
  }, [activeBlockId])

  useEffect(() => {
    selectedPersonRef.current = selectedPersonId ?? null
  }, [selectedPersonId])

  useEffect(() => {
    selectedTicketRef.current = selectedTicketId ?? null
  }, [selectedTicketId])

  useLayoutEffect(() => {
    const container = containerRef.current
    const host = canvasHostRef.current
    if (!container || !host) return

    let disposed = false
    let visible = true

    const setSelectedBlockRef = (blockId: CampusBlockId | null) => setSelectedBlock(blockId)
    const setSelectedPersonRef = (personId: string | null) => setSelectedPerson(personId)
    const setSelectedTicketRef = (ticketId: string | null) => setSelectedTicket(ticketId)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xe8edf5)
    sceneRef.current = scene
    sceneRefForMarkers.current = scene

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 5000)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.sortObjects = true
    renderer.domElement.className = 'block h-full w-full touch-none'
    host.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.maxPolarAngle = Math.PI / 2.05
    controlsRef.current = controls

    scene.add(new THREE.AmbientLight(0xffffff, 0.85))
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2)
    keyLight.position.set(40, 80, 30)
    scene.add(keyLight)
    const fillLight = new THREE.DirectionalLight(0xdce8ff, 0.55)
    fillLight.position.set(-30, 30, -20)
    scene.add(fillLight)
    scene.add(new THREE.HemisphereLight(0xf0f4ff, 0x6b7280, 0.35))

    const campusRoot = new THREE.Group()
    scene.add(campusRoot)
    blocksRef.current = []

    const loader = new GLTFLoader()
    let meshTargets: MeshOpacityTarget[] = []
    const MODEL_LOAD_TIMEOUT_MS = 12_000

    const loadModel = (url: string) =>
      Promise.race([
        loader.loadAsync(url),
        new Promise<never>((_, reject) => {
          window.setTimeout(
            () => reject(new Error(i18n.t('mapComponents.viewer3d.modelTimeout', { url }))),
            MODEL_LOAD_TIMEOUT_MS,
          )
        }),
      ])

    const resize = () => {
      if (disposed) return
      const width = container.clientWidth
      const height = container.clientHeight
      if (width < 2 || height < 2) return
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }

    const resizeObserver = new ResizeObserver(() => {
      resize()
    })
    resizeObserver.observe(container)
    requestAnimationFrame(resize)

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? true
      },
      { threshold: 0.05 },
    )
    visibilityObserver.observe(container)

    const animate = () => {
      if (disposed) return
      animationRef.current = requestAnimationFrame(animate)
      if (!visible || document.hidden) return
      controls.update()
      if (meshTargets.length > 0) {
        updateProximityOpacity(
          camera,
          controls.target,
          meshTargets,
          selectedBlockRef.current,
          campusRadiusRef.current,
        )
      }
      renderer.render(scene, camera)
    }
    animate()

    const pointerStart = { x: 0, y: 0 }
    let pointerMoved = false
    const DRAG_THRESHOLD_PX = 6

    const onPointerDown = (event: PointerEvent) => {
      pointerStart.x = event.clientX
      pointerStart.y = event.clientY
      pointerMoved = false
    }

    const onPointerMove = (event: PointerEvent) => {
      const dx = event.clientX - pointerStart.x
      const dy = event.clientY - pointerStart.y
      if (Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
        pointerMoved = true
      }
    }

    const pickMarkerAt = (clientX: number, clientY: number): string | null => {
      if (!markersGroupRef.current) return null
      const rect = renderer.domElement.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return null
      pointerRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1
      pointerRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1

      raycasterRef.current.setFromCamera(pointerRef.current, camera)
      const intersects = raycasterRef.current.intersectObjects([markersGroupRef.current], true)
      return intersects.length > 0 ? findMarkerId(intersects[0].object) : null
    }

    const pickBlockAt = (clientX: number, clientY: number): CampusBlockId | null => {
      const rect = renderer.domElement.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return null
      pointerRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1
      pointerRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1

      raycasterRef.current.setFromCamera(pointerRef.current, camera)
      const intersects = raycasterRef.current.intersectObjects(
        blocksRef.current.map((block) => block.group),
        true,
      )
      return intersects.length > 0 ? findBlockId(intersects[0].object) : null
    }

    const onPointerUp = (event: PointerEvent) => {
      if (pointerMoved || event.button !== 0) return

      const markerId = pickMarkerAt(event.clientX, event.clientY)
      if (markerId) {
        const person = peopleRef.current.find((entry) => entry.id === markerId)
        const ticket = ticketMarkersRef.current.find((entry) => entry.id === markerId)

        if (person) {
          setSelectedPersonRef(markerId)
          setSelectedTicketRef(null)
          setSelectedBlockRef(person.blockId)
          focusBlock(person.blockId)
          return
        }

        if (ticket) {
          setSelectedTicketRef(markerId)
          setSelectedPersonRef(null)
          setSelectedBlockRef(ticket.blockId)
          focusBlock(ticket.blockId)
          return
        }
      }

      const blockId = pickBlockAt(event.clientX, event.clientY)

      if (blockId) {
        setSelectedPersonRef(null)
        setSelectedTicketRef(null)
        setSelectedBlockRef(blockId)
        focusBlock(blockId)
      } else {
        setSelectedPersonRef(null)
        setSelectedTicketRef(null)
        setSelectedBlockRef(null)
      }
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('pointerup', onPointerUp)

    void (async () => {
      const loaded: CampusBlockId[] = []
      const errors: string[] = []

      for (const block of CAMPUS_BLOCKS) {
        try {
          const gltf = await loadModel(block.modelFile)
          if (disposed) return

          const group = new THREE.Group()
          group.name = block.name
          group.userData.blockId = block.id
          group.add(gltf.scene)
          prepareMaterials(group)
          campusRoot.add(group)
          blocksRef.current.push({ id: block.id, group })
          loaded.push(block.id)
        } catch (error) {
          console.error(`[CampusMap] Falha ao carregar ${block.name}:`, error)
          errors.push(block.name)
        }
      }

      if (disposed) return

      if (loaded.length === 0) {
        setLoadError(i18n.t('mapComponents.viewer3d.loadModelsError'))
        setLoading(false)
        return
      }

      const box = new THREE.Box3().setFromObject(campusRoot)
      if (box.isEmpty()) {
        setLoadError(i18n.t('mapComponents.viewer3d.emptyModelsError'))
        setLoading(false)
        return
      }

      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)
      const radius = maxDim * 0.75

      campusCenterRef.current.copy(center)
      campusRadiusRef.current = Math.max(radius, 20)
      campusDistanceRef.current = Math.max(computeCampusFitDistance(maxDim, camera.fov), 20)
      markerRadiusRef.current = Math.max(radius * 0.022, 7)
      applyDefaultCampusView(camera, controls, center, campusDistanceRef.current)
      controls.minDistance = Math.max(radius * 0.08, 3)
      controls.maxDistance = Math.max(radius * 4, 80)

      meshTargets = collectMeshTargets(blocksRef.current)
      mapReadyRef.current = true

      syncMapMarkers()

      requestAnimationFrame(resize)

      if (errors.length > 0) {
        setLoadError(i18n.t('mapComponents.viewer3d.missingModels', { names: errors.join(', ') }))
      }

      setLoadedBlocks(loaded)
      setLoading(false)
    })()

    return () => {
      disposed = true
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      controls.dispose()
      renderer.dispose()
      if (host.contains(renderer.domElement)) {
        host.removeChild(renderer.domElement)
      }
      if (markersGroupRef.current) {
        scene.remove(markersGroupRef.current)
        disposePinMarkerGroup(markersGroupRef.current)
        markersGroupRef.current = null
      }
      scene.clear()
      blocksRef.current = []
      mapReadyRef.current = false
      sceneRef.current = null
      sceneRefForMarkers.current = null
      cameraRef.current = null
      controlsRef.current = null
    }
  }, [focusBlock, syncMapMarkers])

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-xl border border-hub-border/60 bg-[#e8edf5] ${className}`}
      style={{ height: minHeight, minHeight }}
    >
      <div ref={canvasHostRef} className="absolute inset-0 h-full w-full" />

      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#e8edf5] text-sm text-hub-text-muted">
          {t('mapComponents.viewer3d.loading')}
        </div>
      )}

      {!loading && loadedBlocks.length === 0 && !loadError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#e8edf5] px-6 text-center text-sm text-hub-text-muted">
          {t('mapComponents.viewer3d.noBlocksLoaded')}
        </div>
      )}

      {loadError && !loading && (
        <div className="absolute left-3 right-3 top-3 z-20 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {loadError}
        </div>
      )}

      {showToolbar && !loading && (
        <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetView}
            className="glass-panel-solid inline-flex items-center gap-1 rounded-lg border border-hub-border/60 px-2.5 py-1.5 text-xs font-medium text-hub-navy shadow-sm transition hover:border-hub-red/40"
            title={t('mapComponents.viewer3d.resetViewTitle')}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t('mapComponents.viewer3d.campus')}
          </button>
        </div>
      )}

      {!loading && loadedBlocks.length > 0 && (
        <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-[220px] rounded-lg bg-white/80 px-2 py-1 text-[11px] text-hub-text-muted shadow-sm">
          {people || ticketMarkers
            ? t('mapComponents.viewer3d.hintMarkers')
            : t('mapComponents.viewer3d.hintBlocks')}
        </div>
      )}

      {showPanel && !loading && people && <CampusMapPeopleLegend compact={compact} />}
      {showPanel && !loading && ticketMarkers && ticketMarkers.length > 0 && (
        <CampusMapTicketsLegend compact={compact} />
      )}

      {showPanel && !loading && people ? (
        <CampusMapPeoplePanel
          people={people}
          selectedBlockId={activeBlockId ?? null}
          selectedPersonId={selectedPersonId}
          compact={compact}
        />
      ) : showPanel && !loading && ticketMarkers && ticketMarkers.length > 0 ? (
        <CampusMapTicketsPanel
          tickets={ticketMarkers}
          selectedBlockId={activeBlockId ?? null}
          selectedTicketId={selectedTicketId}
          compact={compact}
        />
      ) : showPanel && !loading && blockStats ? (
        <CampusMapBlockPanel stats={blockStats} selectedBlockId={activeBlockId ?? null} compact={compact} />
      ) : null}
    </div>
  )
}
