export type CampusBlockId = 'A' | 'B' | 'C' | 'D'

export interface CampusBlockDefinition {
  id: CampusBlockId
  name: string
  modelFile: string
}

const baseUrl = import.meta.env.BASE_URL

export const CAMPUS_BLOCKS: CampusBlockDefinition[] = [
  { id: 'A', name: 'Bloco A', modelFile: `${baseUrl}models/campus/BlocoA.glb` },
  { id: 'B', name: 'Bloco B', modelFile: `${baseUrl}models/campus/BlocoB.glb` },
  { id: 'C', name: 'Bloco C', modelFile: `${baseUrl}models/campus/BlocoC.glb` },
  { id: 'D', name: 'Bloco D', modelFile: `${baseUrl}models/campus/BlocoD.glb` },
]

export const CAMPUS_BLOCK_BY_ID = Object.fromEntries(
  CAMPUS_BLOCKS.map((block) => [block.id, block]),
) as Record<CampusBlockId, CampusBlockDefinition>
