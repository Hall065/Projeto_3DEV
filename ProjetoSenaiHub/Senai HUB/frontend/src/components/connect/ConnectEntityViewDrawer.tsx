import { useEffect, useState } from 'react'
import { ConnectDrawer } from './ConnectDrawer'
import {
  ConnectLoadingSpinner,
  EMPTY,
  formatDate,
  formatDateTime,
  formatShift,
  StatusBadge,
} from './ConnectShared'
import { UserAvatar } from '../ui/UserAvatar'
import { connectService } from '../../services/connectService'
import type { ConnectAttendanceSession, ConnectSalaryRecord, ConnectStudentLocation } from '../../types/connect'
import type { ConnectViewKind, StudentProfileData, TeacherProfileData, ClassProfileData, CourseProfileData, PersonProfileData, ContractProfileData } from '../../types/connectView'
import type { GridInventoryItem, GridTicket, GridUser } from '../../types/grid'
import { hubPersonKindLabel, personDisplayName } from '../../utils/connectPerson'
import { courseStatusLabel } from '../../utils/courseThemes'

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-hub-border/50 bg-white/60 p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-hub-navy">{title}</h3>
      {children}
    </section>
  )
}

function DetailGrid({ children }: { children: React.ReactNode }) {
  return <dl className="grid gap-3 sm:grid-cols-2">{children}</dl>
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-hub-text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-hub-text">{value ?? EMPTY}</dd>
    </div>
  )
}

function MiniTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-hub-text-muted">Nenhum registro.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[320px] text-left text-sm">
        <thead>
          <tr className="border-b border-hub-border/60 text-xs text-hub-text-muted">
            {headers.map((h) => (
              <th key={h} className="px-2 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i} className="border-b border-hub-border/30 last:border-0">
              {cells.map((cell, j) => (
                <td key={j} className="px-2 py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CourseList({ items, emptyLabel }: { items: { course: { name: string; area?: string }; status?: string; via_class?: string }[]; emptyLabel: string }) {
  if (items.length === 0) return <p className="text-sm text-hub-text-muted">{emptyLabel}</p>
  return (
    <ul className="space-y-2">
      {items.map((row, i) => (
        <li key={i} className="flex items-start justify-between gap-2 rounded-lg bg-hub-bg/50 px-3 py-2">
          <div>
            <p className="font-medium text-hub-navy">{row.course.name}</p>
            <p className="text-xs text-hub-text-muted">
              {row.course.area ?? '—'}
              {row.via_class ? ` · via ${row.via_class}` : ''}
            </p>
          </div>
          {row.status && <StatusBadge status={row.status} />}
        </li>
      ))}
    </ul>
  )
}

function StudentProfileView({ data }: { data: StudentProfileData }) {
  const s = data.student
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <UserAvatar name={s.full_name} size="md" />
        <div>
          <h3 className="text-xl font-bold text-hub-navy">{s.full_name}</h3>
          <p className="text-sm text-hub-text-muted">Aluno · RM {s.registration_number ?? '—'}</p>
          <div className="mt-2">
            <StatusBadge status={s.status} />
          </div>
        </div>
      </div>

      <DetailSection title="Dados pessoais">
        <DetailGrid>
          <DetailRow label="CPF" value={s.cpf} />
          <DetailRow label="E-mail" value={s.email} />
          <DetailRow label="Celular" value={s.phone} />
          <DetailRow label="Nascimento" value={formatDate(s.birth_date)} />
          <DetailRow label="Cadastro" value={formatDateTime(s.created_at)} />
        </DetailGrid>
      </DetailSection>

      <DetailSection title="Turma atual">
        {s.class ? (
          <DetailGrid>
            <DetailRow label="Turma" value={s.class.name} />
            <DetailRow label="Curso" value={s.class.course?.name ?? EMPTY} />
            <DetailRow label="Turno" value={formatShift(s.class.shift)} />
            <DetailRow label="Professor" value={s.class.teacher?.full_name ?? EMPTY} />
          </DetailGrid>
        ) : (
          <p className="text-sm text-hub-text-muted">Sem turma vinculada.</p>
        )}
      </DetailSection>

      <DetailSection title="Cursos em andamento">
        <CourseList items={data.courses_active} emptyLabel="Nenhum curso ativo no cadastro global." />
      </DetailSection>

      <DetailSection title="Cursos concluídos">
        <CourseList items={data.courses_completed} emptyLabel="Nenhum curso concluído registrado." />
      </DetailSection>

      <DetailSection title="Contratos">
        <MiniTable
          headers={['Tipo', 'Empresa', 'Início', 'Status']}
          rows={data.contracts.map((c) => [
            c.contract_type,
            c.company_name ?? EMPTY,
            formatDate(c.start_date),
            <StatusBadge key={c.id} status={c.status} />,
          ])}
        />
      </DetailSection>

      <DetailSection title="Histórico de salários">
        <MiniTable
          headers={['Referência', 'Base', 'Líquido', 'Status']}
          rows={data.salaries.map((r) => [
            r.reference_month,
            `R$ ${r.base_amount.toFixed(2)}`,
            `R$ ${r.net_amount.toFixed(2)}`,
            <StatusBadge key={r.id} status={r.status} />,
          ])}
        />
      </DetailSection>

      <DetailSection title="Turmas (histórico)">
        <MiniTable
          headers={['Turma', 'Curso', 'Alunos', 'Status']}
          rows={data.classes.map((t) => [
            t.name,
            t.course?.name ?? EMPTY,
            String(t.students_count ?? 0),
            <StatusBadge key={t.id} status={t.status} />,
          ])}
        />
      </DetailSection>
    </div>
  )
}

function TeacherProfileView({ data }: { data: TeacherProfileData }) {
  const t = data.teacher
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <UserAvatar name={t.full_name} size="md" />
        <div>
          <h3 className="text-xl font-bold text-hub-navy">{t.full_name}</h3>
          <p className="text-sm text-hub-text-muted">{t.specialty ?? 'Professor'}</p>
          <div className="mt-2">
            <StatusBadge status={t.status} />
          </div>
        </div>
      </div>
      <DetailSection title="Contato">
        <DetailGrid>
          <DetailRow label="E-mail" value={t.email} />
          <DetailRow label="Celular" value={t.phone} />
          <DetailRow label="CPF" value={t.cpf} />
        </DetailGrid>
      </DetailSection>
      <DetailSection title="Turmas sob responsabilidade">
        <MiniTable
          headers={['Turma', 'Curso', 'Alunos', 'Status']}
          rows={data.classes.map((c) => [
            c.name,
            c.course?.name ?? EMPTY,
            String(c.students_count ?? 0),
            <StatusBadge key={c.id} status={c.status} />,
          ])}
        />
      </DetailSection>
      <DetailSection title="Cursos (vínculo global)">
        <CourseList
          items={data.courses.map((r) => ({ course: r.course, status: r.status }))}
          emptyLabel="Nenhum curso vinculado."
        />
      </DetailSection>
    </div>
  )
}

function ClassProfileView({ data }: { data: ClassProfileData }) {
  const c = data.class
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-bold text-hub-navy">{c.name}</h3>
        <p className="text-sm text-hub-text-muted">{c.code}</p>
        <div className="mt-2">
          <StatusBadge status={c.status} />
        </div>
      </div>
      <DetailSection title="Informações">
        <DetailGrid>
          <DetailRow label="Curso" value={c.course?.name ?? 'Sem curso'} />
          <DetailRow label="Professor" value={c.teacher?.full_name ?? 'Sem professor'} />
          <DetailRow label="Turno" value={formatShift(c.shift)} />
          <DetailRow label="Capacidade" value={c.capacity} />
          <DetailRow label="Início" value={formatDate(c.start_date)} />
          <DetailRow label="Término" value={formatDate(c.end_date)} />
          <DetailRow label="Alunos matriculados" value={c.students_count ?? data.students.length} />
        </DetailGrid>
      </DetailSection>
      <DetailSection title="Alunos da turma">
        <MiniTable
          headers={['Nome', 'RM', 'Status']}
          rows={data.students.map((s) => [
            s.full_name,
            s.registration_number ?? EMPTY,
            <StatusBadge key={s.id} status={s.status} />,
          ])}
        />
      </DetailSection>
    </div>
  )
}

function CourseProfileView({ data }: { data: CourseProfileData }) {
  const c = data.course
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-bold text-hub-navy">{c.name}</h3>
        <p className="text-sm text-hub-text-muted">{c.code} · {courseStatusLabel(c.status)}</p>
      </div>
      <DetailSection title="Detalhes do curso">
        <DetailGrid>
          <DetailRow label="Área" value={c.area} />
          <DetailRow label="Carga horária" value={c.workload_hours ? `${c.workload_hours}h` : EMPTY} />
          <DetailRow label="Turmas" value={c.classes_count ?? data.classes.length} />
        </DetailGrid>
        {c.description && <p className="mt-3 text-sm leading-relaxed text-hub-text-muted">{c.description}</p>}
      </DetailSection>
      <DetailSection title="Turmas do curso">
        <MiniTable
          headers={['Turma', 'Professor', 'Alunos', 'Status']}
          rows={data.classes.map((t) => [
            t.name,
            t.teacher?.full_name ?? EMPTY,
            String(t.students_count ?? 0),
            <StatusBadge key={t.id} status={t.status} />,
          ])}
        />
      </DetailSection>
      <DetailSection title="Matrículas no curso">
        <p className="mb-2 text-xs font-medium text-hub-text-muted">
          {data.roster.students.length} aluno(s) · {data.roster.teachers.length} professor(es)
        </p>
        <MiniTable
          headers={['Nome', 'Papel', 'Status']}
          rows={[
            ...data.roster.students.map((p) => [personDisplayName(p), 'Aluno', <StatusBadge key={`s-${p.id}`} status={p.status} />]),
            ...data.roster.teachers.map((p) => [personDisplayName(p), 'Professor', <StatusBadge key={`t-${p.id}`} status={p.status} />]),
            ...data.roster.coordinators.map((p) => [
              personDisplayName(p),
              'Coordenador',
              <StatusBadge key={`c-${p.id}`} status={p.status} />,
            ]),
          ]}
        />
      </DetailSection>
    </div>
  )
}

function PersonProfileView({ data }: { data: PersonProfileData }) {
  const p = data.person
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <UserAvatar name={personDisplayName(p)} size="md" />
        <div>
          <h3 className="text-xl font-bold text-hub-navy">{personDisplayName(p)}</h3>
          <p className="text-sm text-hub-text-muted">{hubPersonKindLabel(p.kind)}</p>
          <div className="mt-2">
            <StatusBadge status={p.status} />
          </div>
        </div>
      </div>
      <DetailSection title="Cadastro global">
        <DetailGrid>
          <DetailRow label="E-mail" value={p.email} />
          <DetailRow label="Celular" value={p.phone} />
          <DetailRow label="CPF" value={p.cpf} />
          <DetailRow label="Matrícula" value={p.registration_number} />
          <DetailRow label="Especialidade" value={p.specialty} />
        </DetailGrid>
      </DetailSection>
      {data.connect_student && (
        <DetailSection title="Perfil Connect — Aluno">
          <p className="text-sm">
            {data.connect_student.full_name} · Turma {data.connect_student.class?.name ?? '—'}
          </p>
        </DetailSection>
      )}
      {data.connect_teacher && (
        <DetailSection title="Perfil Connect — Professor">
          <p className="text-sm">{data.connect_teacher.full_name} · {data.connect_teacher.specialty ?? '—'}</p>
        </DetailSection>
      )}
      <DetailSection title="Cursos vinculados">
        <MiniTable
          headers={['Curso', 'Papel', 'Status']}
          rows={data.courses.map((c) => {
            const course = (c as { name?: string; pivot?: { role?: string; status?: string } })
            return [
              course.name ?? '—',
              course.pivot?.role ?? '—',
              <StatusBadge key={c.id} status={course.pivot?.status ?? p.status} />,
            ]
          })}
        />
      </DetailSection>
    </div>
  )
}

function ContractProfileView({ data }: { data: ContractProfileData }) {
  const c = data.contract
  const s = c.student
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-bold text-hub-navy">Contrato · {c.contract_type}</h3>
        <StatusBadge status={c.status} />
      </div>
      <DetailSection title="Contrato">
        <DetailGrid>
          <DetailRow label="Empresa" value={c.company_name} />
          <DetailRow label="Início" value={formatDate(c.start_date)} />
          <DetailRow label="Término" value={formatDate(c.end_date)} />
          <DetailRow label="Valor mensal" value={`R$ ${c.monthly_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
        </DetailGrid>
      </DetailSection>
      {s && (
        <DetailSection title="Aluno vinculado">
          <DetailGrid>
            <DetailRow label="Nome" value={s.full_name} />
            <DetailRow label="Turma" value={s.class?.name ?? EMPTY} />
            <DetailRow label="Curso" value={s.class?.course?.name ?? EMPTY} />
          </DetailGrid>
        </DetailSection>
      )}
    </div>
  )
}

function SalarySnapshotView({ record }: { record: ConnectSalaryRecord }) {
  return (
    <div className="space-y-5">
      <DetailSection title="Registro de salário">
        <DetailGrid>
          <DetailRow label="Aluno" value={record.student?.full_name} />
          <DetailRow label="Curso" value={record.student?.class?.course?.name} />
          <DetailRow label="Referência" value={record.reference_month} />
          <DetailRow label="Base" value={`R$ ${record.base_amount.toFixed(2)}`} />
          <DetailRow label="Líquido" value={`R$ ${record.net_amount.toFixed(2)}`} />
          <DetailRow label="Status" value={<StatusBadge status={record.status} />} />
        </DetailGrid>
      </DetailSection>
    </div>
  )
}

function AttendanceSnapshotView({ session }: { session: ConnectAttendanceSession }) {
  const stats = session.stats
  return (
    <div className="space-y-5">
      <DetailSection title="Sessão de frequência">
        <DetailGrid>
          <DetailRow label="Data" value={formatDate(session.session_date)} />
          <DetailRow label="Turma" value={session.class?.name} />
          <DetailRow label="Disciplina" value={session.subject} />
          <DetailRow label="Professor" value={session.teacher?.full_name ?? session.class?.teacher?.full_name} />
          {stats && (
            <>
              <DetailRow label="Presença" value={`${stats.presence_rate}%`} />
              <DetailRow label="Total marcações" value={stats.total} />
            </>
          )}
        </DetailGrid>
      </DetailSection>
    </div>
  )
}

function LocationSnapshotView({ loc }: { loc: ConnectStudentLocation }) {
  return (
    <div className="space-y-5">
      <DetailSection title="Localização">
        <DetailGrid>
          <DetailRow label="Aluno" value={loc.student?.full_name} />
          <DetailRow label="Status" value={<StatusBadge status={loc.status} />} />
          <DetailRow label="Endereço" value={loc.address} />
          <DetailRow label="Última atualização" value={formatDateTime(loc.last_seen_at)} />
        </DetailGrid>
      </DetailSection>
    </div>
  )
}

function GridTicketView({ ticket }: { ticket: GridTicket }) {
  return (
    <DetailSection title="Chamado">
      <DetailGrid>
        <DetailRow label="Código" value={ticket.code} />
        <DetailRow label="Título" value={ticket.title} />
        <DetailRow label="Solicitante" value={ticket.requester} />
        <DetailRow label="Local" value={`${ticket.room} / ${ticket.block}`} />
        <DetailRow label="Prioridade" value={ticket.priority} />
        <DetailRow label="Responsável" value={ticket.assignee} />
        <DetailRow label="Abertura" value={formatDateTime(ticket.opened_at)} />
        <DetailRow label="Status" value={ticket.status} />
      </DetailGrid>
      <p className="mt-3 text-sm text-hub-text-muted">{ticket.summary}</p>
    </DetailSection>
  )
}

function GridUserView({ user }: { user: GridUser }) {
  return (
    <DetailSection title="Usuário Grid">
      <DetailGrid>
        <DetailRow label="Nome" value={user.name} />
        <DetailRow label="E-mail" value={user.email} />
        <DetailRow label="Perfil" value={user.role} />
        <DetailRow label="Telefone" value={user.phone} />
        <DetailRow label="CPF" value={user.cpf} />
        <DetailRow label="Status" value={<StatusBadge status={user.status} />} />
      </DetailGrid>
    </DetailSection>
  )
}

function GridInventoryView({ item }: { item: GridInventoryItem }) {
  return (
    <DetailSection title="Item de estoque">
      <DetailGrid>
        <DetailRow label="Título" value={item.title} />
        <DetailRow label="Categoria" value={item.category} />
        <DetailRow label="Qtd. disponível" value={item.qty_available} />
        <DetailRow label="Qtd. mínima" value={item.qty_min} />
        <DetailRow label="Localização" value={item.location} />
        <DetailRow label="Fornecedor" value={item.supplier} />
        <DetailRow label="Custo" value={`R$ ${item.cost.toFixed(2)}`} />
        <DetailRow label="Status" value={item.status} />
      </DetailGrid>
      <p className="mt-3 text-sm text-hub-text-muted">{item.description}</p>
    </DetailSection>
  )
}

const KIND_LABELS: Record<ConnectViewKind, string> = {
  student: 'Detalhes do aluno',
  teacher: 'Detalhes do professor',
  class: 'Detalhes da turma',
  course: 'Detalhes do curso',
  person: 'Detalhes da pessoa',
  contract: 'Detalhes do contrato',
  salary: 'Detalhes do salário',
  attendance: 'Detalhes da frequência',
  location: 'Localização',
  'grid-ticket': 'Chamado',
  'grid-user': 'Usuário',
  'grid-inventory': 'Item de estoque',
}

export interface ConnectEntityViewDrawerProps {
  kind: ConnectViewKind
  entityId: number | null
  open: boolean
  onClose: () => void
  snapshot?: ConnectSalaryRecord | ConnectAttendanceSession | ConnectStudentLocation | GridTicket | GridUser | GridInventoryItem
}

export function ConnectEntityViewDrawer({ kind, entityId, open, onClose, snapshot }: ConnectEntityViewDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [studentData, setStudentData] = useState<StudentProfileData | null>(null)
  const [teacherData, setTeacherData] = useState<TeacherProfileData | null>(null)
  const [classData, setClassData] = useState<ClassProfileData | null>(null)
  const [courseData, setCourseData] = useState<CourseProfileData | null>(null)
  const [personData, setPersonData] = useState<PersonProfileData | null>(null)
  const [contractData, setContractData] = useState<ContractProfileData | null>(null)

  useEffect(() => {
    if (!open) {
      setError(null)
      return
    }

    const apiKinds: ConnectViewKind[] = ['student', 'teacher', 'class', 'course', 'person', 'contract']
    if (!apiKinds.includes(kind) || !entityId) return

    setLoading(true)
    setError(null)

    const load = async () => {
      try {
        if (kind === 'student') setStudentData(await connectService.getStudentProfile(entityId))
        if (kind === 'teacher') setTeacherData(await connectService.getTeacherProfile(entityId))
        if (kind === 'class') setClassData(await connectService.getClassProfile(entityId))
        if (kind === 'course') setCourseData(await connectService.getCourseProfile(entityId))
        if (kind === 'person') setPersonData(await connectService.getPersonProfile(entityId))
        if (kind === 'contract') setContractData(await connectService.getContractProfile(entityId))
      } catch {
        setError('Não foi possível carregar os detalhes. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [open, kind, entityId])

  let body: React.ReactNode = null

  if (loading) {
    body = <ConnectLoadingSpinner label="Carregando detalhes..." className="min-h-[240px]" />
  } else if (error) {
    body = <p className="py-12 text-center text-sm text-hub-red">{error}</p>
  } else if (kind === 'student' && studentData) {
    body = <StudentProfileView data={studentData} />
  } else if (kind === 'teacher' && teacherData) {
    body = <TeacherProfileView data={teacherData} />
  } else if (kind === 'class' && classData) {
    body = <ClassProfileView data={classData} />
  } else if (kind === 'course' && courseData) {
    body = <CourseProfileView data={courseData} />
  } else if (kind === 'person' && personData) {
    body = <PersonProfileView data={personData} />
  } else if (kind === 'contract' && contractData) {
    body = <ContractProfileView data={contractData} />
  } else if (kind === 'salary' && snapshot && 'net_amount' in snapshot) {
    body = <SalarySnapshotView record={snapshot as ConnectSalaryRecord} />
  } else if (kind === 'attendance' && snapshot && 'session_date' in snapshot) {
    body = <AttendanceSnapshotView session={snapshot as ConnectAttendanceSession} />
  } else if (kind === 'location' && snapshot && 'connect_student_id' in snapshot) {
    body = <LocationSnapshotView loc={snapshot as ConnectStudentLocation} />
  } else if (kind === 'grid-ticket' && snapshot) {
    body = <GridTicketView ticket={snapshot as GridTicket} />
  } else if (kind === 'grid-user' && snapshot) {
    body = <GridUserView user={snapshot as GridUser} />
  } else if (kind === 'grid-inventory' && snapshot) {
    body = <GridInventoryView item={snapshot as GridInventoryItem} />
  } else {
    body = <p className="py-12 text-center text-sm text-hub-text-muted">Sem dados para exibir.</p>
  }

  return (
    <ConnectDrawer open={open} onClose={onClose} title={KIND_LABELS[kind]} subtitle="Visualização completa" width="2xl">
      {body}
    </ConnectDrawer>
  )
}
