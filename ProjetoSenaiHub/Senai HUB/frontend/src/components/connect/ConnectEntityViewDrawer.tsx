import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { GridTicketAttachmentsPanel } from '../grid/GridTicketAttachmentsPanel'
import type { GridInventoryItem, GridTicket, GridUser } from '../../types/grid'
import { courseRosterRoleLabel, hubPersonKindLabel, personDisplayName } from '../../utils/connectPerson'
import { courseStatusLabel } from '../../utils/courseThemes'

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface-inset rounded-xl border border-hub-border/50 p-4">
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

function MiniTable({ headers, rows, emptyLabel }: { headers: string[]; rows: React.ReactNode[][]; emptyLabel: string }) {
  if (rows.length === 0) {
    return <p className="text-sm text-hub-text-muted">{emptyLabel}</p>
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

function CourseList({
  items,
  emptyLabel,
  viaClassLabel,
}: {
  items: { course: { name: string; area?: string }; status?: string; via_class?: string }[]
  emptyLabel: string
  viaClassLabel: (name: string) => string
}) {
  if (items.length === 0) return <p className="text-sm text-hub-text-muted">{emptyLabel}</p>
  return (
    <ul className="space-y-2">
      {items.map((row, i) => (
        <li key={i} className="flex items-start justify-between gap-2 rounded-lg bg-hub-bg/50 px-3 py-2">
          <div>
            <p className="font-medium text-hub-navy">{row.course.name}</p>
            <p className="text-xs text-hub-text-muted">
              {row.course.area ?? '—'}
              {row.via_class ? ` · ${viaClassLabel(row.via_class)}` : ''}
            </p>
          </div>
          {row.status && <StatusBadge status={row.status} />}
        </li>
      ))}
    </ul>
  )
}

function StudentProfileView({ data }: { data: StudentProfileData }) {
  const { t } = useTranslation()
  const s = data.student
  const f = (key: string) => t(`connect.entityView.fields.${key}`)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <UserAvatar name={s.full_name} size="md" />
        <div>
          <h3 className="text-xl font-bold text-hub-navy">{s.full_name}</h3>
          <p className="text-sm text-hub-text-muted">
            {t('connect.entityView.student.subtitle', { rm: s.registration_number ?? '—' })}
          </p>
          <div className="mt-2">
            <StatusBadge status={s.status} />
          </div>
        </div>
      </div>

      <DetailSection title={t('connect.entityView.sections.personalData')}>
        <DetailGrid>
          <DetailRow label={f('cpf')} value={s.cpf} />
          <DetailRow label={f('email')} value={s.email} />
          <DetailRow label={f('phone')} value={s.phone} />
          <DetailRow label={f('birthDate')} value={formatDate(s.birth_date)} />
          <DetailRow label={f('registeredAt')} value={formatDateTime(s.created_at)} />
        </DetailGrid>
      </DetailSection>

      <DetailSection title={t('connect.entityView.sections.currentClass')}>
        {s.class ? (
          <DetailGrid>
            <DetailRow label={f('class')} value={s.class.name} />
            <DetailRow label={f('course')} value={s.class.course?.name ?? EMPTY} />
            <DetailRow label={f('shift')} value={formatShift(s.class.shift)} />
            <DetailRow label={f('teacher')} value={s.class.teacher?.full_name ?? EMPTY} />
          </DetailGrid>
        ) : (
          <p className="text-sm text-hub-text-muted">{t('connect.entityView.student.noClass')}</p>
        )}
      </DetailSection>

      <DetailSection title={t('connect.entityView.sections.activeCourses')}>
        <CourseList
          items={data.courses_active}
          emptyLabel={t('connect.entityView.student.noActiveCourses')}
          viaClassLabel={(name) => t('connect.entityView.viaClass', { name })}
        />
      </DetailSection>

      <DetailSection title={t('connect.entityView.sections.completedCourses')}>
        <CourseList
          items={data.courses_completed}
          emptyLabel={t('connect.entityView.student.noCompletedCourses')}
          viaClassLabel={(name) => t('connect.entityView.viaClass', { name })}
        />
      </DetailSection>

      <DetailSection title={t('connect.entityView.sections.contracts')}>
        <MiniTable
          headers={[f('contractType'), f('company'), f('startDate'), t('connect.table.status')]}
          emptyLabel={t('connect.entityView.noRecords')}
          rows={data.contracts.map((c) => [
            c.contract_type,
            c.company_name ?? EMPTY,
            formatDate(c.start_date),
            <StatusBadge key={c.id} status={c.status} />,
          ])}
        />
      </DetailSection>

      <DetailSection title={t('connect.entityView.sections.salaryHistory')}>
        <MiniTable
          headers={[f('referenceMonth'), f('baseSalary'), f('netSalary'), t('connect.table.status')]}
          emptyLabel={t('connect.entityView.noRecords')}
          rows={data.salaries.map((r) => [
            r.reference_month,
            `R$ ${r.base_amount.toFixed(2)}`,
            `R$ ${r.net_amount.toFixed(2)}`,
            <StatusBadge key={r.id} status={r.status} />,
          ])}
        />
      </DetailSection>

      <DetailSection title={t('connect.entityView.sections.classHistory')}>
        <MiniTable
          headers={[f('class'), f('course'), t('connect.classes.table.students'), t('connect.table.status')]}
          emptyLabel={t('connect.entityView.noRecords')}
          rows={data.classes.map((cls) => [
            cls.name,
            cls.course?.name ?? EMPTY,
            String(cls.students_count ?? 0),
            <StatusBadge key={cls.id} status={cls.status} />,
          ])}
        />
      </DetailSection>
    </div>
  )
}

function TeacherProfileView({ data }: { data: TeacherProfileData }) {
  const { t } = useTranslation()
  const teacher = data.teacher
  const f = (key: string) => t(`connect.entityView.fields.${key}`)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <UserAvatar name={teacher.full_name} size="md" />
        <div>
          <h3 className="text-xl font-bold text-hub-navy">{teacher.full_name}</h3>
          <p className="text-sm text-hub-text-muted">{teacher.specialty ?? t('connect.entityView.teacher.defaultSpecialty')}</p>
          <div className="mt-2">
            <StatusBadge status={teacher.status} />
          </div>
        </div>
      </div>
      <DetailSection title={t('connect.entityView.sections.contact')}>
        <DetailGrid>
          <DetailRow label={f('email')} value={teacher.email} />
          <DetailRow label={f('phone')} value={teacher.phone} />
          <DetailRow label={f('cpf')} value={teacher.cpf} />
        </DetailGrid>
      </DetailSection>
      <DetailSection title={t('connect.entityView.sections.responsibleClasses')}>
        <MiniTable
          headers={[f('class'), f('course'), t('connect.classes.table.students'), t('connect.table.status')]}
          emptyLabel={t('connect.entityView.noRecords')}
          rows={data.classes.map((c) => [
            c.name,
            c.course?.name ?? EMPTY,
            String(c.students_count ?? 0),
            <StatusBadge key={c.id} status={c.status} />,
          ])}
        />
      </DetailSection>
      <DetailSection title={t('connect.entityView.sections.globalCourses')}>
        <CourseList
          items={data.courses.map((r) => ({ course: r.course, status: r.status }))}
          emptyLabel={t('connect.entityView.teacher.noCourses')}
          viaClassLabel={(name) => t('connect.entityView.viaClass', { name })}
        />
      </DetailSection>
    </div>
  )
}

function ClassProfileView({ data }: { data: ClassProfileData }) {
  const { t } = useTranslation()
  const c = data.class
  const f = (key: string) => t(`connect.entityView.fields.${key}`)

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-bold text-hub-navy">{c.name}</h3>
        <p className="text-sm text-hub-text-muted">{c.code}</p>
        <div className="mt-2">
          <StatusBadge status={c.status} />
        </div>
      </div>
      <DetailSection title={t('connect.entityView.sections.info')}>
        <DetailGrid>
          <DetailRow label={f('course')} value={c.course?.name ?? t('connect.entityView.class.noCourse')} />
          <DetailRow label={f('teacher')} value={c.teacher?.full_name ?? t('connect.entityView.class.noTeacher')} />
          <DetailRow label={f('shift')} value={formatShift(c.shift)} />
          <DetailRow label={f('capacity')} value={c.capacity} />
          <DetailRow label={f('startDate')} value={formatDate(c.start_date)} />
          <DetailRow label={f('endDate')} value={formatDate(c.end_date)} />
          <DetailRow label={f('enrolledStudents')} value={c.students_count ?? data.students.length} />
        </DetailGrid>
      </DetailSection>
      <DetailSection title={t('connect.entityView.sections.classStudents')}>
        <MiniTable
          headers={[f('name'), f('rm'), t('connect.table.status')]}
          emptyLabel={t('connect.entityView.noRecords')}
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
  const { t } = useTranslation()
  const c = data.course
  const f = (key: string) => t(`connect.entityView.fields.${key}`)

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-bold text-hub-navy">{c.name}</h3>
        <p className="text-sm text-hub-text-muted">
          {c.code} · {courseStatusLabel(c.status)}
        </p>
      </div>
      <DetailSection title={t('connect.entityView.sections.courseDetails')}>
        <DetailGrid>
          <DetailRow label={f('area')} value={c.area} />
          <DetailRow label={f('workload')} value={c.workload_hours ? `${c.workload_hours}h` : EMPTY} />
          <DetailRow label={f('classesCount')} value={c.classes_count ?? data.classes.length} />
        </DetailGrid>
        {c.description && <p className="mt-3 text-sm leading-relaxed text-hub-text-muted">{c.description}</p>}
      </DetailSection>
      <DetailSection title={t('connect.entityView.sections.courseClasses')}>
        <MiniTable
          headers={[f('class'), f('teacher'), t('connect.classes.table.students'), t('connect.table.status')]}
          emptyLabel={t('connect.entityView.noRecords')}
          rows={data.classes.map((cls) => [
            cls.name,
            cls.teacher?.full_name ?? EMPTY,
            String(cls.students_count ?? 0),
            <StatusBadge key={cls.id} status={cls.status} />,
          ])}
        />
      </DetailSection>
      <DetailSection title={t('connect.entityView.sections.courseRoster')}>
        <p className="mb-2 text-xs font-medium text-hub-text-muted">
          {t('connect.entityView.course.rosterSummary', {
            students: data.roster.students.length,
            teachers: data.roster.teachers.length,
          })}
        </p>
        <MiniTable
          headers={[f('name'), f('role'), t('connect.table.status')]}
          emptyLabel={t('connect.entityView.noRecords')}
          rows={[
            ...data.roster.students.map((p) => [
              personDisplayName(p),
              courseRosterRoleLabel('student'),
              <StatusBadge key={`s-${p.id}`} status={p.status} />,
            ]),
            ...data.roster.teachers.map((p) => [
              personDisplayName(p),
              courseRosterRoleLabel('teacher'),
              <StatusBadge key={`t-${p.id}`} status={p.status} />,
            ]),
            ...data.roster.coordinators.map((p) => [
              personDisplayName(p),
              courseRosterRoleLabel('coordinator'),
              <StatusBadge key={`c-${p.id}`} status={p.status} />,
            ]),
          ]}
        />
      </DetailSection>
    </div>
  )
}

function PersonProfileView({ data }: { data: PersonProfileData }) {
  const { t } = useTranslation()
  const p = data.person
  const f = (key: string) => t(`connect.entityView.fields.${key}`)

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
      <DetailSection title={t('connect.entityView.sections.globalRegistration')}>
        <DetailGrid>
          <DetailRow label={f('email')} value={p.email} />
          <DetailRow label={f('phone')} value={p.phone} />
          <DetailRow label={f('cpf')} value={p.cpf} />
          <DetailRow label={f('registration')} value={p.registration_number} />
          <DetailRow label={f('specialty')} value={p.specialty} />
        </DetailGrid>
      </DetailSection>
      {data.connect_student && (
        <DetailSection title={t('connect.entityView.sections.connectStudentProfile')}>
          <p className="text-sm">
            {t('connect.entityView.person.classLine', {
              name: data.connect_student.full_name,
              className: data.connect_student.class?.name ?? '—',
            })}
          </p>
        </DetailSection>
      )}
      {data.connect_teacher && (
        <DetailSection title={t('connect.entityView.sections.connectTeacherProfile')}>
          <p className="text-sm">
            {data.connect_teacher.full_name} · {data.connect_teacher.specialty ?? '—'}
          </p>
        </DetailSection>
      )}
      <DetailSection title={t('connect.entityView.sections.linkedCourses')}>
        <MiniTable
          headers={[f('course'), f('role'), t('connect.table.status')]}
          emptyLabel={t('connect.entityView.noRecords')}
          rows={data.courses.map((course) => {
            const row = course as { name?: string; pivot?: { role?: string; status?: string } }
            return [
              row.name ?? '—',
              row.pivot?.role ?? '—',
              <StatusBadge key={course.id} status={row.pivot?.status ?? p.status} />,
            ]
          })}
        />
      </DetailSection>
    </div>
  )
}

function ContractProfileView({ data }: { data: ContractProfileData }) {
  const { t, i18n } = useTranslation()
  const c = data.contract
  const s = c.student
  const f = (key: string) => t(`connect.entityView.fields.${key}`)
  const brl = new Intl.NumberFormat(i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : 'pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-bold text-hub-navy">{t('connect.entityView.contract.title', { type: c.contract_type })}</h3>
        <StatusBadge status={c.status} />
      </div>
      <DetailSection title={t('connect.entityView.sections.contractDetails')}>
        <DetailGrid>
          <DetailRow label={f('company')} value={c.company_name} />
          <DetailRow label={f('startDate')} value={formatDate(c.start_date)} />
          <DetailRow label={f('endDate')} value={formatDate(c.end_date)} />
          <DetailRow label={f('monthlyValue')} value={brl.format(c.monthly_value)} />
        </DetailGrid>
      </DetailSection>
      {s && (
        <DetailSection title={t('connect.entityView.sections.linkedStudent')}>
          <DetailGrid>
            <DetailRow label={f('name')} value={s.full_name} />
            <DetailRow label={f('class')} value={s.class?.name ?? EMPTY} />
            <DetailRow label={f('course')} value={s.class?.course?.name ?? EMPTY} />
          </DetailGrid>
        </DetailSection>
      )}
    </div>
  )
}

function SalarySnapshotView({ record }: { record: ConnectSalaryRecord }) {
  const { t, i18n } = useTranslation()
  const f = (key: string) => t(`connect.entityView.fields.${key}`)
  const brl = new Intl.NumberFormat(i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : 'pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  return (
    <div className="space-y-5">
      <DetailSection title={t('connect.entityView.sections.salaryRecord')}>
        <DetailGrid>
          <DetailRow label={f('student')} value={record.student?.full_name} />
          <DetailRow label={f('registration')} value={record.student?.registration_number} />
          <DetailRow label={f('class')} value={record.student?.class?.name} />
          <DetailRow label={f('course')} value={record.student?.class?.course?.name} />
          <DetailRow label={f('referenceMonth')} value={record.reference_month} />
          <DetailRow label={f('baseSalary')} value={brl.format(record.base_amount)} />
          <DetailRow label={f('bonuses')} value={brl.format(record.bonuses)} />
          <DetailRow label={f('deductions')} value={brl.format(record.deductions)} />
          <DetailRow label={f('netAmount')} value={brl.format(record.net_amount)} />
          <DetailRow label={t('connect.table.status')} value={<StatusBadge status={record.status_label ?? record.status} />} />
          <DetailRow label={f('calculatedAt')} value={record.calculated_at ? formatDateTime(record.calculated_at) : undefined} />
        </DetailGrid>
      </DetailSection>
    </div>
  )
}

function AttendanceSnapshotView({ session }: { session: ConnectAttendanceSession }) {
  const { t } = useTranslation()
  const stats = session.stats
  const f = (key: string) => t(`connect.entityView.fields.${key}`)

  return (
    <div className="space-y-5">
      <DetailSection title={t('connect.entityView.sections.attendanceSession')}>
        <DetailGrid>
          <DetailRow label={f('date')} value={formatDate(session.session_date)} />
          <DetailRow label={f('class')} value={session.class?.name} />
          <DetailRow label={f('subject')} value={session.subject} />
          <DetailRow label={f('lessonsPerDay')} value={session.lessons_count ?? stats?.lessons_count} />
          <DetailRow label={f('teacher')} value={session.teacher?.full_name ?? session.class?.teacher?.full_name} />
          {stats && (
            <>
              <DetailRow label={f('presence')} value={`${stats.presence_rate}%`} />
              <DetailRow label={f('totalMarks')} value={stats.total} />
              <DetailRow label={f('missedLessons')} value={stats.missed_lessons_total ?? 0} />
            </>
          )}
        </DetailGrid>
      </DetailSection>
    </div>
  )
}

function LocationSnapshotView({ loc }: { loc: ConnectStudentLocation }) {
  const { t } = useTranslation()
  const f = (key: string) => t(`connect.entityView.fields.${key}`)

  return (
    <div className="space-y-5">
      <DetailSection title={t('connect.entityView.sections.location')}>
        <DetailGrid>
          <DetailRow label={f('student')} value={loc.student?.full_name} />
          <DetailRow label={t('connect.table.status')} value={<StatusBadge status={loc.status} />} />
          <DetailRow label={f('address')} value={loc.address} />
          <DetailRow label={f('lastUpdate')} value={formatDateTime(loc.last_seen_at)} />
        </DetailGrid>
      </DetailSection>
    </div>
  )
}

function GridTicketView({ ticket }: { ticket: GridTicket }) {
  const { t } = useTranslation()
  const f = (key: string) => t(`connect.entityView.fields.${key}`)

  return (
    <div className="space-y-4">
      <DetailSection title={t('connect.entityView.sections.ticket')}>
        <DetailGrid>
          <DetailRow label={f('code')} value={ticket.code} />
          <DetailRow label={f('title')} value={ticket.title} />
          <DetailRow label={f('requester')} value={ticket.requester} />
          <DetailRow
            label={f('location')}
            value={t('connect.entityView.grid.roomBlock', { room: ticket.room, block: ticket.block })}
          />
          <DetailRow label={f('priority')} value={ticket.priority} />
          <DetailRow label={f('assignee')} value={ticket.assignee} />
          <DetailRow label={f('openedAt')} value={formatDateTime(ticket.opened_at)} />
          <DetailRow label={t('connect.table.status')} value={ticket.status} />
        </DetailGrid>
        <p className="mt-3 text-sm text-hub-text-muted">{ticket.summary}</p>
      </DetailSection>

      {(ticket.attachments?.length ?? 0) > 0 && (
        <GridTicketAttachmentsPanel ticketId={ticket.id} attachments={ticket.attachments ?? []} readOnly />
      )}
    </div>
  )
}

function GridUserView({ user }: { user: GridUser }) {
  const { t } = useTranslation()
  const f = (key: string) => t(`connect.entityView.fields.${key}`)

  return (
    <DetailSection title={t('connect.entityView.sections.gridUser')}>
      <DetailGrid>
        <DetailRow label={f('name')} value={user.name} />
        <DetailRow label={f('email')} value={user.email} />
        <DetailRow label={f('profile')} value={user.role} />
        <DetailRow label={f('phone')} value={user.phone} />
        <DetailRow label={f('cpf')} value={user.cpf} />
        <DetailRow label={t('connect.table.status')} value={<StatusBadge status={user.status} />} />
      </DetailGrid>
    </DetailSection>
  )
}

function GridInventoryView({ item }: { item: GridInventoryItem }) {
  const { t } = useTranslation()
  const f = (key: string) => t(`connect.entityView.fields.${key}`)

  return (
    <DetailSection title={t('connect.entityView.sections.inventoryItem')}>
      {item.image_url ? (
        <div className="mb-4 flex justify-center">
          <img
            src={item.image_url}
            alt={item.title}
            referrerPolicy="no-referrer"
            className="max-h-48 max-w-full rounded-xl border border-hub-border/50 bg-white object-contain p-2"
          />
        </div>
      ) : null}
      <DetailGrid>
        <DetailRow label={f('title')} value={item.title} />
        <DetailRow label={f('category')} value={item.category} />
        <DetailRow label={f('qtyAvailable')} value={item.qty_available} />
        <DetailRow label={f('qtyMin')} value={item.qty_min} />
        <DetailRow label={f('location')} value={item.location} />
        <DetailRow label={f('supplier')} value={item.supplier} />
        <DetailRow label={f('cost')} value={`R$ ${item.cost.toFixed(2)}`} />
        <DetailRow label={t('connect.table.status')} value={item.status} />
      </DetailGrid>
      <p className="mt-3 text-sm text-hub-text-muted">{item.description}</p>
    </DetailSection>
  )
}

export interface ConnectEntityViewDrawerProps {
  kind: ConnectViewKind
  entityId: number | null
  open: boolean
  onClose: () => void
  snapshot?: ConnectSalaryRecord | ConnectAttendanceSession | ConnectStudentLocation | GridTicket | GridUser | GridInventoryItem
}

export function ConnectEntityViewDrawer({ kind, entityId, open, onClose, snapshot }: ConnectEntityViewDrawerProps) {
  const { t } = useTranslation()
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
        setError(t('connect.entityView.loadError'))
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [open, kind, entityId, t])

  let body: React.ReactNode = null

  if (loading) {
    body = <ConnectLoadingSpinner label={t('connect.entityView.loading')} className="min-h-[240px]" />
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
    body = <p className="py-12 text-center text-sm text-hub-text-muted">{t('connect.entityView.noData')}</p>
  }

  return (
    <ConnectDrawer
      open={open}
      onClose={onClose}
      title={t(`connect.entityView.kinds.${kind}`)}
      subtitle={t('connect.entityView.subtitle')}
      width="2xl"
    >
      {body}
    </ConnectDrawer>
  )
}
