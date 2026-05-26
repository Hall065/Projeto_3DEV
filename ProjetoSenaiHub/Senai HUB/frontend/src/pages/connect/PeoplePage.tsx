import { Pencil, Plus, Trash2 } from 'lucide-react'
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
  OutlineButton,
  PrimaryButton,
  selectClass,
  StatusBadge,
} from '../../components/connect/ConnectShared'
import { UserAvatar } from '../../components/ui/UserAvatar'
import { connectService } from '../../services/connectService'
import type { HubPerson, HubPersonKind, PaginatedMeta } from '../../types/connect'
import { hubPersonKindLabel, personDisplayName } from '../../utils/connectPerson'
import { confirmDelete } from '../../utils/confirmAction'

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
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (person: HubPerson) => {
    if (!confirmDelete(`"${personDisplayName(person)}"`)) return
    try {
      await connectService.deletePerson(person.id)
      load()
    } catch {
      window.alert('Não foi possível excluir. Esta pessoa pode ter perfil Connect vinculado.')
    }
  }

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Cadastro global de pessoas"
        subtitle="Alunos, professores, funcionários e demais perfis usados em todo o SENAI Hub."
        actions={
          <PrimaryButton onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nova pessoa
          </PrimaryButton>
        }
      />

      <ConnectCard className="mb-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField label="Buscar">
            <input
              className={inputClass}
              placeholder="Nome, e-mail, CPF ou matrícula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </FormField>
          <FormField label="Tipo">
            <select className={selectClass} value={kindFilter} onChange={(e) => setKindFilter(e.target.value)}>
              <option value="">Todos</option>
              <option value="student">Aluno</option>
              <option value="teacher">Professor</option>
              <option value="staff">Funcionário</option>
              <option value="other">Outro</option>
            </select>
          </FormField>
        </div>
        <div className="mt-4 flex justify-end">
          <OutlineButton onClick={() => { setSearch(''); setKindFilter('') }}>Limpar filtros</OutlineButton>
        </div>
      </ConnectCard>

      <ConnectCard>
        {loading ? (
          <ConnectLoadingSpinner label="Carregando pessoas..." className="min-h-[280px]" />
        ) : (
          <>
            <ConnectTableScroll>
              <table className="w-full min-w-[720px] text-sm">
                <thead className="glass-thead text-hub-text-muted">
                  <tr>
                    <th className="px-4 py-3 text-left">Nome</th>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-left">E-mail</th>
                    <th className="px-4 py-3 text-left">Matrícula / CPF</th>
                    <th className="px-4 py-3 text-left">Status</th>
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
                      <td className="px-4 py-3">{hubPersonKindLabel(person.kind)}</td>
                      <td className="px-4 py-3">{person.email ?? '—'}</td>
                      <td className="px-4 py-3">
                        {person.registration_number ?? person.cpf ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={person.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ConnectRowActionsMenu
                          ariaLabel={`Ações de ${personDisplayName(person)}`}
                          actions={[
                            viewRowAction(() => setViewId(person.id)),
                            { key: 'edit', label: 'Editar', icon: Pencil, onClick: () => openEdit(person) },
                            {
                              key: 'delete',
                              label: 'Excluir',
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
        title={editingId ? 'Editar pessoa' : 'Nova pessoa'}
        subtitle={
          editingId
            ? 'Atualize os dados no cadastro global.'
            : 'Cadastro no registro global (sem perfil Connect específico de aluno/professor).'
        }
        footer={
          <div className="flex justify-end gap-2">
            <OutlineButton onClick={() => setDrawerOpen(false)}>Cancelar</OutlineButton>
            <PrimaryButton onClick={() => void handleSave()} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </PrimaryButton>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Tipo" required>
            <select
              className={selectClass}
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value as HubPersonKind })}
            >
              <option value="staff">Funcionário</option>
              <option value="other">Outro</option>
              <option value="teacher">Professor</option>
              <option value="student">Aluno</option>
            </select>
          </FormField>
          <FormField label="Status">
            <select
              className={selectClass}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </FormField>
          <FormField label="Nome completo" required>
            <input
              className={inputClass}
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </FormField>
          <FormField label="E-mail">
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </FormField>
          <FormField label="Celular">
            <input
              className={inputClass}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </FormField>
          <FormField label="CPF">
            <input className={inputClass} value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
          </FormField>
          <FormField label="Matrícula / registro">
            <input
              className={inputClass}
              value={form.registration_number}
              onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
            />
          </FormField>
          <FormField label="Especialidade / função">
            <input
              className={inputClass}
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
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
