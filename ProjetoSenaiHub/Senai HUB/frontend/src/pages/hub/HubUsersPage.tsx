import { Pencil, Plus, Trash2, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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
import type { User } from '../../types/auth'
import { parseApiError } from '../../utils/parseApiError'

type ModuleChoice = '' | 'connect' | 'grid'

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

const ACCESS_KEYS = new Set(['connect.access', 'grid.access'])

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
      .catch((err) => setError(parseApiError(err, 'Nao foi possivel carregar usuarios.')))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    Promise.all([adminService.getRoles(), adminService.getNavPermissions()])
      .then(([rolesData, navData]) => {
        setRoles(rolesData.filter((r) => r.assignable))
        setNavPermissions(navData)
        load()
      })
      .catch((err) => setError(parseApiError(err, 'Falha ao carregar perfis.')))
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
      const module = (detail.role_module === 'connect' || detail.role_module === 'grid' ? detail.role_module : '') as ModuleChoice
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
      setError(parseApiError(err, 'Nao foi possivel carregar os dados do usuario.'))
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
      load()
    } catch (err: unknown) {
      setError(parseApiError(err, 'Nao foi possivel salvar o usuario.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Excluir o usuario ${user.name}?`)) return
    try {
      await adminService.deleteUser(user.id)
      load()
    } catch (err: unknown) {
      setError(parseApiError(err, 'Nao foi possivel excluir o usuario.'))
    }
  }

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Usuarios e perfis de acesso"
        subtitle="Crie contas sem acesso e configure modulo, perfil e abas liberadas."
        actions={
          <PrimaryButton type="button" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Novo usuario
          </PrimaryButton>
        }
      />

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <ConnectCard className="mb-4 p-4">
        <FormField label="Buscar">
          <input
            className={inputClass}
            placeholder="Nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </FormField>
      </ConnectCard>

      <ConnectCard>
        {loading ? (
          <ConnectLoadingSpinner label="Carregando usuarios..." className="min-h-[240px]" />
        ) : (
          <ConnectTableScroll>
            <table className="w-full min-w-[640px] text-sm">
              <thead className="glass-thead text-hub-text-muted">
                <tr>
                  <th className="px-4 py-3 text-left">Nome</th>
                  <th className="px-4 py-3 text-left">E-mail</th>
                  <th className="px-4 py-3 text-left">Perfil</th>
                  <th className="px-4 py-3 text-right">Acoes</th>
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
                        ariaLabel={`Ações de ${user.name}`}
                        actions={[
                          viewRowAction(() => setDetailUserId(user.id)),
                          { key: 'edit', label: 'Editar', icon: Pencil, onClick: () => void openEdit(user) },
                          ...(!user.is_admin
                            ? [
                                {
                                  key: 'delete',
                                  label: 'Excluir',
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
              {editing ? 'Editar usuario' : 'Novo usuario'}
            </h3>

            <div className="space-y-4">
              <section className="space-y-3">
                <h4 className="text-sm font-semibold text-hub-navy">Dados basicos</h4>
                <FormField label="Nome completo">
                  <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </FormField>
                <FormField label="E-mail">
                  <input
                    type="email"
                    className={inputClass}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </FormField>
                <FormField label={editing ? 'Nova senha (opcional)' : 'Senha inicial'}>
                  <input
                    type="password"
                    className={inputClass}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </FormField>
              </section>

              <section className="space-y-3 border-t border-hub-border/40 pt-4">
                <h4 className="text-sm font-semibold text-hub-navy">Modulo e perfil</h4>
                <FormField label="Modulo de acesso">
                  <select
                    className={selectClass}
                    value={form.module}
                    onChange={(e) => handleModuleChange(e.target.value as ModuleChoice)}
                  >
                    <option value="">Nenhum (sem acesso)</option>
                    <option value="connect">Connect</option>
                    <option value="grid">Grid</option>
                  </select>
                </FormField>

                {form.module && (
                  <>
                    <FormField label="Perfil no modulo">
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
                      <FormField label="Nome da empresa">
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
                    <h4 className="text-sm font-semibold text-hub-navy">Abas e permissoes</h4>
                    <p className="mt-1 text-xs text-hub-text-muted">
                      Marque somente o que este usuario pode ver. Os dados exibidos respeitam o escopo do perfil.
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
                {saving ? 'Salvando...' : 'Salvar'}
              </PrimaryButton>
              <OutlineButton type="button" onClick={() => setDrawerOpen(false)}>
                Cancelar
              </OutlineButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
