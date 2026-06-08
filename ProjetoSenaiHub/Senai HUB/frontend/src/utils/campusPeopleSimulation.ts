import type { CampusBlockId } from '../constants/campusBlocks'
import { CAMPUS_BLOCKS } from '../constants/campusBlocks'
import type { CampusPersonLocation, CampusPersonRole } from '../types/campusPeople'
import type { ConnectStudentLocation, ConnectTeacher } from '../types/connect'

const BLOCK_IDS = CAMPUS_BLOCKS.map((block) => block.id)

const MOCK_STAFF: Omit<CampusPersonLocation, 'id'>[] = [
  { name: 'Carla Mendes', role: 'funcionario', blockId: 'B', room: 'Recepcao', detail: 'Secretaria' },
  { name: 'Roberto Lima', role: 'funcionario', blockId: 'A', room: 'Patrimonio', detail: 'Manutencao' },
  { name: 'Fernanda Souza', role: 'funcionario', blockId: 'C', room: 'Lab. Informatica', detail: 'TI' },
  { name: 'Paulo Henrique', role: 'funcionario', blockId: 'D', room: 'Coordenacao', detail: 'Administrativo' },
  { name: 'Juliana Costa', role: 'funcionario', blockId: 'B', room: 'Biblioteca', detail: 'Apoio academico' },
]

const MOCK_ROOMS = ['101', '102', '201', '203', 'Lab. 1', 'Lab. 2', 'Oficina', 'Sala 15']

function hashSeed(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function assignBlockFromSeed(seed: string): CampusBlockId {
  return BLOCK_IDS[hashSeed(seed) % BLOCK_IDS.length]
}

function pickRoom(seed: string): string {
  return MOCK_ROOMS[hashSeed(seed) % MOCK_ROOMS.length]
}

function mapStudent(loc: ConnectStudentLocation): CampusPersonLocation | null {
  if (loc.status !== 'inside') return null
  const name = loc.student?.full_name?.trim()
  if (!name) return null
  const seed = `student-${loc.connect_student_id ?? loc.id}`
  return {
    id: seed,
    name,
    role: 'aluno',
    blockId: assignBlockFromSeed(seed),
    room: pickRoom(seed),
    detail: loc.student?.class?.name ?? 'Turma em aula',
  }
}

function mapTeacher(teacher: ConnectTeacher): CampusPersonLocation {
  const seed = `teacher-${teacher.id}`
  return {
    id: seed,
    name: teacher.full_name,
    role: 'professor',
    blockId: assignBlockFromSeed(seed),
    room: pickRoom(seed),
    detail: teacher.specialty ?? 'Docente',
  }
}

export function buildCampusPeopleSimulation(
  locations: ConnectStudentLocation[],
  teachers: ConnectTeacher[],
): CampusPersonLocation[] {
  const people: CampusPersonLocation[] = []
  const seen = new Set<string>()

  for (const loc of locations) {
    const person = mapStudent(loc)
    if (!person || seen.has(person.id)) continue
    seen.add(person.id)
    people.push(person)
  }

  for (const teacher of teachers) {
    if (teacher.status && teacher.status !== 'active') continue
    const person = mapTeacher(teacher)
    if (seen.has(person.id)) continue
    seen.add(person.id)
    people.push(person)
  }

  for (const [index, staff] of MOCK_STAFF.entries()) {
    people.push({
      ...staff,
      id: `staff-${index}-${staff.name}`,
    })
  }

  if (people.filter((p) => p.role === 'aluno').length === 0) {
    const fallbackStudents: CampusPersonLocation[] = [
      { id: 'demo-aluno-1', name: 'Joao Silva', role: 'aluno', blockId: 'A', room: '101', detail: 'Turma DEV-2024' },
      { id: 'demo-aluno-2', name: 'Maria Oliveira', role: 'aluno', blockId: 'C', room: 'Lab. 2', detail: 'Turma REDES-2024' },
      { id: 'demo-aluno-3', name: 'Pedro Santos', role: 'aluno', blockId: 'B', room: '203', detail: 'Turma AUTO-2024' },
    ]
    people.push(...fallbackStudents)
  }

  return people
}

export function groupPeopleByBlock(
  people: CampusPersonLocation[],
): Record<CampusBlockId, CampusPersonLocation[]> {
  return BLOCK_IDS.reduce(
    (acc, blockId) => {
      acc[blockId] = people.filter((person) => person.blockId === blockId)
      return acc
    },
    {} as Record<CampusBlockId, CampusPersonLocation[]>,
  )
}

export function countPeopleByRole(people: CampusPersonLocation[]): Record<CampusPersonRole, number> {
  return people.reduce(
    (acc, person) => {
      acc[person.role] += 1
      return acc
    },
    { aluno: 0, professor: 0, funcionario: 0 },
  )
}
