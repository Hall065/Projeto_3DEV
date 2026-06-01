import { Pencil, Plus, Trash2, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
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
import { adminService, type HubRoleOption } from '../../services/adminService'
import type { User } from '../../types/auth'

type FormState = {
  name: string
  email: string
  password: string
  role: string
  company_name: string
}

const emptyForm: FormState = {
  name: '',
  email: '',
  password: '',
  role: 'connect_aluno',
  company_name: '',
}

export function HubUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<HubRoleOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    adminService
      .getUsers({ search, per_page: 50 })
      .then((res) => setUsers(res.data))
      .catch(() => setError('Nao foi possivel carregar usuarios.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    Promise.all([adminService.getRoles()])
      .then(([rolesData]) => {
        setRoles(rolesData.filter((r) => r.assignable))
        load()
      })
      .catch(() => setError('Falha ao carregar perfis.'))
  }, [])

  useEffect(() => {
    const timer = setTimeout(load, 300)
    return () => clearTimeout(timer)
  }, [search])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, role: roles[0]?.key ?? 'connect_aluno' })
    setDrawerOpen(true)
  }

  const openEdit = (user: User) => {
    setEditing(user)
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role ?? 'connect_aluno',
      company_name: user.company_name ?? '',
    })
    setDrawerOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        const payload: Parameters<typeof adminService.updateUser>[1] = {
          name: form.name,
          email: form.email,
          role: form.role,
          company_name: form.role === 'connect_empresa' ? form.company_name : null,
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
          role: form.role,
          company_name: form.role === 'connect_empresa' ? form.company_name : undefined,
        })
      }
      setDrawerOpen(false)
      load()
    } catch {
      setError('Nao foi possivel salvar o usuario.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Excluir o usuario ${user.name}?`)) return
    try {
      await adminService.deleteUser(user.id)
      load()
    } catch {
      setError('Nao foi possivel excluir o usuario.')
    }
  }

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Usuarios e perfis de acesso"
        subtitle="Crie contas e atribua o cargo (Professor, Secretaria, Aluno, Chefe de manutencao, etc.)."
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
                  <tr key={user.id} className="border-t border-hub-border/40">
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-hub-bg px-2.5 py-1 text-xs font-medium text-hub-navy">
                        {user.role_label ?? user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <OutlineButton type="button" onClick={() => openEdit(user)}>
                          <Pencil className="h-4 w-4" />
                        </OutlineButton>
                        {!user.is_admin && (
                          <button
                            type="button"
                            onClick={() => handleDelete(user)}
                            className="rounded-lg border border-red-200 px-3 py-2 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ConnectTableScroll>
        )}
      </ConnectCard>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-hub-navy">
              <Users className="h-5 w-5" />
              {editing ? 'Editar usuario' : 'Novo usuario'}
            </h3>

            <div className="space-y-3">
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
              <FormField label="Perfil de acesso">
                <select className={selectClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {roles.map((role) => (
                    <option key={role.key} value={role.key}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-hub-text-muted">
                  {roles.find((r) => r.key === form.role)?.description}
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
