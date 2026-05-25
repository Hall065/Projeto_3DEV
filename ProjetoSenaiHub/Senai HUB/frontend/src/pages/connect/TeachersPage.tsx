import { Download, Filter, MoreVertical, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ConnectDrawer } from '../../components/connect/ConnectDrawer'
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

export function TeachersPage() {
  const [teachers, setTeachers] = useState<ConnectTeacher[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | undefined>()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', specialty: '', cpf: '', phone: '', status: 'active' })

  const load = () => {
    setLoading(true)
    connectService
      .getTeachers({ page, search, per_page: 10 })
      .then((res) => {
        setTeachers(res.data)
        setMeta(res.meta)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page, search])

  const handleSave = async () => {
    await connectService.createTeacher(form)
    setDrawerOpen(false)
    load()
  }

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Gerenciamento de professores"
        subtitle="Cadastre, edite e acompanhe as informacoes dos professores."
        actions={
          <>
            <OutlineButton><Download className="h-4 w-4" /> Exportar</OutlineButton>
            <PrimaryButton onClick={() => setDrawerOpen(true)}><Plus className="h-4 w-4" /> Novo</PrimaryButton>
          </>
        }
      />

      <ConnectCard className="mb-4 p-4">
        <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end [&_button]:w-full sm:[&_button]:w-auto">
          <input
            className={`${inputClass} min-w-0 flex-1 sm:min-w-[200px]`}
            placeholder="Buscar por nome, e-mail ou CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className={`${selectClass} w-full sm:w-40`}><option value="active">Ativos</option><option value="inactive">Inativos</option><option value="">Todos</option></select>
          <select className={`${selectClass} w-full sm:w-40`}><option value="">Todas as especialidades</option></select>
          <OutlineButton><Filter className="h-4 w-4" /> Filtros</OutlineButton>
        </div>
      </ConnectCard>

      <ConnectCard>
        {loading ? (
          <ConnectLoadingSpinner label="Carregando professores..." className="min-h-[280px]" />
        ) : (
        <>
        <ConnectTableScroll>
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-hub-bg/60 text-hub-text-muted">
              <tr>
                <th className="px-4 py-3" />
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">E-mail institucional</th>
                <th className="px-4 py-3 text-left">Especialidade</th>
                <th className="px-4 py-3 text-left">Turmas</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="border-t border-hub-border/40">
                  <td className="px-4 py-3"><input type="checkbox" /></td>
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
                  <td className="px-4 py-3"><MoreVertical className="h-4 w-4" /></td>
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
        title="Novo professor"
        subtitle="Preencha os dados para cadastrar o novo professor."
        footer={
          <div className="flex justify-end gap-2">
            <OutlineButton onClick={() => setDrawerOpen(false)}>Cancelar</OutlineButton>
            <PrimaryButton onClick={handleSave}>Salvar</PrimaryButton>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nome completo" required>
            <input
              className={inputClass}
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Ex: João Santos"
            />
          </FormField>
          <FormField label="E-mail institucional" required>
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="professor@senai.edu.br"
            />
          </FormField>
          <FormField label="Especialidade">
            <input
              className={inputClass}
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              placeholder="Ex: Automação Industrial"
            />
          </FormField>
          <FormField label="CPF">
            <input
              className={inputClass}
              value={form.cpf}
              onChange={(e) => setForm({ ...form, cpf: e.target.value })}
              placeholder="000.000.000-00"
            />
          </FormField>
          <FormField label="Celular">
            <input
              className={inputClass}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </FormField>
          <FormField label="Status">
            <select className={selectClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </FormField>
        </div>
      </ConnectDrawer>
    </div>
  )
}
