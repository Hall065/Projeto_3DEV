import type { CampusBlockId } from '../constants/campusBlocks'

export type CampusPersonRole = 'aluno' | 'professor' | 'funcionario'

export interface CampusPersonLocation {
  id: string
  name: string
  role: CampusPersonRole
  blockId: CampusBlockId
  room?: string
  detail?: string
}

export const CAMPUS_PERSON_ROLE_LABELS: Record<CampusPersonRole, string> = {
  aluno: 'Aluno',
  professor: 'Professor',
  funcionario: 'Funcionario',
}

export const CAMPUS_PERSON_ROLE_COLORS: Record<CampusPersonRole, string> = {
  aluno: '#2563eb',
  professor: '#7c3aed',
  funcionario: '#d97706',
}
