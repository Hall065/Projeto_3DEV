import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { CAMPUS_BLOCKS, type CampusBlockId } from '../constants/campusBlocks'
import {
  campusModelsAvailable,
  getCampusModelBuffers,
  prefetchCampusModelBuffers,
  yieldToMain,
} from './campusMapAssets'

export interface CachedCampusBlock {
  id: CampusBlockId
  template: THREE.Group
}

let cachedBlocks: CachedCampusBlock[] | null = null
let cachePromise: Promise<CachedCampusBlock[]> | null = null

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

/** Deep-clone a cached block so each viewer owns independent materials. */
export function cloneCampusBlock(template: THREE.Group): THREE.Group {
  const group = template.clone(true)
  prepareMaterials(group)
  return group
}

/**
 * Parses campus GLB files once per session. Subsequent map mounts only clone scenes.
 * Parsing is the main source of UI freezes (~3.6 MB on the main thread).
 */
export async function loadCachedCampusBlocks(): Promise<CachedCampusBlock[]> {
  if (cachedBlocks) {
    return cachedBlocks
  }

  if (cachePromise) {
    return cachePromise
  }

  cachePromise = (async () => {
    const available = await campusModelsAvailable()
    if (!available) {
      return []
    }

    await prefetchCampusModelBuffers()
    const buffers = getCampusModelBuffers()
    const loader = new GLTFLoader()
    const blocks: CachedCampusBlock[] = []

    for (const block of CAMPUS_BLOCKS) {
      await yieldToMain()

      const buffer = buffers?.get(block.modelFile)
      const gltf = buffer
        ? await loader.parseAsync(buffer, block.modelFile)
        : await loader.loadAsync(block.modelFile)

      const group = new THREE.Group()
      group.name = block.name
      group.userData.blockId = block.id
      group.add(gltf.scene)
      prepareMaterials(group)
      blocks.push({ id: block.id, template: group })
    }

    cachedBlocks = blocks
    return blocks
  })().catch((error) => {
    cachePromise = null
    throw error
  })

  return cachePromise
}
