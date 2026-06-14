import { CAMPUS_BLOCKS } from '../constants/campusBlocks'

let modelsAvailablePromise: Promise<boolean> | null = null

export async function campusModelsAvailable(): Promise<boolean> {
  if (modelsAvailablePromise) {
    return modelsAvailablePromise
  }

  modelsAvailablePromise = (async () => {
    const probe = CAMPUS_BLOCKS[0]?.modelFile
    if (!probe) return false

    try {
      const response = await fetch(probe, { method: 'HEAD' })
      return response.ok
    } catch {
      return false
    }
  })()

  return modelsAvailablePromise
}
