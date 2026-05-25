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
  formatDate,
  inputClass,
  OutlineButton,
  PrimaryButton,
  selectClass,
  StatusBadge,
} from '../../components/connect/ConnectShared'
import { connectService } from '../../services/connectService'
import type { ConnectContract, ConnectStudent, PaginatedMeta } from '../../types/connect'

export function ContractsPage() {
  const [contracts, setContracts] = useState<ConnectContract[]>([])
  const [students, setStudents] = useState<ConnectStudent[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | undefined>()
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [form, setForm] = useState({
    connect_student_id: '',
    contract_type: 'aprendizagem',
    start_date: '',
    monthly_value: '',
    company_name: '',
    status: 'active',
  })

  const load = () => {
    setLoading(true)
    connectService
      .getContracts({ page, per_page: 10 })
      .then((res) => {
        setContracts(res.data)
        setMeta(res.meta)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    connectService.getStudents({ per_page: 50 }).then((res) => setStudents(res.data))
  }, [page])

  const handleSave = async () => {
    await connectService.createContract({
      connect_student_id: Number(form.connect_student_id),
      contract_type: form.contract_type,
      start_date: form.start_date,
      monthly_value: Number(form.monthly_value) || 0,
      company_name: form.company_name,
      status: form.status,
    })
    setDrawerOpen(false)
    load()
  }

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Contratos"
        subtitle="Gerencie os contratos de alunos e parceiros de forma integrada."
        actions={
          <>
            <OutlineButton><Filter className="h-4 w-4" /> Filtros</OutlineButton>
            <OutlineButton><Download className="h-4 w-4" /> Exportar</OutlineButton>
            <PrimaryButton onClick={() => setDrawerOpen(true)}><Plus className="h-4 w-4" /> Novo</PrimaryButton>
          </>
        }
      />

      <ConnectCard>
        {loading ? (
          <ConnectLoadingSpinner label="Carregando contratos..." className="min-h-[280px]" />
        ) : (
        <>
        <ConnectTableScroll>
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-hub-bg/60 text-hub-text-muted">
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
                  <td className="px-4 py-3">8 horas</td>
                  <td className="px-4 py-3">{contract.student?.class?.course?.name ?? '-'}</td>
                  <td className="px-4 py-3 font-medium">{contract.student?.full_name ?? '-'}</td>
                  <td className="px-4 py-3">{contract.company_name ?? '-'}</td>
                  <td className="px-4 py-3">{formatDate(contract.start_date)}</td>
                  <td className="px-4 py-3">R$ {contract.monthly_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3"><StatusBadge status={contract.status} /></td>
                  <td className="px-4 py-3"><MoreVertical className="h-4 w-4" /></td>
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
        onClose={() => setDrawerOpen(false)}
        title="Novo contrato de aluno"
        subtitle="Preencha os dados do contrato. O painel so aparece ao clicar em Novo."
        footer={
          <div className="flex justify-end gap-2">
            <OutlineButton onClick={() => setDrawerOpen(false)}>Cancelar</OutlineButton>
            <OutlineButton>Salvar e Novo</OutlineButton>
            <PrimaryButton onClick={handleSave}>Salvar</PrimaryButton>
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
            <select className={selectClass} defaultValue="8">
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
            <input type="email" className={inputClass} placeholder="aluno@email.com" />
          </FormField>
          <FormField label="E-mail institucional do aluno">
            <input type="email" className={inputClass} placeholder="aluno@empresa.com.br" />
          </FormField>
          <FormField label="E-mail da empresa">
            <input type="email" className={inputClass} placeholder="rh@empresa.com.br" />
          </FormField>
          <FormField label="Status do contrato">
            <select className={selectClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </FormField>
          <FormField label="Documentos digitalizados" required>
            <div className="rounded-xl border-2 border-dashed border-hub-border p-8 text-center">
              <p className="mb-3 text-sm text-hub-text-muted">Clique ou arraste arquivos PDF (máx. 10 MB)</p>
              <OutlineButton>Selecionar arquivos</OutlineButton>
            </div>
          </FormField>
        </div>
      </ConnectDrawer>
    </div>
  )
}
