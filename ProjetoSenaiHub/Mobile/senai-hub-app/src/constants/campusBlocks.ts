import blocoA from '../../assets/models/campus/BlocoA.glb';
import blocoB from '../../assets/models/campus/BlocoB.glb';
import blocoC from '../../assets/models/campus/BlocoC.glb';
import blocoD from '../../assets/models/campus/BlocoD.glb';

export type CampusBlockId = 'A' | 'B' | 'C' | 'D';

export interface CampusBlockDefinition {
  id: CampusBlockId;
  name: string;
  modelAsset: number;
}

export const CAMPUS_BLOCKS: CampusBlockDefinition[] = [
  { id: 'A', name: 'Bloco A', modelAsset: blocoA },
  { id: 'B', name: 'Bloco B', modelAsset: blocoB },
  { id: 'C', name: 'Bloco C', modelAsset: blocoC },
  { id: 'D', name: 'Bloco D', modelAsset: blocoD },
];

export const CAMPUS_BLOCK_BY_ID = Object.fromEntries(
  CAMPUS_BLOCKS.map((block) => [block.id, block])
) as Record<CampusBlockId, CampusBlockDefinition>;
