import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConnectDrawer } from '../../components/connect/ConnectDrawer'
import { ConnectEntityViewDrawer } from '../../components/connect/ConnectEntityViewDrawer'
import { ConnectRowActionsMenu } from '../../components/connect/ConnectRowActionsMenu'
import {
  ConnectCard,
  ConnectLoadingSpinner,
  ConnectPageHeader,
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
import type { HubPerson, HubPersonKind, PaginatedMeta } from '../../types/connect'
import { personDisplayName } from '../../utils/connectPerson'
import { parseApiError } from '../../utils/parseApiError'

const emptyForm = {
  kind: 'staff' as HubPersonKind,
  full_name: '',
  email: '',
  phone: '',
  cpf: '',
  registration_number: '',
  specialty: '',
  status: 'active',
}

export function PeoplePage() {
  const { t } = useTranslation()
  const [people, setPeople] = useState<HubPerson[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | undefined>()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [kindFilter, setKindFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [viewId, setViewId] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    const params: Record<string, string | number> = { page, per_page: 15, search }
    if (kindFilter) params.kind = kindFilter
    connectService
      .getPeople(params)
      .then((res) => {
        setPeople(res.data)
        setMeta(res.meta)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page, search, kindFilter])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDrawerOpen(true)
  }

  const openEdit = (person: HubPerson) => {
    setEditingId(person.id)
    setForm({
      kind: person.kind,
      full_name: person.full_name,
      email: person.email ?? '',
      phone: person.phone ?? '',
      cpf: person.cpf ?? '',
      registration_number: person.registration_number ?? '',
      specialty: person.specialty ?? '',
      status: person.status ?? 'active',
    })
    setDrawerOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editingId) {
        await connectService.updatePerson(editingId, form)
      } else {
        await connectService.createPerson(form)
      }
      setDrawerOpen(false)
      setEditingId(null)
      setForm(emptyForm)
      load()
    } catch (error: unknown) {
      window.alert(parseApiError(error, 'Nao foi possivel salvar a pessoa.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (person: HubPerson) => {
    if (!window.confirm(t('connect.confirm.delete', { entity: `"${personDisplayName(person)}"` }))) return
    try {
      await connectService.deletePerson(person.id)
      load()
    } catch (error: unknown) {
      window.alert(parseApiError(error, t('connect.people.alert.deleteLinked')))
    }
  }

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title={t('connect.people.title')}
        subtitle={t('connect.people.subtitle')}
        actions={
          <PrimaryButton onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t('connect.people.newPerson')}
          </PrimaryButton>
        }
      />

      <ConnectCard className="mb-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField label={t('common.search')}>
            <input
              className={inputClass}
              placeholder={t('connect.people.filters.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </FormField>
          <FormField label={t('connect.table.type')}>
            <select className={selectClass} value={kindFilter} onChange={(e) => setKindFilter(e.target.value)}>
              <option value="">{t('connect.common.all')}</option>
              <option value="student">{t('connect.personKind.student')}</option>
              <option value="teacher">{t('connect.personKind.teacher')}</option>
              <option value="staff">{t('connect.personKind.staff')}</option>
              <option value="other">{t('connect.personKind.other')}</option>
            </select>
          </FormField>
        </div>
        <div className="mt-4 flex justify-end">
          <OutlineButton onClick={() => { setSearch(''); setKindFilter('') }}>{t('connect.common.clearFilters')}</OutlineButton>
        </div>
      </ConnectCard>

      <ConnectCard>
        {loading ? (
          <ConnectLoadingSpinner label={t('connect.people.loading')} className="min-h-[280px]" />
        ) : (
          <>
            <ConnectTableScroll>
              <table className="w-full min-w-[720px] text-sm">
                <thead className="glass-thead text-hub-text-muted">
                  <tr>
                    <th className="px-4 py-3 text-left">{t('connect.table.name')}</th>
                    <th className="px-4 py-3 text-left">{t('connect.table.type')}</th>
                    <th className="px-4 py-3 text-left">{t('connect.table.email')}</th>
                    <th className="px-4 py-3 text-left">{t('connect.people.table.registrationCpf')}</th>
                    <th className="px-4 py-3 text-left">{t('connect.table.status')}</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {people.map((person) => (
                    <tr key={person.id} className="border-t border-hub-border/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <UserAvatar name={personDisplayName(person)} size="sm" />
                          <span className="font-medium">{personDisplayName(person)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{t(`connect.personKind.${person.kind}`)}</td>
                      <td className="px-4 py-3">{person.email ?? '—'}</td>
                      <td className="px-4 py-3">
                        {person.registration_number ?? person.cpf ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={person.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ConnectRowActionsMenu
                          ariaLabel={t('connect.common.actionsOf', { name: personDisplayName(person) })}
                          actions={[
                            { key: 'view', label: t('connect.common.view'), icon: Eye, onClick: () => setViewId(person.id) },
                            { key: 'edit', label: t('connect.common.edit'), icon: Pencil, onClick: () => openEdit(person) },
                            {
                              key: 'delete',
                              label: t('connect.common.delete'),
                              icon: Trash2,
                              variant: 'danger',
                              onClick: () => void handleDelete(person),
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
        title={editingId ? t('connect.people.drawer.edit') : t('connect.people.drawer.new')}
        subtitle={
          editingId
            ? t('connect.people.drawer.editSubtitle')
            : t('connect.people.drawer.newSubtitle')
        }
        footer={
          <div className="flex justify-end gap-2">
            <OutlineButton onClick={() => setDrawerOpen(false)}>{t('common.cancel')}</OutlineButton>
            <PrimaryButton onClick={() => void handleSave()} disabled={saving}>
              {saving ? t('connect.common.saving') : t('common.save')}
            </PrimaryButton>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t('connect.table.type')} required>
            <select
              className={selectClass}
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value as HubPersonKind })}
            >
              <option value="staff">{t('connect.personKind.staff')}</option>
              <option value="other">{t('connect.personKind.other')}</option>
              <option value="teacher">{t('connect.personKind.teacher')}</option>
              <option value="student">{t('connect.personKind.student')}</option>
            </select>
          </FormField>
          <FormField label={t('connect.table.status')}>
            <select
              className={selectClass}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="active">{t('connect.status.active')}</option>
              <option value="inactive">{t('connect.status.inactive')}</option>
            </select>
          </FormField>
          <FormField label={t('connect.students.form.fullName')} required>
            <input
              className={inputClass}
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Ex: Maria Silva"
            />
          </FormField>
          <FormField label={t('connect.table.email')}>
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="pessoa@senai.edu.br"
            />
          </FormField>
          <FormField label={t('connect.students.form.phone')}>
            <input
              className={inputClass}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </FormField>
          <FormField label={t('connect.students.form.cpf')}>
            <input className={inputClass} value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" />
          </FormField>
          <FormField label={t('connect.people.form.registration')}>
            <input
              className={inputClass}
              value={form.registration_number}
              onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
              placeholder="Ex: RM20250130"
            />
          </FormField>
          <FormField label={t('connect.people.form.specialty')}>
            <input
              className={inputClass}
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              placeholder="Ex: Automação Industrial"
            />
          </FormField>
        </div>
      </ConnectDrawer>

      <ConnectEntityViewDrawer
        kind="person"
        entityId={viewId}
        open={viewId !== null}
        onClose={() => setViewId(null)}
      />
    </div>
  )
}
