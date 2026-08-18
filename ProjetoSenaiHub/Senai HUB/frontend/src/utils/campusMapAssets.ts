import { CAMPUS_BLOCKS } from '../constants/campusBlocks'

let modelsAvailablePromise: Promise<boolean> | null = null
let modelBuffersCache: Map<string, ArrayBuffer> | null = null
let modelBuffersPromise: Promise<Map<string, ArrayBuffer>> | null = null
let map3DAssetsPromise: Promise<boolean> | null = null

const MIN_MODEL_BYTES = 50_000

function isGltfResponse(response: Response): boolean {
  if (!response.ok) return false

  const contentType = (response.headers.get('content-type') ?? '').toLowerCase()
  if (
    contentType.includes('model/gltf-binary') ||
    contentType.includes('model/gltf+json') ||
    contentType.includes('application/octet-stream')
  ) {
    const contentLength = Number(response.headers.get('content-length') ?? 0)
    return contentLength === 0 || contentLength >= MIN_MODEL_BYTES
  }

  return false
}

export async function campusModelsAvailable(): Promise<boolean> {
  if (modelsAvailablePromise) {
    return modelsAvailablePromise
  }

  modelsAvailablePromise = (async () => {
    const probe = CAMPUS_BLOCKS[0]?.modelFile
    if (!probe) return false

    try {
      const response = await fetch(probe, { method: 'HEAD' })
      if (isGltfResponse(response)) {
        return true
      }

      const ranged = await fetch(probe, { headers: { Range: 'bytes=0-3' } })
      if (!ranged.ok) return false
      const prefix = new Uint8Array(await ranged.arrayBuffer())
      return prefix[0] === 0x67 && prefix[1] === 0x6c && prefix[2] === 0x54 && prefix[3] === 0x46
    } catch {
      return false
    }
  })()

  return modelsAvailablePromise
}

export function preloadCampusMap3DViewer(): Promise<unknown> {
  return import('../components/map/CampusMap3DViewer')
}

export function prefetchCampusModelBuffers(): Promise<Map<string, ArrayBuffer>> {
  if (modelBuffersCache) {
    return Promise.resolve(modelBuffersCache)
  }

  if (modelBuffersPromise) {
    return modelBuffersPromise
  }

  modelBuffersPromise = (async () => {
    const available = await campusModelsAvailable()
    if (!available) {
      return new Map<string, ArrayBuffer>()
    }

    const entries = await Promise.all(
      CAMPUS_BLOCKS.map(async (block) => {
        const response = await fetch(block.modelFile)
        if (!response.ok) {
          throw new Error(`Failed to fetch ${block.modelFile}`)
        }
        const buffer = await response.arrayBuffer()
        return [block.modelFile, buffer] as const
      }),
    )

    modelBuffersCache = new Map(entries)
    return modelBuffersCache
  })().catch((error) => {
    modelBuffersPromise = null
    throw error
  })

  return modelBuffersPromise
}

export function getCampusModelBuffers(): Map<string, ArrayBuffer> | null {
  return modelBuffersCache
}

/** Downloads GLB files and the Three.js chunk without mounting the 3D viewer. */
export function prefetchCampusMap3DAssets(): Promise<boolean> {
  if (map3DAssetsPromise) {
    return map3DAssetsPromise
  }

  map3DAssetsPromise = (async () => {
    const available = await campusModelsAvailable()
    if (!available) return false

    const { loadCachedCampusBlocks } = await import('./campusMap3DCache')
    await Promise.all([prefetchCampusModelBuffers(), preloadCampusMap3DViewer(), loadCachedCampusBlocks()])
    return true
  })().catch(() => {
    map3DAssetsPromise = null
    return false
  })

  return map3DAssetsPromise
}

export function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 0)
  })
}
