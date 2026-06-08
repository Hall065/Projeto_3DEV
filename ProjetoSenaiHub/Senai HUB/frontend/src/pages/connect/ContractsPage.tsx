import { Download, Filter, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ConnectDrawer } from '../../components/connect/ConnectDrawer'
import { ConnectEntityViewDrawer } from '../../components/connect/ConnectEntityViewDrawer'
import { ConnectRowActionsMenu } from '../../components/connect/ConnectRowActionsMenu'
import { viewRowAction } from '../../components/connect/connectViewActions'
import {
  ConnectCard,
  ConnectPageHeader,
  ConnectLoadingSpinner,
  ConnectPagination,
  ConnectTableScroll,
  FormField,
  formatDate,
  inputClass,
  OutlineButton,
  PrimaryButton,
  selectClass,
  StatusBadge,
} from '../../components/connect/ConnectShared'
import { connectService } from '../../services/connectService'
import type { ConnectContract, ConnectStudent, PaginatedMeta } from '../../types/connect'
import { confirmDelete } from '../../utils/confirmAction'
import { downloadCsv } from '../../utils/csvExport'

const emptyContractForm = {
  connect_student_id: '',
  contract_type: 'aprendizagem',
  weekly_hours: '8',
  start_date: '',
  monthly_value: '',
  company_name: '',
  company_email: '',
  status: 'active',
}

export function ContractsPage() {
  const [contracts, setContracts] = useState<ConnectContract[]>([])
  const [students, setStudents] = useState<ConnectStudent[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | undefined>()
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyContractForm)
  const [viewId, setViewId] = useState<number | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterContractType, setFilterContractType] = useState('')

  const selectedStudent = useMemo(
    () => students.find((s) => String(s.id) === form.connect_student_id),
    [students, form.connect_student_id],
  )

  const load = () => {
    setLoading(true)
    const params: Record<string, string | number> = { page, per_page: 10 }
    if (filterStatus) params.status = filterStatus
    if (filterContractType) params.contract_type = filterContractType
    connectService
      .getContracts(params)
      .then((res) => {
        setContracts(res.data)
        setMeta(res.meta)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    connectService.getStudents({ per_page: 50 }).then((res) => setStudents(res.data))
  }, [page, filterStatus, filterContractType])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyContractForm)
    setDrawerOpen(true)
  }

  const openEdit = (contract: ConnectContract) => {
    setEditingId(contract.id)
    setForm({
      connect_student_id: String(contract.connect_student_id ?? contract.student?.id ?? ''),
      contract_type: contract.contract_type ?? 'aprendizagem',
      weekly_hours: String(contract.weekly_hours ?? 8),
      start_date: contract.start_date?.slice(0, 10) ?? '',
      monthly_value: String(contract.monthly_value ?? ''),
      company_name: contract.company_name ?? '',
      company_email: contract.company_email ?? '',
      status: contract.status ?? 'active',
    })
    setDrawerOpen(true)
  }

  const buildPayload = () => ({
    connect_student_id: Number(form.connect_student_id),
    contract_type: form.contract_type,
    weekly_hours: Number(form.weekly_hours) || undefined,
    start_date: form.start_date,
    monthly_value: Number(form.monthly_value) || 0,
    company_name: form.company_name,
    company_email: form.company_email.trim() || undefined,
    status: form.status,
  })

  const handleSave = async (keepOpen = false) => {
    const payload = buildPayload()
    if (editingId) {
      await connectService.updateContract(editingId, payload)
    } else {
      await connectService.createContract(payload)
    }
    if (keepOpen) {
      setEditingId(null)
      setForm(emptyContractForm)
    } else {
      setDrawerOpen(false)
      setEditingId(null)
    }
    load()
  }

  const handleExport = () => {
    downloadCsv(
      'contratos',
      ['Carga horaria', 'Curso', 'Aluno', 'Empresa', 'Inicio', 'Valor mensal', 'Status'],
      contracts.map((contract) => [
        contract.weekly_hours != null ? `${contract.weekly_hours} horas` : '-',
        contract.student?.class?.course?.name ?? '-',
        contract.student?.full_name ?? '-',
        contract.company_name ?? '-',
        formatDate(contract.start_date),
        contract.monthly_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        contract.status,
      ]),
    )
  }

  const handleDelete = async (contract: ConnectContract) => {
    const label = contract.student?.full_name ?? 'este contrato'
    if (!confirmDelete(`o contrato de ${label}`)) return
    await connectService.deleteContract(contract.id)
    load()
  }

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Contratos"
        subtitle="Gerencie os contratos de alunos e parceiros de forma integrada."
        actions={
          <>
            <OutlineButton onClick={() => setShowFilters((v) => !v)}>
              <Filter className="h-4 w-4" /> Filtros
            </OutlineButton>
            <OutlineButton onClick={handleExport}>
              <Download className="h-4 w-4" /> Exportar
            </OutlineButton>
            <PrimaryButton onClick={openCreate}><Plus className="h-4 w-4" /> Novo</PrimaryButton>
          </>
        }
      />

      {showFilters && (
        <ConnectCard className="mb-4 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Status">
              <select
                className={selectClass}
                value={filterStatus}
                onChange={(e) => {
                  setPage(1)
                  setFilterStatus(e.target.value)
                }}
              >
                <option value="">Todos os status</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="finished">Encerrado</option>
              </select>
            </FormField>
            <FormField label="Tipo de contrato">
              <select
                className={selectClass}
                value={filterContractType}
                onChange={(e) => {
                  setPage(1)
                  setFilterContractType(e.target.value)
                }}
              >
                <option value="">Todos os tipos</option>
                <option value="aprendizagem">Aprendizagem</option>
                <option value="estagio">Estágio</option>
                <option value="clt">CLT</option>
                <option value="temporario">Temporário</option>
              </select>
            </FormField>
          </div>
        </ConnectCard>
      )}

      <ConnectCard>
        {loading ? (
          <ConnectLoadingSpinner label="Carregando contratos..." className="min-h-[280px]" />
        ) : (
        <>
        <ConnectTableScroll>
          <table className="w-full min-w-[640px] text-sm">
            <thead className="glass-thead text-hub-text-muted">
              <tr>
                <th className="px-4 py-3 text-left">Carga horaria</th>
                <th className="px-4 py-3 text-left">Curso</th>
                <th className="px-4 py-3 text-left">Nome do aluno</th>
                <th className="px-4 py-3 text-left">Empresa</th>
                <th className="px-4 py-3 text-left">Inicio</th>
                <th className="px-4 py-3 text-left">Valor mensal</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <tr key={contract.id} className="border-t border-hub-border/40">
                  <td className="px-4 py-3">
                    {contract.weekly_hours != null ? `${contract.weekly_hours} horas` : '-'}
                  </td>
                  <td className="px-4 py-3">{contract.student?.class?.course?.name ?? '-'}</td>
                  <td className="px-4 py-3 font-medium">{contract.student?.full_name ?? '-'}</td>
                  <td className="px-4 py-3">{contract.company_name ?? '-'}</td>
                  <td className="px-4 py-3">{formatDate(contract.start_date)}</td>
                  <td className="px-4 py-3">R$ {contract.monthly_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3"><StatusBadge status={contract.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <ConnectRowActionsMenu
                      ariaLabel={`Ações do contrato de ${contract.student?.full_name ?? 'aluno'}`}
                      actions={[
                        viewRowAction(() => setViewId(contract.id)),
                        { key: 'edit', label: 'Editar', icon: Pencil, onClick: () => openEdit(contract) },
                        {
                          key: 'delete',
                          label: 'Excluir',
                          icon: Trash2,
                          variant: 'danger',
                          onClick: () => void handleDelete(contract),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ConnectTableScroll>
        <div className="flex flex-col gap-3 border-t border-hub-border/60 px-4 py-3 text-sm text-hub-text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>Total de registros: {meta?.total ?? 0}</span>
          <ConnectPagination meta={meta} onPageChange={setPage} />
        </div>
        </>
        )}
      </ConnectCard>

      <ConnectDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setEditingId(null)
        }}
        title={editingId ? 'Editar contrato' : 'Novo contrato de aluno'}
        subtitle={editingId ? 'Atualize os dados do contrato.' : 'Preencha os dados do contrato. O painel só aparece ao clicar em Novo.'}
        footer={
          <div className="flex justify-end gap-2">
            <OutlineButton onClick={() => setDrawerOpen(false)}>Cancelar</OutlineButton>
            <OutlineButton onClick={() => void handleSave(true)}>Salvar e Novo</OutlineButton>
            <PrimaryButton onClick={() => void handleSave()}>Salvar</PrimaryButton>
          </div>
        }
      >
        <div className="space-y-4">
          <h3 className="font-semibold text-hub-navy">Dados do contrato</h3>
          <FormField label="Nome completo do aluno" required>
            <select className={selectClass} value={form.connect_student_id} onChange={(e) => setForm({ ...form, connect_student_id: e.target.value })}>
              <option value="">Selecione o aluno</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </FormField>
          <FormField label="Nome da empresa" required>
            <input className={inputClass} value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} placeholder="Razão social da empresa" />
          </FormField>
          <FormField label="Tipo de contrato" required>
            <select className={selectClass} value={form.contract_type} onChange={(e) => setForm({ ...form, contract_type: e.target.value })}>
              <option value="aprendizagem">Aprendizagem</option>
              <option value="estagio">Estágio</option>
              <option value="clt">CLT</option>
              <option value="temporario">Temporário</option>
            </select>
          </FormField>
          <FormField label="Carga horária semanal">
            <select className={selectClass} value={form.weekly_hours} onChange={(e) => setForm({ ...form, weekly_hours: e.target.value })}>
              <option value="4">4 horas</option>
              <option value="6">6 horas</option>
              <option value="8">8 horas</option>
            </select>
          </FormField>
          <FormField label="Data de início do contrato" required hint="Clique para abrir o calendário">
            <input type="date" className={inputClass} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </FormField>
          <FormField label="Valor mensal (R$)">
            <input type="number" className={inputClass} value={form.monthly_value} onChange={(e) => setForm({ ...form, monthly_value: e.target.value })} placeholder="Ex: 1518.00" step="0.01" min={0} />
          </FormField>
          <FormField label="E-mail pessoal do aluno">
            <input
              type="email"
              className={`${inputClass} bg-hub-bg/60`}
              readOnly
              value={selectedStudent?.email ?? ''}
              placeholder={form.connect_student_id ? '-' : 'Selecione um aluno'}
            />
          </FormField>
          <FormField label="E-mail institucional do aluno">
            <input
              type="email"
              className={`${inputClass} bg-hub-bg/60`}
              readOnly
              value={selectedStudent?.hub_person?.email ?? selectedStudent?.email ?? ''}
              placeholder={form.connect_student_id ? '-' : 'Selecione um aluno'}
            />
          </FormField>
          <FormField label="E-mail da empresa">
            <input
              type="email"
              className={inputClass}
              value={form.company_email}
              onChange={(e) => setForm({ ...form, company_email: e.target.value })}
              placeholder="rh@empresa.com.br"
            />
          </FormField>
          <FormField label="Status do contrato">
            <select className={selectClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="finished">Encerrado</option>
            </select>
          </FormField>
          <p className="text-sm text-hub-text-muted">
            Anexos de documentos serão disponibilizados em versão futura.
          </p>
        </div>
      </ConnectDrawer>

      <ConnectEntityViewDrawer
        kind="contract"
        entityId={viewId}
        open={viewId !== null}
        onClose={() => setViewId(null)}
      />
    </div>
  )
}
