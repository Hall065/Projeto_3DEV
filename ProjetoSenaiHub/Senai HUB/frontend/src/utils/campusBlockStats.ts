import { CAMPUS_BLOCKS, type CampusBlockId } from '../constants/campusBlocks'
import type { GridTaskCard, GridTicket } from '../types/grid'

export interface CampusBlockStats {
  id: CampusBlockId
  name: string
  total: number
  open: number
  completed: number
}

const COMPLETED_TICKET_STATUSES = new Set(['concluido'])

export function normalizeCampusBlockId(block?: string | null): CampusBlockId | null {
  if (!block?.trim()) return null
  const upper = block.trim().toUpperCase()
  if (upper === 'A' || upper === 'B' || upper === 'C' || upper === 'D') return upper
  const match = upper.match(/BLOCO\s*([ABCD])/) ?? upper.match(/\b([ABCD])\b/)
  return match ? (match[1] as CampusBlockId) : null
}

function emptyStats(): Record<CampusBlockId, CampusBlockStats> {
  return Object.fromEntries(
    CAMPUS_BLOCKS.map((block) => [
      block.id,
      { id: block.id, name: block.name, total: 0, open: 0, completed: 0 },
    ]),
  ) as Record<CampusBlockId, CampusBlockStats>
}

export function buildBlockStatsFromGrid(
  tasks: GridTaskCard[],
  tickets: GridTicket[],
): Record<CampusBlockId, CampusBlockStats> {
  const stats = emptyStats()

  for (const ticket of tickets) {
    const id = normalizeCampusBlockId(ticket.block)
    if (!id) continue
    stats[id].total += 1
    if (COMPLETED_TICKET_STATUSES.has(ticket.status)) stats[id].completed += 1
    else stats[id].open += 1
  }

  for (const task of tasks) {
    const id = normalizeCampusBlockId(task.block)
    if (!id) continue
    stats[id].total += 1
    if (task.column === 'concluidas') stats[id].completed += 1
    else stats[id].open += 1
  }

  return stats
}

export function buildMockBlockStats(): Record<CampusBlockId, CampusBlockStats> {
  return {
    A: { id: 'A', name: 'Bloco A', total: 4, open: 2, completed: 2 },
    B: { id: 'B', name: 'Bloco B', total: 7, open: 3, completed: 4 },
    C: { id: 'C', name: 'Bloco C', total: 5, open: 1, completed: 4 },
    D: { id: 'D', name: 'Bloco D', total: 3, open: 2, completed: 1 },
  }
}
