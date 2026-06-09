import { Eye, Filter, Pencil, Plus, Trash2, UserPlus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConnectDrawer } from '../../components/connect/ConnectDrawer'
import { GridUserDetailDrawer } from '../../components/grid/GridUserDetailDrawer'
import { ConnectRowActionsMenu } from '../../components/connect/ConnectRowActionsMenu'
import { KpiCard, KpiCardSkeleton } from '../../components/connect/ConnectKpiCard'
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
import { gridService } from '../../services/gridService'
import type { GridUser, PaginatedMeta } from '../../types/grid'

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  role: '',
  cpf: '',
  status: 'active',
}

const ROLES = ['Técnico de manutenção', 'Gerente de manutenção', 'Administrador', 'Professor', 'Secretaria']

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export function GridUsersPage() {
  const { t } = useTranslation()
  const [users, setUsers] = useState<GridUser[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | undefined>()
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [detailUserId, setDetailUserId] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    const params: Record<string, string | number> = { page, per_page: 10, search }
    if (roleFilter) params.role = roleFilter
    if (statusFilter) params.status = statusFilter

    gridService
      .getUsers(params)
      .then((res) => {
        setUsers(res.data)
        setMeta(res.meta)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page, search, roleFilter, statusFilter])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDrawerOpen(true)
  }

  const openEdit = (user: GridUser) => {
    setEditingId(user.id)
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      cpf: user.cpf,
      status: user.status,
    })
    setDrawerOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.role.trim()) {
      window.alert(t('grid.users.alert.required'))
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
        cpf: form.cpf.trim(),
        status: form.status,
      }
      if (editingId) {
        await gridService.updateUser(editingId, payload)
      } else {
        await gridService.createUser(payload)
      }
      setDrawerOpen(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (user: GridUser) => {
    if (!window.confirm(t('connect.confirm.delete', { entity: `o usuário "${user.name}"` }))) return
    await gridService.deleteUser(user.id)
    load()
  }

  const activeCount = users.filter((u) => u.status === 'active').length

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title={t('grid.users.title')}
        subtitle={t('grid.users.subtitle')}
        actions={
          <PrimaryButton onClick={openCreate}>
            <Plus className="h-4 w-4" /> {t('grid.users.new')}
          </PrimaryButton>
        }
      />

      <div className="mb-6 grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
        ) : (
          <>
            <KpiCard icon={Users} label={t('grid.users.kpis.total')} value={meta?.total ?? 0} variant="blue" to="/grid/usuarios" />
            <KpiCard icon={Users} label={t('grid.users.kpis.activePage')} value={activeCount} variant="green" />
            <KpiCard icon={Users} label={t('grid.users.kpis.technicians')} value={users.filter((u) => u.role.includes('Técnico')).length} variant="coral" />
            <KpiCard icon={Users} label={t('grid.users.kpis.managers')} value={users.filter((u) => u.role.includes('Gerente')).length} variant="violet" />
          </>
        )}
      </div>

      <ConnectCard className="mb-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <input
            className={inputClass}
            placeholder={t('grid.users.filters.searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setPage(1)
              setSearch(e.target.value)
            }}
          />
          <select className={selectClass} value={roleFilter} onChange={(e) => { setPage(1); setRoleFilter(e.target.value) }}>
            <option value="">{t('grid.users.filters.userType')}</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select className={selectClass} value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value) }}>
            <option value="">{t('connect.table.status')}</option>
            <option value="active">{t('connect.status.active')}</option>
            <option value="inactive">{t('connect.status.inactive')}</option>
          </select>
          <OutlineButton
            onClick={() => {
              setSearch('')
              setRoleFilter('')
              setStatusFilter('')
              setPage(1)
            }}
          >
            <Filter className="h-4 w-4" /> {t('connect.common.clearFilters')}
          </OutlineButton>
        </div>
      </ConnectCard>

      <ConnectCard>
        {loading ? (
          <ConnectLoadingSpinner label={t('grid.users.loading')} className="min-h-[280px]" />
        ) : (
          <>
            <ConnectTableScroll>
              <table className="w-full min-w-[960px] text-sm">
                <thead className="glass-thead text-hub-text-muted">
                  <tr>
                    <th className="px-4 py-3 text-left">{t('grid.users.table.id')}</th>
                    <th className="px-4 py-3 text-left">{t('connect.table.name')}</th>
                    <th className="px-4 py-3 text-left">{t('grid.users.table.institutionalEmail')}</th>
                    <th className="px-4 py-3 text-left">{t('grid.users.table.phone')}</th>
                    <th className="px-4 py-3 text-left">{t('grid.users.table.userType')}</th>
                    <th className="px-4 py-3 text-left">{t('grid.users.table.created')}</th>
                    <th className="px-4 py-3 text-left">{t('grid.users.table.updated')}</th>
                    <th className="px-4 py-3 text-left">{t('connect.table.status')}</th>
                    <th className="px-4 py-3 text-left">{t('grid.users.table.cpf')}</th>
                    <th className="px-4 py-3">{t('connect.common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="cursor-pointer border-t border-hub-border/40 transition hover:bg-hub-bg/50"
                      onClick={() => setDetailUserId(u.id)}
                    >
                      <td className="px-4 py-3">{u.id}</td>
                      <td className="px-4 py-3 font-medium">{u.name}</td>
                      <td className="px-4 py-3">{u.email}</td>
                      <td className="px-4 py-3">{u.phone}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">{formatDate(u.created_at)}</td>
                      <td className="px-4 py-3">{formatDate(u.updated_at)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={u.status} />
                      </td>
                      <td className="px-4 py-3">{u.cpf}</td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <ConnectRowActionsMenu
                          ariaLabel={t('connect.common.actionsOf', { name: u.name })}
                          actions={[
                            { key: 'view', label: t('connect.common.view'), icon: Eye, onClick: () => setDetailUserId(u.id) },
                            { key: 'edit', label: t('connect.common.edit'), icon: Pencil, onClick: () => openEdit(u) },
                            { key: 'delete', label: t('connect.common.delete'), icon: Trash2, variant: 'danger', onClick: () => void handleDelete(u) },
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
        onClose={() => setDrawerOpen(false)}
        title={editingId ? t('grid.users.drawer.edit') : t('grid.users.drawer.new')}
        footer={
          <>
            <OutlineButton onClick={() => setDrawerOpen(false)}>{t('common.cancel')}</OutlineButton>
            <PrimaryButton onClick={() => void handleSave()} disabled={saving}>
              <UserPlus className="h-4 w-4" /> {saving ? t('connect.common.saving') : editingId ? t('common.save') : t('grid.users.create')}
            </PrimaryButton>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t('connect.table.name')} required>
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormField>
          <FormField label={t('grid.users.table.institutionalEmail')} required>
            <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </FormField>
          <FormField label={t('grid.users.table.phone')}>
            <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </FormField>
          <FormField label={t('grid.users.filters.userType')} required>
            <select className={selectClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="">—</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </FormField>
          <FormField label={t('grid.users.table.cpf')}>
            <input className={inputClass} value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
          </FormField>
          <FormField label={t('connect.table.status')}>
            <select className={selectClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">{t('connect.status.active')}</option>
              <option value="inactive">{t('connect.status.inactive')}</option>
            </select>
          </FormField>
        </div>
      </ConnectDrawer>

      <GridUserDetailDrawer
        userId={detailUserId}
        open={detailUserId !== null}
        onClose={() => setDetailUserId(null)}
      />
    </div>
  )
}
