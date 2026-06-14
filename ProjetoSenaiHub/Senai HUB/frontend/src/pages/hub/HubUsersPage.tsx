import { Pencil, Plus, Trash2, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConnectRowActionsMenu } from '../../components/connect/ConnectRowActionsMenu'
import { viewRowAction } from '../../components/connect/connectViewActions'
import {
  ConnectCard,
  ConnectLoadingSpinner,
  ConnectPageHeader,
  ConnectTableScroll,
  FormField,
  inputClass,
  OutlineButton,
  PrimaryButton,
  selectClass,
} from '../../components/connect/ConnectShared'
import { HubUserDetailDrawer } from '../../components/hub/HubUserDetailDrawer'
import { UserAvatar } from '../../components/ui/UserAvatar'
import {
  adminService,
  type HubRoleOption,
  type NavPermissionOption,
  type NavPermissionsByModule,
} from '../../services/adminService'
import { useConfirmAction } from '../../hooks/useConfirmAction'
import { useCrudToast } from '../../hooks/useCrudToast'
import type { User } from '../../types/auth'
import { parseApiError } from '../../utils/parseApiError'

type ModuleChoice = '' | 'connect' | 'grid' | 'safe'

type FormState = {
  name: string
  email: string
  password: string
  module: ModuleChoice
  role: string
  company_name: string
  permissions: string[]
}

const emptyForm: FormState = {
  name: '',
  email: '',
  password: '',
  module: '',
  role: 'unassigned',
  company_name: '',
  permissions: [],
}

const ACCESS_KEYS = new Set(['connect.access', 'grid.access', 'safe.access'])

function withoutAccessKeys(permissions: string[]): string[] {
  return permissions.filter((p) => !ACCESS_KEYS.has(p))
}

function isPermissionActive(selected: string[], key: string): boolean {
  if (selected.includes(key)) return true

  const implied: Record<string, string[]> = {
    'connect.students.view': ['connect.students.manage'],
    'connect.teachers.view': ['connect.teachers.manage'],
    'connect.classes.view': ['connect.classes.manage'],
    'connect.courses.view': ['connect.courses.manage'],
    'connect.contracts.view': ['connect.contracts.manage', 'connect.contracts.view_own'],
    'connect.attendance.view': ['connect.attendance.manage', 'connect.attendance.view_own'],
    'connect.salary.view': ['connect.salary.view_own'],
    'grid.tickets.view': ['grid.tickets.manage', 'grid.tickets.update'],
    'grid.inventory.view': ['grid.inventory.manage'],
  }

  return (implied[key] ?? []).some((alt) => selected.includes(alt))
}

function groupNavPermissions(items: NavPermissionOption[]): { group: string; items: NavPermissionOption[] }[] {
  const groups = new Map<string, NavPermissionOption[]>()
  for (const item of items) {
    const list = groups.get(item.group) ?? []
    list.push(item)
    groups.set(item.group, list)
  }
  return Array.from(groups.entries()).map(([group, groupItems]) => ({ group, items: groupItems }))
}

export function HubUsersPage() {
  const { t } = useTranslation()
  const crudToast = useCrudToast()
  const { confirmAction } = useConfirmAction()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<HubRoleOption[]>([])
  const [navPermissions, setNavPermissions] = useState<NavPermissionsByModule | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [detailUserId, setDetailUserId] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    adminService
      .getUsers({ search, per_page: 50 })
      .then((res) => setUsers(res.data))
      .catch((err) => setError(parseApiError(err, t('hubUsers.errors.loadUsers'))))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    Promise.all([adminService.getRoles(), adminService.getNavPermissions()])
      .then(([rolesData, navData]) => {
        setRoles(rolesData.filter((r) => r.assignable))
        setNavPermissions(navData)
        load()
      })
      .catch((err) => setError(parseApiError(err, t('hubUsers.errors.loadRoles'))))
  }, [])

  useEffect(() => {
    const timer = setTimeout(load, 300)
    return () => clearTimeout(timer)
  }, [search])

  const moduleRoles = useMemo(
    () => roles.filter((role) => role.module === form.module),
    [roles, form.module],
  )

  const navOptions = form.module && navPermissions ? navPermissions[form.module] : []
  const permissionGroups = groupNavPermissions(navOptions)

  const applyRoleDefaults = (roleKey: string) => {
    const role = roles.find((r) => r.key === roleKey)
    setForm((prev) => ({
      ...prev,
      role: roleKey,
      permissions: withoutAccessKeys(role?.default_permissions ?? []),
    }))
  }

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setDrawerOpen(true)
  }

  const openEdit = async (user: User) => {
    setEditing(user)
    try {
      const detail = await adminService.getUser(user.id)
      const module = (
        detail.role_module === 'connect' || detail.role_module === 'grid' || detail.role_module === 'safe'
          ? detail.role_module
          : ''
      ) as ModuleChoice
      const effective = withoutAccessKeys(
        detail.custom_permissions?.length ? detail.custom_permissions : detail.default_permissions ?? detail.permissions ?? [],
      )
      setForm({
        name: user.name,
        email: user.email,
        password: '',
        module,
        role: user.role ?? 'unassigned',
        company_name: user.company_name ?? '',
        permissions: effective,
      })
      setDrawerOpen(true)
    } catch (err: unknown) {
      setError(parseApiError(err, t('hubUsers.errors.loadUser')))
    }
  }

  const togglePermission = (key: string) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter((p) => p !== key)
        : [...prev.permissions, key],
    }))
  }

  const handleModuleChange = (module: ModuleChoice) => {
    const firstRole = roles.find((r) => r.module === module)
    setForm((prev) => ({
      ...prev,
      module,
      role: firstRole?.key ?? 'unassigned',
      permissions: withoutAccessKeys(firstRole?.default_permissions ?? []),
      company_name: module === 'connect' ? prev.company_name : '',
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const role = form.module ? form.role : 'unassigned'
      const customPermissions = form.module && form.permissions.length > 0 ? form.permissions : undefined

      if (editing) {
        const payload: Parameters<typeof adminService.updateUser>[1] = {
          name: form.name,
          email: form.email,
          role,
          company_name: role === 'connect_empresa' ? form.company_name : null,
          custom_permissions: customPermissions ?? null,
        }
        if (form.password) {
          payload.password = form.password
        }
        await adminService.updateUser(editing.id, payload)
      } else {
        await adminService.createUser({
          name: form.name,
          email: form.email,
          password: form.password,
          role,
          company_name: role === 'connect_empresa' ? form.company_name : undefined,
          custom_permissions: customPermissions,
        })
      }
      setDrawerOpen(false)
      crudToast.notifySaved(!!editing)
      load()
    } catch (err: unknown) {
      crudToast.notifyError(err, t('hubUsers.errors.saveUser'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (user: User) => {
    if (!(await confirmAction({ message: t('hubUsers.confirmDelete', { name: user.name }), variant: 'danger' }))) return
    try {
      await adminService.deleteUser(user.id)
      crudToast.notifyDeleted()
      load()
    } catch (err: unknown) {
      crudToast.notifyError(err, t('hubUsers.errors.deleteUser'))
    }
  }

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title={t('hubUsers.title')}
        subtitle={t('hubUsers.subtitle')}
        actions={
          <PrimaryButton type="button" onClick={openCreate}>
            <Plus className="h-4 w-4" /> {t('hubUsers.newUser')}
          </PrimaryButton>
        }
      />

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <ConnectCard className="mb-4 p-4">
        <FormField label={t('common.search')}>
          <input
            className={inputClass}
            placeholder={t('hubUsers.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </FormField>
      </ConnectCard>

      <ConnectCard>
        {loading ? (
          <ConnectLoadingSpinner label={t('hubUsers.loadingUsers')} className="min-h-[240px]" />
        ) : (
          <ConnectTableScroll>
            <table className="w-full min-w-[640px] text-sm">
              <thead className="glass-thead text-hub-text-muted">
                <tr>
                  <th className="px-4 py-3 text-left">{t('connect.table.name')}</th>
                  <th className="px-4 py-3 text-left">{t('connect.table.email')}</th>
                  <th className="px-4 py-3 text-left">{t('common.role')}</th>
                  <th className="px-4 py-3 text-right">{t('connect.common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="cursor-pointer border-t border-hub-border/40 transition hover:bg-hub-bg/50"
                    onClick={() => setDetailUserId(user.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={user.name} avatarUrl={user.avatar_url} size="sm" />
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-hub-bg px-2.5 py-1 text-xs font-medium text-hub-navy">
                        {user.role_label ?? user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <ConnectRowActionsMenu
                        ariaLabel={t('connect.common.actionsOf', { name: user.name })}
                        actions={[
                          viewRowAction(() => setDetailUserId(user.id)),
                          { key: 'edit', label: t('connect.common.edit'), icon: Pencil, onClick: () => void openEdit(user) },
                          ...(!user.is_admin
                            ? [
                                {
                                  key: 'delete',
                                  label: t('connect.common.delete'),
                                  icon: Trash2,
                                  variant: 'danger' as const,
                                  onClick: () => void handleDelete(user),
                                },
                              ]
                            : []),
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ConnectTableScroll>
        )}
      </ConnectCard>

      <HubUserDetailDrawer userId={detailUserId} open={detailUserId !== null} onClose={() => setDetailUserId(null)} />

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="glass-panel-solid h-full w-full max-w-lg overflow-y-auto p-6 shadow-xl">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-hub-navy">
              <Users className="h-5 w-5" />
              {editing ? t('hubUsers.editUser') : t('hubUsers.newUser')}
            </h3>

            <div className="space-y-4">
              <section className="space-y-3">
                <h4 className="text-sm font-semibold text-hub-navy">{t('hubUsers.basicData')}</h4>
                <FormField label={t('hubUsers.fullName')}>
                  <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </FormField>
                <FormField label={t('connect.table.email')}>
                  <input
                    type="email"
                    className={inputClass}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </FormField>
                <FormField label={editing ? t('hubUsers.newPasswordOptional') : t('hubUsers.initialPassword')}>
                  <input
                    type="password"
                    className={inputClass}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </FormField>
              </section>

              <section className="space-y-3 border-t border-hub-border/40 pt-4">
                <h4 className="text-sm font-semibold text-hub-navy">{t('hubUsers.moduleAndRole')}</h4>
                <FormField label={t('hubUsers.accessModule')}>
                  <select
                    className={selectClass}
                    value={form.module}
                    onChange={(e) => handleModuleChange(e.target.value as ModuleChoice)}
                  >
                    <option value="">{t('hubUsers.noAccess')}</option>
                    <option value="connect">Connect</option>
                    <option value="grid">Grid</option>
                    <option value="safe">SAFE</option>
                  </select>
                </FormField>

                {form.module && (
                  <>
                    <FormField label={t('hubUsers.roleInModule')}>
                      <select
                        className={selectClass}
                        value={form.role}
                        onChange={(e) => applyRoleDefaults(e.target.value)}
                      >
                        {moduleRoles.map((role) => (
                          <option key={role.key} value={role.key}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-hub-text-muted">
                        {moduleRoles.find((r) => r.key === form.role)?.description}
                      </p>
                    </FormField>

                    {form.role === 'connect_empresa' && (
                      <FormField label={t('hubUsers.companyName')}>
                        <input
                          className={inputClass}
                          value={form.company_name}
                          onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                        />
                      </FormField>
                    )}
                  </>
                )}
              </section>

              {form.module && permissionGroups.length > 0 && (
                <section className="space-y-3 border-t border-hub-border/40 pt-4">
                  <div>
                    <h4 className="text-sm font-semibold text-hub-navy">{t('hubUsers.permissionsSection')}</h4>
                    <p className="mt-1 text-xs text-hub-text-muted">
                      {t('hubUsers.permissionsHint')}
                    </p>
                  </div>

                  {permissionGroups.map((group) => (
                    <div key={group.group} className="rounded-xl border border-hub-border/50 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-hub-text-muted">{group.group}</p>
                      <div className="space-y-2">
                        {group.items.map((item) => (
                          <label key={item.key} className="flex cursor-pointer items-center gap-2 text-sm text-hub-navy">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-hub-border"
                              checked={isPermissionActive(form.permissions, item.key)}
                              onChange={() => togglePermission(item.key)}
                            />
                            {item.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
              )}
            </div>

            <div className="mt-6 flex gap-2">
              <PrimaryButton type="button" onClick={handleSave} disabled={saving}>
                {saving ? t('connect.common.saving') : t('common.save')}
              </PrimaryButton>
              <OutlineButton type="button" onClick={() => setDrawerOpen(false)}>
                {t('common.cancel')}
              </OutlineButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
