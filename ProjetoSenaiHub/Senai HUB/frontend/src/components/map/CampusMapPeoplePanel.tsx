import { GraduationCap, User, Users } from 'lucide-react'
import type { CampusBlockId } from '../../constants/campusBlocks'
import { CAMPUS_BLOCK_BY_ID } from '../../constants/campusBlocks'
import type { CampusPersonLocation, CampusPersonRole } from '../../types/campusPeople'
import {
  CAMPUS_PERSON_ROLE_COLORS,
  CAMPUS_PERSON_ROLE_LABELS,
} from '../../types/campusPeople'
import { countPeopleByRole, groupPeopleByBlock } from '../../utils/campusPeopleSimulation'

interface CampusMapPeoplePanelProps {
  people: CampusPersonLocation[]
  selectedBlockId: CampusBlockId | null
  selectedPersonId?: string | null
  compact?: boolean
}

const roleIcons: Record<CampusPersonRole, typeof User> = {
  aluno: GraduationCap,
  professor: User,
  funcionario: Users,
}

function RoleBadge({ role }: { role: CampusPersonRole }) {
  const Icon = roleIcons[role]
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
      style={{ backgroundColor: CAMPUS_PERSON_ROLE_COLORS[role] }}
    >
      <Icon className="h-3 w-3" />
      {CAMPUS_PERSON_ROLE_LABELS[role]}
    </span>
  )
}

export function CampusMapPeoplePanel({
  people,
  selectedBlockId,
  selectedPersonId = null,
  compact = false,
}: CampusMapPeoplePanelProps) {
  const byBlock = groupPeopleByBlock(people)
  const totals = countPeopleByRole(people)
  const blockPeople = selectedBlockId ? byBlock[selectedBlockId] : []
  const blockName = selectedBlockId ? CAMPUS_BLOCK_BY_ID[selectedBlockId].name : null
  const selectedPerson = selectedPersonId ? people.find((p) => p.id === selectedPersonId) : null

  return (
    <div
      className={`pointer-events-none absolute z-10 ${compact ? 'bottom-2 left-2 right-2' : 'bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm'}`}
    >
      {selectedPerson ? (
        <div className="glass-panel-solid pointer-events-auto rounded-xl border border-hub-border/60 p-3 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-hub-red">Pessoa selecionada</p>
          <p className="mt-1 font-semibold text-hub-navy">{selectedPerson.name}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <RoleBadge role={selectedPerson.role} />
            <span className="text-xs text-hub-text-muted">{CAMPUS_BLOCK_BY_ID[selectedPerson.blockId].name}</span>
          </div>
          {selectedPerson.room && (
            <p className="mt-2 text-xs text-hub-text-muted">Sala: {selectedPerson.room}</p>
          )}
          {selectedPerson.detail && (
            <p className="text-xs text-hub-text-muted">{selectedPerson.detail}</p>
          )}
        </div>
      ) : selectedBlockId && blockPeople.length > 0 ? (
        <div className="glass-panel-solid pointer-events-auto rounded-xl border border-hub-border/60 p-3 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-hub-red">{blockName}</p>
          <p className="mb-2 text-[11px] text-hub-text-muted">{blockPeople.length} pessoa(s) no bloco</p>
          <ul className={`scrollbar-glass-inset space-y-2 overflow-y-auto pr-1 ${compact ? 'max-h-28' : 'max-h-40'}`}>
            {blockPeople.map((person) => (
              <li key={person.id} className="flex items-start justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <p className="truncate font-medium text-hub-navy">{person.name}</p>
                  <p className="truncate text-hub-text-muted">
                    {person.room ? `Sala ${person.room}` : person.detail ?? 'No campus'}
                  </p>
                </div>
                <RoleBadge role={person.role} />
              </li>
            ))}
          </ul>
        </div>
      ) : selectedBlockId ? (
        <div className="glass-panel-solid pointer-events-auto rounded-xl border border-hub-border/60 px-3 py-2 text-xs text-hub-text-muted shadow-lg">
          Nenhuma pessoa simulada em {blockName} no momento.
        </div>
      ) : (
        <div className="glass-panel-solid pointer-events-auto rounded-xl border border-hub-border/60 p-3 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-hub-red">Localizacao simulada</p>
          <p className="mt-1 text-[11px] text-hub-text-muted">Clique em um marcador ou bloco para detalhes</p>
          <dl className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div>
              <dt className="text-[10px] text-hub-text-muted">Alunos</dt>
              <dd className="text-base font-bold text-blue-600">{totals.aluno}</dd>
            </div>
            <div>
              <dt className="text-[10px] text-hub-text-muted">Professores</dt>
              <dd className="text-base font-bold text-violet-600">{totals.professor}</dd>
            </div>
            <div>
              <dt className="text-[10px] text-hub-text-muted">Funcionarios</dt>
              <dd className="text-base font-bold text-amber-600">{totals.funcionario}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  )
}

export function CampusMapPeopleLegend({ compact = false }: { compact?: boolean }) {
  const roles: CampusPersonRole[] = ['aluno', 'professor', 'funcionario']
  return (
    <div
      className={`pointer-events-none absolute z-10 flex flex-wrap gap-2 ${compact ? 'right-2 top-2' : 'right-3 top-12'}`}
    >
      {roles.map((role) => (
        <span
          key={role}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-medium text-hub-navy shadow-sm"
        >
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CAMPUS_PERSON_ROLE_COLORS[role] }} />
          {CAMPUS_PERSON_ROLE_LABELS[role]}
        </span>
      ))}
    </div>
  )
}
