import { Filter, Pencil, Plus, Trash2, UserPlus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ConnectDrawer } from '../../components/connect/ConnectDrawer'
import { GridUserDetailDrawer } from '../../components/grid/GridUserDetailDrawer'
import { ConnectRowActionsMenu } from '../../components/connect/ConnectRowActionsMenu'
import { viewRowAction } from '../../components/connect/connectViewActions'
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
import { confirmDelete } from '../../utils/confirmAction'

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
      window.alert('Informe nome, e-mail e tipo de usuário.')
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
    if (!confirmDelete(`o usuário "${user.name}"`)) return
    await gridService.deleteUser(user.id)
    load()
  }

  const activeCount = users.filter((u) => u.status === 'active').length

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Usuários"
        subtitle="Gerencie os usuários do sistema por perfis e permissões."
        actions={
          <PrimaryButton onClick={openCreate}>
            <Plus className="h-4 w-4" /> Novo usuário
          </PrimaryButton>
        }
      />

      <div className="mb-6 grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
        ) : (
          <>
            <KpiCard icon={Users} label="Total" value={meta?.total ?? 0} variant="blue" to="/grid/usuarios" />
            <KpiCard icon={Users} label="Ativos (página)" value={activeCount} variant="green" />
            <KpiCard icon={Users} label="Técnicos" value={users.filter((u) => u.role.includes('Técnico')).length} variant="coral" />
            <KpiCard icon={Users} label="Gerentes" value={users.filter((u) => u.role.includes('Gerente')).length} variant="violet" />
          </>
        )}
      </div>

      <ConnectCard className="mb-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <input
            className={inputClass}
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => {
              setPage(1)
              setSearch(e.target.value)
            }}
          />
          <select className={selectClass} value={roleFilter} onChange={(e) => { setPage(1); setRoleFilter(e.target.value) }}>
            <option value="">Tipo de usuário</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select className={selectClass} value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value) }}>
            <option value="">Status</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
          <OutlineButton
            onClick={() => {
              setSearch('')
              setRoleFilter('')
              setStatusFilter('')
              setPage(1)
            }}
          >
            <Filter className="h-4 w-4" /> Limpar filtros
          </OutlineButton>
        </div>
      </ConnectCard>

      <ConnectCard>
        {loading ? (
          <ConnectLoadingSpinner label="Carregando usuários..." className="min-h-[280px]" />
        ) : (
          <>
            <ConnectTableScroll>
              <table className="w-full min-w-[960px] text-sm">
                <thead className="glass-thead text-hub-text-muted">
                  <tr>
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Nome</th>
                    <th className="px-4 py-3 text-left">E-mail institucional</th>
                    <th className="px-4 py-3 text-left">Telefone</th>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-left">Criação</th>
                    <th className="px-4 py-3 text-left">Atualização</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">CPF</th>
                    <th className="px-4 py-3">Ações</th>
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
                          ariaLabel={`Ações de ${u.name}`}
                          actions={[
                            viewRowAction(() => setDetailUserId(u.id)),
                            { key: 'edit', label: 'Editar', icon: Pencil, onClick: () => openEdit(u) },
                            { key: 'delete', label: 'Excluir', icon: Trash2, variant: 'danger', onClick: () => void handleDelete(u) },
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
        title={editingId ? 'Editar usuário' : 'Novo usuário'}
        subtitle="Preencha os dados do usuário do módulo Grid."
        footer={
          <>
            <OutlineButton onClick={() => setDrawerOpen(false)}>Cancelar</OutlineButton>
            <PrimaryButton onClick={() => void handleSave()} disabled={saving}>
              <UserPlus className="h-4 w-4" /> {saving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar usuário'}
            </PrimaryButton>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nome" required>
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Ana Costa" />
          </FormField>
          <FormField label="E-mail institucional" required>
            <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="usuario@senai.edu.br" />
          </FormField>
          <FormField label="Telefone">
            <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" />
          </FormField>
          <FormField label="Tipo de usuário" required>
            <select className={selectClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="">Selecione</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </FormField>
          <FormField label="CPF">
            <input className={inputClass} value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" />
          </FormField>
          <FormField label="Status">
            <select className={selectClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
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
