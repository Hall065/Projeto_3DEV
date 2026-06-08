import * as THREE from 'three'
import type { CampusBlockId } from '../../constants/campusBlocks'

export interface PinMarkerBlock {
  id: CampusBlockId
  group: THREE.Group
}

export function anchorOnBlock(box: THREE.Box3, seed: number): THREE.Vector3 {
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const angle = ((seed % 360) * Math.PI) / 180
  const radiusFactor = 0.14 + ((seed % 11) / 11) * 0.34

  return new THREE.Vector3(
    center.x + Math.cos(angle) * size.x * radiusFactor * 0.4,
    box.max.y,
    center.z + Math.sin(angle) * size.z * radiusFactor * 0.4,
  )
}

export function createCampusPinMarker(config: {
  markerId: string
  blockId: CampusBlockId
  anchor: THREE.Vector3
  markerScale: number
  color: string
}): THREE.Group {
  const { markerId, blockId, anchor, markerScale, color: colorHex } = config
  const group = new THREE.Group()
  group.userData.markerId = markerId
  group.userData.blockId = blockId
  group.position.copy(anchor)

  const color = new THREE.Color(colorHex)
  const headRadius = markerScale * 0.5
  const stemHeight = markerScale * 1.65
  const markerRenderOrder = 20

  const disc = new THREE.Mesh(
    new THREE.RingGeometry(headRadius * 0.55, headRadius * 1.15, 32),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  )
  disc.rotation.x = -Math.PI / 2
  disc.position.y = markerScale * 0.08
  disc.renderOrder = markerRenderOrder

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(headRadius * 0.12, headRadius * 0.2, stemHeight, 10),
    new THREE.MeshStandardMaterial({
      color: color.clone().multiplyScalar(0.85),
      metalness: 0.15,
      roughness: 0.55,
    }),
  )
  stem.position.y = stemHeight / 2 + markerScale * 0.08
  stem.renderOrder = markerRenderOrder + 1

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(headRadius, 24, 24),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: color,
      emissiveIntensity: 0.55,
      metalness: 0.05,
      roughness: 0.2,
    }),
  )
  head.position.y = stemHeight + headRadius + markerScale * 0.12
  head.renderOrder = markerRenderOrder + 2

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(headRadius * 1.28, 16, 16),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    }),
  )
  glow.position.copy(head.position)
  glow.renderOrder = markerRenderOrder + 1

  group.add(disc, stem, head, glow)
  return group
}

export function disposePinMarkerGroup(group: THREE.Group) {
  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    child.geometry.dispose()
    const materials = Array.isArray(child.material) ? child.material : [child.material]
    for (const material of materials) material.dispose()
  })
}

export function buildBlockPinMarkers<T extends { id: string; blockId: CampusBlockId }>(
  items: T[],
  blocks: PinMarkerBlock[],
  markerScale: number,
  getColor: (item: T) => string,
): THREE.Group {
  const root = new THREE.Group()
  root.name = 'map-pin-markers'

  for (const block of blocks) {
    const blockItems = items.filter((item) => item.blockId === block.id)
    if (blockItems.length === 0) continue

    const box = new THREE.Box3().setFromObject(block.group)
    const placedAnchors: THREE.Vector3[] = []
    const minSeparation = markerScale * 3.2

    for (const item of blockItems) {
      const baseSeed = item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      let anchor = anchorOnBlock(box, baseSeed)

      for (let attempt = 0; attempt < 10; attempt += 1) {
        const crowded = placedAnchors.some((existing) => existing.distanceTo(anchor) < minSeparation)
        if (!crowded) break
        anchor = anchorOnBlock(box, baseSeed + attempt * 53)
      }

      placedAnchors.push(anchor.clone())
      root.add(
        createCampusPinMarker({
          markerId: item.id,
          blockId: item.blockId,
          anchor,
          markerScale,
          color: getColor(item),
        }),
      )
    }
  }

  return root
}
