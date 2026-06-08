import { Filter, MapPin, Pencil, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ConnectDrawer } from '../../components/connect/ConnectDrawer'
import { ConnectEntityViewDrawer } from '../../components/connect/ConnectEntityViewDrawer'
import { ConnectRowActionsMenu } from '../../components/connect/ConnectRowActionsMenu'
import { viewRowAction } from '../../components/connect/connectViewActions'
import {
  ConnectCard,
  ConnectPageHeader,
  ConnectLoadingSpinner,
  ConnectPagination,
  ConnectTableScroll,
  EMPTY,
  FormField,
  formatDateTime,
  inputClass,
  OutlineButton,
  selectClass,
  StatusBadge,
} from '../../components/connect/ConnectShared'
import { UserAvatar } from '../../components/ui/UserAvatar'
import { CampusMapContainer } from '../../components/map/CampusMap3DViewer'
import { connectService } from '../../services/connectService'
import { buildCampusPeopleSimulation } from '../../utils/campusPeopleSimulation'
import type { CampusPersonLocation } from '../../types/campusPeople'
import type {
  ConnectClass,
  ConnectCourse,
  ConnectStudentLocation,
  ConnectTeacher,
  PaginatedMeta,
} from '../../types/connect'

type LocationTab = 'cursos' | 'alunos' | 'professores' | 'turmas'

const tabLabels: { key: LocationTab; label: string }[] = [
  { key: 'cursos', label: 'Cursos' },
  { key: 'alunos', label: 'Alunos' },
  { key: 'professores', label: 'Professores' },
  { key: 'turmas', label: 'Turmas' },
]

export function LocationPage() {
  const [activeTab, setActiveTab] = useState<LocationTab>('alunos')
  const [locations, setLocations] = useState<ConnectStudentLocation[]>([])
  const [courses, setCourses] = useState<ConnectCourse[]>([])
  const [teachers, setTeachers] = useState<ConnectTeacher[]>([])
  const [classes, setClasses] = useState<ConnectClass[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | undefined>()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selected, setSelected] = useState<ConnectStudentLocation | null>(null)
  const [viewSnapshot, setViewSnapshot] = useState<ConnectStudentLocation | null>(null)
  const [viewStudentId, setViewStudentId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [mapPeople, setMapPeople] = useState<CampusPersonLocation[]>([])
  const [mapPeopleLoading, setMapPeopleLoading] = useState(true)

  useEffect(() => {
    setMapPeopleLoading(true)
    Promise.all([
      connectService.getLocations({ page: 1, per_page: 100, status: 'inside' }),
      connectService.getTeachers({ page: 1, per_page: 100 }),
    ])
      .then(([locationsRes, teachersRes]) => {
        setMapPeople(
          buildCampusPeopleSimulation(
            locationsRes.data as ConnectStudentLocation[],
            teachersRes.data as ConnectTeacher[],
          ),
        )
      })
      .finally(() => setMapPeopleLoading(false))
  }, [])

  useEffect(() => {
    setLoading(true)
    setPage(1)
  }, [activeTab])

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string | number> = { page, per_page: 10 }

    const finish = (promise: Promise<{ data: unknown[]; meta: PaginatedMeta }>) =>
      promise
        .then((res) => {
          if (activeTab === 'alunos') setLocations(res.data as ConnectStudentLocation[])
          if (activeTab === 'cursos') setCourses(res.data as ConnectCourse[])
          if (activeTab === 'professores') setTeachers(res.data as ConnectTeacher[])
          if (activeTab === 'turmas') setClasses(res.data as ConnectClass[])
          setMeta(res.meta)
        })
        .finally(() => setLoading(false))

    if (activeTab === 'alunos') {
      if (statusFilter) params.status = statusFilter
      if (search.trim()) params.search = search.trim()
      finish(connectService.getLocations(params))
    } else if (activeTab === 'cursos') {
      finish(connectService.getCourses(params))
    } else if (activeTab === 'professores') {
      finish(connectService.getTeachers(params))
    } else {
      finish(connectService.getClasses(params))
    }
  }, [activeTab, page, search, statusFilter])

  const handleTabChange = (tab: LocationTab) => {
    setActiveTab(tab)
    setSearch('')
    setStatusFilter('')
    setShowFilters(false)
  }

  const campusPeople = mapPeople
  const highlightedPersonId = selected ? `student-${selected.connect_student_id}` : null

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Localizacao"
        subtitle="Visualize o campus em 3D e localize alunos, turmas e salas dentro do perimetro do SENAI."
      />

      <ConnectCard className="mb-4 overflow-hidden p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-hub-red" />
          <div>
            <h2 className="font-semibold text-hub-navy">Mapa do campus</h2>
            <p className="text-sm text-hub-text-muted">
              Localizacao simulada de alunos, professores e funcionarios nos blocos do campus.
            </p>
          </div>
        </div>
        {mapPeopleLoading ? (
          <ConnectLoadingSpinner label="Carregando localizacoes no mapa..." className="min-h-[400px]" />
        ) : (
          <CampusMapContainer
            people={campusPeople}
            highlightPersonId={highlightedPersonId}
            minHeight="400px"
          />
        )}
      </ConnectCard>

      <ConnectCard className="mb-4 p-4">
        <div className="mb-4 flex flex-wrap gap-3 border-b border-hub-border/60 pb-3 text-sm sm:gap-4">
          {tabLabels.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleTabChange(key)}
              className={activeTab === key ? 'border-b-2 border-hub-red font-semibold text-hub-red' : 'text-hub-text-muted'}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mb-4 flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-end [&_button]:w-full sm:[&_button]:w-auto">
          {activeTab === 'alunos' && (
            <input
              className={`${inputClass} min-w-0 flex-1`}
              placeholder="Buscar aluno..."
              value={search}
              onChange={(e) => {
                setPage(1)
                setSearch(e.target.value)
              }}
            />
          )}
          <OutlineButton onClick={() => setShowFilters((v) => !v)}>
            <Filter className="h-4 w-4" /> Filtros
          </OutlineButton>
        </div>
        {showFilters && activeTab === 'alunos' && (
          <div className="mb-4 border-t border-hub-border/60 pt-4">
            <FormField label="Status">
              <select
                className={selectClass}
                value={statusFilter}
                onChange={(e) => {
                  setPage(1)
                  setStatusFilter(e.target.value)
                }}
              >
                <option value="">Todos</option>
                <option value="inside">Dentro do perimetro</option>
                <option value="outside">Fora do perimetro</option>
                <option value="unknown">Desconhecido</option>
              </select>
            </FormField>
          </div>
        )}
        {loading ? (
          <ConnectLoadingSpinner label="Carregando localizacoes..." className="min-h-[280px]" />
        ) : (
        <>
        <ConnectTableScroll>
          {activeTab === 'alunos' && (
            <table className="w-full min-w-[560px] text-sm">
              <thead className="glass-thead text-hub-text-muted">
                <tr>
                  <th className="px-4 py-3 text-left">Nome</th>
                  <th className="px-4 py-3 text-left">E-mail institucional</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Em aula?</th>
                  <th className="px-4 py-3 text-left">Dentro do perimetro?</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {locations.map((loc) => (
                  <tr key={loc.id} className="border-t border-hub-border/40">
                    <td className="px-4 py-3">{loc.student?.full_name ?? '-'}</td>
                    <td className="px-4 py-3">{loc.student?.email ?? '-'}</td>
                    <td className="px-4 py-3"><StatusBadge status={loc.status} /></td>
                    <td className="px-4 py-3">{loc.status === 'inside' ? 'Sim' : 'Nao'}</td>
                    <td className="px-4 py-3">{loc.status === 'inside' ? 'Sim' : 'Nao'}</td>
                    <td className="px-4 py-3 text-right">
                      <ConnectRowActionsMenu
                        ariaLabel={`Ações de ${loc.student?.full_name ?? 'aluno'}`}
                        actions={[
                          viewRowAction(() => setViewSnapshot(loc)),
                          {
                            key: 'map',
                            label: 'Ver localização',
                            icon: MapPin,
                            disabled: loc.status !== 'inside',
                            onClick: () => setSelected(loc),
                          },
                          {
                            key: 'student',
                            label: 'Ver aluno',
                            icon: User,
                            onClick: () => {
                              if (loc.connect_student_id) setViewStudentId(loc.connect_student_id)
                            },
                          },
                          {
                            key: 'edit',
                            label: 'Editar cadastro',
                            icon: Pencil,
                            onClick: () => {
                              if (loc.connect_student_id) setViewStudentId(loc.connect_student_id)
                            },
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {activeTab === 'cursos' && (
            <table className="w-full min-w-[480px] text-sm">
              <thead className="glass-thead text-hub-text-muted">
                <tr>
                  <th className="px-4 py-3 text-left">Codigo</th>
                  <th className="px-4 py-3 text-left">Nome</th>
                  <th className="px-4 py-3 text-left">Area</th>
                  <th className="px-4 py-3 text-left">Turmas</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id} className="border-t border-hub-border/40">
                    <td className="px-4 py-3">{course.code}</td>
                    <td className="px-4 py-3 font-medium">{course.name}</td>
                    <td className="px-4 py-3">{course.area ?? '-'}</td>
                    <td className="px-4 py-3">{course.classes_count ?? 0}</td>
                    <td className="px-4 py-3"><StatusBadge status={course.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {activeTab === 'professores' && (
            <table className="w-full min-w-[480px] text-sm">
              <thead className="glass-thead text-hub-text-muted">
                <tr>
                  <th className="px-4 py-3 text-left">Nome</th>
                  <th className="px-4 py-3 text-left">E-mail</th>
                  <th className="px-4 py-3 text-left">Especialidade</th>
                  <th className="px-4 py-3 text-left">Turmas</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="border-t border-hub-border/40">
                    <td className="px-4 py-3 font-medium">{teacher.full_name}</td>
                    <td className="px-4 py-3">{teacher.email ?? '-'}</td>
                    <td className="px-4 py-3">{teacher.specialty ?? '-'}</td>
                    <td className="px-4 py-3">{teacher.classes_count ?? 0}</td>
                    <td className="px-4 py-3"><StatusBadge status={teacher.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {activeTab === 'turmas' && (
            <table className="w-full min-w-[560px] text-sm">
              <thead className="glass-thead text-hub-text-muted">
                <tr>
                  <th className="px-4 py-3 text-left">Codigo</th>
                  <th className="px-4 py-3 text-left">Nome</th>
                  <th className="px-4 py-3 text-left">Curso</th>
                  <th className="px-4 py-3 text-left">Professor</th>
                  <th className="px-4 py-3 text-left">Alunos</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((cls) => (
                  <tr key={cls.id} className="border-t border-hub-border/40">
                    <td className="px-4 py-3">{cls.code}</td>
                    <td className="px-4 py-3 font-medium">{cls.name}</td>
                    <td className="px-4 py-3">{cls.course?.name ?? EMPTY}</td>
                    <td className="px-4 py-3">{cls.teacher?.full_name ?? EMPTY}</td>
                    <td className="px-4 py-3">{cls.students_count ?? 0}</td>
                    <td className="px-4 py-3"><StatusBadge status={cls.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ConnectTableScroll>
        <ConnectPagination meta={meta} onPageChange={setPage} />
        </>
        )}
      </ConnectCard>

      {activeTab === 'alunos' && (
        <div className="rounded-xl border border-hub-navy/20 bg-hub-navy/10 px-4 py-3 text-sm text-blue-800">
          O botao Ver localizacao abre os dados do aluno. Os marcadores coloridos no mapa simulam quem esta no campus.
        </div>
      )}

      <ConnectDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Localizacao do aluno"
      >
        {selected && (
          <>
            <div className="mb-4 flex items-center gap-3">
              <UserAvatar name={selected.student?.full_name} size="md" />
              <div>
                <p className="font-semibold text-hub-navy">{selected.student?.full_name}</p>
                <p className="text-sm text-hub-text-muted">{selected.student?.email ?? '-'}</p>
                <p className="text-sm text-hub-text-muted">Turma: {selected.student?.class?.name ?? '-'}</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm">
              <li><strong>Endereco:</strong> {selected.address ?? '-'}</li>
              <li><strong>Cidade:</strong> {selected.city ?? '-'} - {selected.state ?? '-'}</li>
              <li><strong>Status:</strong> {selected.status === 'inside' ? 'Dentro do perimetro' : selected.status === 'outside' ? 'Fora do perimetro' : 'Desconhecido'}</li>
            </ul>
            <p className="mt-4 rounded-lg border border-hub-border/60 bg-hub-bg/60 px-3 py-2 text-xs text-hub-text-muted">
              Consulte o mapa 3D do campus na area principal da pagina para visualizar a localizacao.
            </p>
            <p className="mt-4 text-xs text-hub-text-muted">Ultima atualizacao: {formatDateTime(selected.last_seen_at)}</p>
          </>
        )}
      </ConnectDrawer>

      <ConnectEntityViewDrawer
        kind="location"
        entityId={null}
        open={viewSnapshot !== null}
        onClose={() => setViewSnapshot(null)}
        snapshot={viewSnapshot ?? undefined}
      />

      <ConnectEntityViewDrawer
        kind="student"
        entityId={viewStudentId}
        open={viewStudentId !== null}
        onClose={() => setViewStudentId(null)}
      />
    </div>
  )
}
