import { Download, Eye, Filter, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConnectDrawer } from '../../components/connect/ConnectDrawer'
import { ConnectEntityViewDrawer } from '../../components/connect/ConnectEntityViewDrawer'
import { ConnectRowActionsMenu } from '../../components/connect/ConnectRowActionsMenu'
import {
  ConnectCard,
  ConnectPageHeader,
  ConnectLoadingSpinner,
  ConnectPagination,
  ConnectTableScroll,
  FormField,
  inputClass,
  OutlineButton,
  PrimaryButton,
  selectClass,
  StatusBadge,
} from '../../components/connect/ConnectShared'
import { UserAvatar } from '../../components/ui/UserAvatar'
import { connectService } from '../../services/connectService'
import type { ConnectTeacher, PaginatedMeta } from '../../types/connect'
import { downloadCsv } from '../../utils/csvExport'
import { parseApiError } from '../../utils/parseApiError'

const emptyTeacherForm = { full_name: '', email: '', specialty: '', cpf: '', phone: '', status: 'active' }

export function TeachersPage() {
  const { t } = useTranslation()
  const [teachers, setTeachers] = useState<ConnectTeacher[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | undefined>()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [specialtyFilter, setSpecialtyFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyTeacherForm)
  const [viewId, setViewId] = useState<number | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const specialties = useMemo(
    () => [...new Set(teachers.map((teacher) => teacher.specialty).filter(Boolean) as string[])].sort(),
    [teachers],
  )

  const load = () => {
    setLoading(true)
    const params: Record<string, string | number> = { page, search, per_page: 10 }
    if (statusFilter) params.status = statusFilter
    if (specialtyFilter) params.specialty = specialtyFilter
    connectService
      .getTeachers(params)
      .then((res) => {
        setTeachers(res.data)
        setMeta(res.meta)
        setSelectedIds(new Set())
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page, search, statusFilter, specialtyFilter])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyTeacherForm)
    setDrawerOpen(true)
  }

  const openEdit = (teacher: ConnectTeacher) => {
    setEditingId(teacher.id)
    setForm({
      full_name: teacher.full_name,
      email: teacher.email ?? '',
      specialty: teacher.specialty ?? '',
      cpf: teacher.cpf ?? '',
      phone: teacher.phone ?? '',
      status: teacher.status ?? 'active',
    })
    setDrawerOpen(true)
  }

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      window.alert(t('connect.teachers.alert.nameRequired'))
      return
    }

    try {
      if (editingId) {
        await connectService.updateTeacher(editingId, {
          ...form,
          full_name: form.full_name.trim(),
          email: form.email.trim() || undefined,
          specialty: form.specialty.trim() || undefined,
          cpf: form.cpf.trim() || undefined,
          phone: form.phone.trim() || undefined,
        })
      } else {
        await connectService.createTeacher({
          ...form,
          full_name: form.full_name.trim(),
          email: form.email.trim() || undefined,
          specialty: form.specialty.trim() || undefined,
          cpf: form.cpf.trim() || undefined,
          phone: form.phone.trim() || undefined,
        })
      }
      setDrawerOpen(false)
      setEditingId(null)
      load()
    } catch (error: unknown) {
      window.alert(parseApiError(error, 'Nao foi possivel salvar o professor.'))
    }
  }

  const handleExport = () => {
    downloadCsv(
      'professores',
      [
        t('connect.table.name'),
        t('connect.table.email'),
        t('connect.teachers.table.specialty'),
        t('connect.teachers.table.classes'),
        t('connect.table.status'),
      ],
      teachers.map((teacher) => [
        teacher.full_name,
        teacher.email,
        teacher.specialty ?? '-',
        teacher.classes_count ?? 0,
        teacher.status,
      ]),
    )
  }

  const handleDelete = async (teacher: ConnectTeacher) => {
    if (!window.confirm(t('connect.confirm.delete', { entity: `o professor "${teacher.full_name}"` }))) return
    try {
      await connectService.deleteTeacher(teacher.id)
      load()
    } catch (error: unknown) {
      window.alert(parseApiError(error, 'Nao foi possivel excluir o professor.'))
    }
  }

  const allSelected = teachers.length > 0 && teachers.every((teacher) => selectedIds.has(teacher.id))

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(teachers.map((teacher) => teacher.id)))
    }
  }

  const toggleOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title={t('connect.teachers.title')}
        subtitle={t('connect.teachers.subtitle')}
        actions={
          <>
            <OutlineButton onClick={handleExport}>
              <Download className="h-4 w-4" /> {t('connect.common.export')}
            </OutlineButton>
            <PrimaryButton onClick={openCreate}><Plus className="h-4 w-4" /> {t('connect.common.new')}</PrimaryButton>
          </>
        }
      />

      <ConnectCard className="mb-4 p-4">
        <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end [&_button]:w-full sm:[&_button]:w-auto">
          <input
            className={`${inputClass} min-w-0 flex-1 sm:min-w-[200px]`}
            placeholder={t('connect.teachers.searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setPage(1)
              setSearch(e.target.value)
            }}
          />
          <OutlineButton onClick={() => setShowFilters((v) => !v)}>
            <Filter className="h-4 w-4" /> {t('connect.common.filters')}
          </OutlineButton>
        </div>
        {showFilters && (
          <div className="mt-4 grid gap-4 border-t border-hub-border/60 pt-4 sm:grid-cols-2">
            <FormField label={t('connect.table.status')}>
              <select
                className={selectClass}
                value={statusFilter}
                onChange={(e) => {
                  setPage(1)
                  setStatusFilter(e.target.value)
                }}
              >
                <option value="">{t('connect.common.all')}</option>
                <option value="active">{t('connect.status.activePlural')}</option>
                <option value="inactive">{t('connect.status.inactivePlural')}</option>
              </select>
            </FormField>
            <FormField label={t('connect.teachers.filters.specialty')}>
              <select
                className={selectClass}
                value={specialtyFilter}
                onChange={(e) => {
                  setPage(1)
                  setSpecialtyFilter(e.target.value)
                }}
              >
                <option value="">{t('connect.teachers.filters.allSpecialties')}</option>
                {specialties.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </FormField>
          </div>
        )}
      </ConnectCard>

      <ConnectCard>
        {loading ? (
          <ConnectLoadingSpinner label={t('connect.teachers.loading')} className="min-h-[280px]" />
        ) : (
        <>
        <ConnectTableScroll>
          <table className="w-full min-w-[640px] text-sm">
            <thead className="glass-thead text-hub-text-muted">
              <tr>
                <th className="px-4 py-3">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label={t('connect.common.selectAll')} />
                </th>
                <th className="px-4 py-3 text-left">{t('connect.table.name')}</th>
                <th className="px-4 py-3 text-left">{t('connect.teachers.table.institutionalEmail')}</th>
                <th className="px-4 py-3 text-left">{t('connect.teachers.table.specialty')}</th>
                <th className="px-4 py-3 text-left">{t('connect.teachers.table.classes')}</th>
                <th className="px-4 py-3 text-left">{t('connect.table.status')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="border-t border-hub-border/40">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(teacher.id)}
                      onChange={() => toggleOne(teacher.id)}
                      aria-label={t('connect.common.selectItem', { name: teacher.full_name })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <UserAvatar name={teacher.full_name} size="sm" />
                      {teacher.full_name}
                    </div>
                  </td>
                  <td className="px-4 py-3">{teacher.email}</td>
                  <td className="px-4 py-3">{teacher.specialty ?? '-'}</td>
                  <td className="px-4 py-3">{teacher.classes_count ?? 0}</td>
                  <td className="px-4 py-3"><StatusBadge status={teacher.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <ConnectRowActionsMenu
                      ariaLabel={t('connect.common.actionsOf', { name: teacher.full_name })}
                      actions={[
                        { key: 'view', label: t('connect.common.view'), icon: Eye, onClick: () => setViewId(teacher.id) },
                        { key: 'edit', label: t('connect.common.edit'), icon: Pencil, onClick: () => openEdit(teacher) },
                        {
                          key: 'delete',
                          label: t('connect.common.delete'),
                          icon: Trash2,
                          variant: 'danger',
                          onClick: () => void handleDelete(teacher),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ConnectTableScroll>
        <ConnectPagination meta={meta} onPageChange={setPage} />
        </>
        )}
      </ConnectCard>

      <ConnectDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setEditingId(null)
        }}
        title={editingId ? t('connect.teachers.drawer.edit') : t('connect.teachers.drawer.new')}
        subtitle={editingId ? t('connect.teachers.drawer.editSubtitle') : t('connect.teachers.drawer.newSubtitle')}
        footer={
          <div className="flex justify-end gap-2">
            <OutlineButton onClick={() => setDrawerOpen(false)}>{t('common.cancel')}</OutlineButton>
            <PrimaryButton onClick={() => void handleSave()}>{t('common.save')}</PrimaryButton>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t('connect.teachers.form.fullName')} required>
            <input
              className={inputClass}
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Ex: João Santos"
            />
          </FormField>
          <FormField label={t('connect.teachers.form.institutionalEmail')} hint={t('connect.students.form.optional')}>
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="professor@senai.edu.br"
            />
          </FormField>
          <FormField label={t('connect.teachers.form.specialty')}>
            <input
              className={inputClass}
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              placeholder="Ex: Automação Industrial"
            />
          </FormField>
          <FormField label={t('connect.teachers.form.cpf')}>
            <input
              className={inputClass}
              value={form.cpf}
              onChange={(e) => setForm({ ...form, cpf: e.target.value })}
              placeholder="000.000.000-00"
            />
          </FormField>
          <FormField label={t('connect.teachers.form.phone')}>
            <input
              className={inputClass}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </FormField>
          <FormField label={t('connect.table.status')}>
            <select className={selectClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">{t('connect.status.active')}</option>
              <option value="inactive">{t('connect.status.inactive')}</option>
            </select>
          </FormField>
        </div>
      </ConnectDrawer>

      <ConnectEntityViewDrawer
        kind="teacher"
        entityId={viewId}
        open={viewId !== null}
        onClose={() => setViewId(null)}
      />
    </div>
  )
}
