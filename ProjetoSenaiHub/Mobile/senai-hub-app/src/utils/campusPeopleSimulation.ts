import { CAMPUS_BLOCKS, type CampusBlockId } from '@/constants/campusBlocks';
import type { CampusPersonLocation, CampusPersonRole } from '@/types/campusPeople';
import type { LocalizacaoAluno, Professor } from '@/types/connect.types';

const BLOCK_IDS = CAMPUS_BLOCKS.map((block) => block.id);

const MOCK_STAFF: Omit<CampusPersonLocation, 'id'>[] = [
  { name: 'Carla Mendes', role: 'funcionario', blockId: 'B', room: 'Recepcao', detail: 'Secretaria' },
  { name: 'Roberto Lima', role: 'funcionario', blockId: 'A', room: 'Patrimonio', detail: 'Manutencao' },
  { name: 'Fernanda Souza', role: 'funcionario', blockId: 'C', room: 'Lab. Informatica', detail: 'TI' },
  { name: 'Paulo Henrique', role: 'funcionario', blockId: 'D', room: 'Coordenacao', detail: 'Administrativo' },
  { name: 'Juliana Costa', role: 'funcionario', blockId: 'B', room: 'Biblioteca', detail: 'Apoio academico' },
];

const MOCK_ROOMS = ['101', '102', '201', '203', 'Lab. 1', 'Lab. 2', 'Oficina', 'Sala 15'];

function hashSeed(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function assignBlockFromSeed(seed: string): CampusBlockId {
  return BLOCK_IDS[hashSeed(seed) % BLOCK_IDS.length];
}

function pickRoom(seed: string): string {
  return MOCK_ROOMS[hashSeed(seed) % MOCK_ROOMS.length];
}

function mapStudent(location: LocalizacaoAluno): CampusPersonLocation | null {
  const inside = Boolean(location.dentro_do_senai ?? location.dentro_perimetro);
  if (!inside) return null;

  const name = location.aluno_nome?.trim();
  if (!name) return null;

  const seed = `student-${location.aluno_id}`;
  return {
    id: seed,
    name,
    role: 'aluno',
    blockId: assignBlockFromSeed(seed),
    room: pickRoom(seed),
    detail: location.turma_nome ?? location.curso_nome ?? 'Turma em aula',
  };
}

function mapTeacher(teacher: Professor): CampusPersonLocation | null {
  if (teacher.status && teacher.status !== 'ativo') return null;

  const seed = `teacher-${teacher.id}`;
  return {
    id: seed,
    name: teacher.nome,
    role: 'professor',
    blockId: assignBlockFromSeed(seed),
    room: pickRoom(seed),
    detail: teacher.especialidade ?? 'Docente',
  };
}

export function buildCampusPeopleSimulation(
  locations: LocalizacaoAluno[],
  teachers: Professor[]
): CampusPersonLocation[] {
  const people: CampusPersonLocation[] = [];
  const seen = new Set<string>();

  for (const location of locations) {
    const person = mapStudent(location);
    if (!person || seen.has(person.id)) continue;
    seen.add(person.id);
    people.push(person);
  }

  for (const teacher of teachers) {
    const person = mapTeacher(teacher);
    if (!person || seen.has(person.id)) continue;
    seen.add(person.id);
    people.push(person);
  }

  for (const [index, staff] of MOCK_STAFF.entries()) {
    people.push({
      ...staff,
      id: `staff-${index}-${staff.name}`,
    });
  }

  if (people.filter((person) => person.role === 'aluno').length === 0) {
    people.push(
      { id: 'demo-aluno-1', name: 'Joao Silva', role: 'aluno', blockId: 'A', room: '101', detail: 'Turma DEV-2024' },
      { id: 'demo-aluno-2', name: 'Maria Oliveira', role: 'aluno', blockId: 'C', room: 'Lab. 2', detail: 'Turma REDES-2024' },
      { id: 'demo-aluno-3', name: 'Pedro Santos', role: 'aluno', blockId: 'B', room: '203', detail: 'Turma AUTO-2024' }
    );
  }

  return people;
}

export function groupPeopleByBlock(
  people: CampusPersonLocation[]
): Record<CampusBlockId, CampusPersonLocation[]> {
  return BLOCK_IDS.reduce(
    (acc, blockId) => {
      acc[blockId] = people.filter((person) => person.blockId === blockId);
      return acc;
    },
    {} as Record<CampusBlockId, CampusPersonLocation[]>
  );
}

export function countPeopleByRole(people: CampusPersonLocation[]): Record<CampusPersonRole, number> {
  return people.reduce(
    (acc, person) => {
      acc[person.role] += 1;
      return acc;
    },
    { aluno: 0, professor: 0, funcionario: 0 }
  );
}
