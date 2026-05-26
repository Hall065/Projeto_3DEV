import { Filter, Pencil, Plus, Trash2, UserPlus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ConnectDrawer } from '../../components/connect/ConnectDrawer'
import { ConnectEntityViewDrawer } from '../../components/connect/ConnectEntityViewDrawer'
import { ConnectRowActionsMenu } from '../../components/connect/ConnectRowActionsMenu'
import { viewRowAction } from '../../components/connect/connectViewActions'
import {
  ConnectCard,
  ConnectLoadingSpinner,
  ConnectPageHeader,
  ConnectPagination,
  ConnectTableScroll,
  FormField,
  inputClass,
  KpiCard,
  OutlineButton,
  PrimaryButton,
  selectClass,
  StatusBadge,
} from '../../components/connect/ConnectShared'
import { gridService } from '../../services/gridService'
import type { GridUser, PaginatedMeta } from '../../types/grid'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export function GridUsersPage() {
  const [users, setUsers] = useState<GridUser[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | undefined>()
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [viewSnapshot, setViewSnapshot] = useState<GridUser | null>(null)

  const load = () => {
    setLoading(true)
    gridService
      .getUsers({ page, per_page: 6, search })
      .then((res) => {
        setUsers(res.data)
        setMeta(res.meta)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page, search])

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Usuários"
        subtitle="Gerencie os usuários do sistema por perfis e permissões."
        actions={
          <PrimaryButton onClick={() => setDrawerOpen(true)}>
            <Plus className="h-4 w-4" /> Novo usuário
          </PrimaryButton>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Users} label="Professores cadastrados" value={128} />
        <KpiCard icon={Users} label="Usuários da secretaria" value={36} />
        <KpiCard icon={Users} label="Usuários da manutenção" value={36} />
        <KpiCard icon={Users} label="Gerentes de manutenção" value={8} />
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Users} label="Total de usuários" value={254} />
        <KpiCard icon={Users} label="Usuários ativos" value={224} />
        <KpiCard icon={Users} label="Usuários inativos" value={30} />
        <KpiCard icon={Users} label="Parceiros cadastrados" value={53} />
      </div>

      <ConnectCard className="mb-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <input
            className={inputClass}
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className={selectClass}>
            <option value="">Tipo de usuário</option>
            <option>Professor</option>
          </select>
          <select className={selectClass}>
            <option value="">Status</option>
            <option value="active">Ativo</option>
          </select>
          <input className={inputClass} placeholder="Digite o ID" />
          <OutlineButton onClick={() => setSearch('')}>
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
                <thead className="bg-hub-bg/60 text-hub-text-muted">
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
                    <tr key={u.id} className="border-t border-hub-border/40">
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
                      <td className="px-4 py-3 text-right">
                        <ConnectRowActionsMenu
                          ariaLabel={`Ações de ${u.name}`}
                          actions={[
                            viewRowAction(() => setViewSnapshot(u)),
                            {
                              key: 'edit',
                              label: 'Editar',
                              icon: Pencil,
                              onClick: () => window.alert(`Edição de "${u.name}" será disponibilizada em breve.`),
                            },
                            {
                              key: 'delete',
                              label: 'Excluir',
                              icon: Trash2,
                              variant: 'danger',
                              onClick: () => window.alert(`Exclusão de "${u.name}" será disponibilizada em breve.`),
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
        onClose={() => setDrawerOpen(false)}
        title="Novo usuário"
        subtitle="Preencha os dados para criar um novo usuário no sistema."
        footer={
          <>
            <OutlineButton onClick={() => setDrawerOpen(false)}>Cancelar</OutlineButton>
            <PrimaryButton onClick={() => setDrawerOpen(false)}>
              <UserPlus className="h-4 w-4" /> Criar usuário
            </PrimaryButton>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nome" required>
            <input className={inputClass} placeholder="Digite o nome completo" />
          </FormField>
          <FormField label="E-mail institucional" required>
            <input type="email" className={inputClass} placeholder="usuario@senai.br" />
          </FormField>
          <FormField label="Telefone" required>
            <input className={inputClass} placeholder="(11) 99999-9999" />
          </FormField>
          <FormField label="Senha" required>
            <input type="password" className={inputClass} placeholder="Digite uma senha segura" />
          </FormField>
          <FormField label="Tipo de usuário" required>
            <select className={selectClass}>
              <option value="">Selecione o tipo de usuário</option>
              <option>Professor</option>
              <option>Manutenção</option>
              <option>Gerente</option>
            </select>
          </FormField>
          <FormField label="Data de criação" hint="Preenchido automaticamente">
            <input className={inputClass} readOnly placeholder="Automático" />
          </FormField>
          <FormField label="Data de atualização" hint="Preenchido automaticamente">
            <input className={inputClass} readOnly placeholder="Automático" />
          </FormField>
          <FormField label="Status padrão" required>
            <select className={selectClass} defaultValue="active">
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </FormField>
          <FormField label="CPF" required>
            <input className={inputClass} placeholder="000.000.000-00" />
          </FormField>
        </div>
      </ConnectDrawer>

      <ConnectEntityViewDrawer
        kind="grid-user"
        entityId={null}
        open={viewSnapshot !== null}
        onClose={() => setViewSnapshot(null)}
        snapshot={viewSnapshot ?? undefined}
      />
    </div>
  )
}
