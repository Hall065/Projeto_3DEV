import {
  Calculator,
  CircleDollarSign,
  Download,
  MinusCircle,
  PlusCircle,
  RefreshCw,
  Search,
  TrendingDown,
  Users,
  Wallet,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ConnectEntityViewDrawer } from '../../components/connect/ConnectEntityViewDrawer'
import { ConnectRowActionsMenu } from '../../components/connect/ConnectRowActionsMenu'
import { viewRowAction } from '../../components/connect/connectViewActions'
import { KpiCard } from '../../components/connect/ConnectKpiCard'
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
import { usePermissions } from '../../hooks/usePermissions'
import { connectService } from '../../services/connectService'
import type {
  ConnectSalaryRecord,
  ConnectStudent,
  PaginatedMeta,
  SalaryListSummary,
  SalaryPreviewData,
} from '../../types/connect'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function formatBRL(value: number) {
  return brl.format(value)
}

function formatMonthLabel(value: string) {
  const [year, month] = value.split('-').map(Number)
  if (!year || !month) return value
  const label = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function formatMonthShort(value: string) {
  const [year, month] = value.split('-').map(Number)
  if (!year || !month) return value
  return new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

function exportSalariesCsv(records: ConnectSalaryRecord[], month: string) {
  const header = ['Aluno', 'Matricula', 'Curso', 'Mes', 'Base', 'Bonus', 'Descontos', 'Liquido', 'Status']
  const rows = records.map((r) => [
    r.student?.full_name ?? '',
    r.student?.registration_number ?? '',
    r.student?.class?.course?.name ?? '',
    r.reference_month,
    r.base_amount.toFixed(2),
    r.bonuses.toFixed(2),
    r.deductions.toFixed(2),
    r.net_amount.toFixed(2),
    r.status_label ?? r.status,
  ])
  const csv = [header, ...rows].map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `salarios-connect-${month}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function AttendanceBreakdown({ preview }: { preview: SalaryPreviewData }) {
  const { attendance } = preview
  const total = Math.max(attendance.total_days, 1)
  const presentPct = (attendance.present_days / total) * 100
  const justifiedPct = (attendance.justified_absences / total) * 100
  const absentPct = (attendance.unjustified_absences / total) * 100

  return (
    <div className="space-y-3">
      <div className="flex h-3 overflow-hidden rounded-full bg-hub-bg">
        <div className="bg-emerald-500 transition-all" style={{ width: `${presentPct}%` }} title="Presencas" />
        <div className="bg-amber-400 transition-all" style={{ width: `${justifiedPct}%` }} title="Faltas justificadas" />
        <div className="bg-red-500 transition-all" style={{ width: `${absentPct}%` }} title="Faltas injustificadas" />
      </div>
      <div className="grid gap-2 text-sm sm:grid-cols-4">
        <span className="text-emerald-700">{attendance.present_days} presenca(s)</span>
        <span className="text-amber-700">{attendance.justified_absences} FJ</span>
        <span className="text-red-700">{attendance.unjustified_absences} FI</span>
        <span className="font-semibold text-hub-navy">{attendance.rate}% no mes</span>
      </div>
    </div>
  )
}

export function SalaryPage() {
  const { isAdmin, role } = usePermissions()
  const isStudentView = role === 'connect_aluno'
  const isCompanyView = role === 'connect_empresa'
  const canCalculate = isAdmin

  const [records, setRecords] = useState<ConnectSalaryRecord[]>([])
  const [students, setStudents] = useState<ConnectStudent[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | undefined>()
  const [summary, setSummary] = useState<SalaryListSummary | undefined>()
  const [page, setPage] = useState(1)
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [studentFilter, setStudentFilter] = useState('')

  const [selectedStudent, setSelectedStudent] = useState('')
  const [bonuses, setBonuses] = useState('0')
  const [deductions, setDeductions] = useState('')
  const [useAutoDeductions, setUseAutoDeductions] = useState(true)
  const [preview, setPreview] = useState<SalaryPreviewData | null>(null)

  const [loading, setLoading] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [batching, setBatching] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [viewSnapshot, setViewSnapshot] = useState<ConnectSalaryRecord | null>(null)

  const loadRecords = useCallback(() => {
    setLoading(true)
    setError(null)
    connectService
      .getSalaries({
        page,
        per_page: 10,
        reference_month: month,
        ...(search ? { search } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(studentFilter ? { connect_student_id: studentFilter } : {}),
      })
      .then((res) => {
        setRecords(res.data)
        setMeta(res.meta)
        setSummary(res.summary)
      })
      .catch(() => setError('Nao foi possivel carregar os registros de salario.'))
      .finally(() => setLoading(false))
  }, [page, month, search, statusFilter, studentFilter])

  useEffect(() => {
    loadRecords()
  }, [loadRecords])

  useEffect(() => {
    setLoadingStudents(true)
    connectService
      .getStudents({ per_page: 100 })
      .then((res) => {
        setStudents(res.data)
        if (isStudentView && res.data.length === 1) {
          setSelectedStudent(String(res.data[0].id))
          setStudentFilter(String(res.data[0].id))
        }
      })
      .finally(() => setLoadingStudents(false))
  }, [isStudentView])

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    setPreview(null)
  }, [selectedStudent, month, bonuses, deductions, useAutoDeductions])

  const monthOptions = useMemo(() => {
    const options: { value: string; label: string }[] = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      options.push({ value, label: formatMonthLabel(value) })
    }
    return options
  }, [])

  const selectedStudentData = students.find((s) => String(s.id) === selectedStudent)

  const handlePreview = async () => {
    if (!selectedStudent) {
      setError('Selecione um aluno para simular o salario.')
      return
    }
    setPreviewing(true)
    setError(null)
    setSuccess(null)
    try {
      const data = await connectService.previewSalary({
        connect_student_id: Number(selectedStudent),
        reference_month: month,
        bonuses: Number(bonuses) || 0,
        ...(useAutoDeductions ? {} : { deductions: Number(deductions) || 0 }),
      })
      setPreview(data)
      if (useAutoDeductions) {
        setDeductions(String(data.amounts.deductions))
      }
    } catch {
      setError('Nao foi possivel simular o salario.')
    } finally {
      setPreviewing(false)
    }
  }

  const handleCalculate = async () => {
    if (!selectedStudent) return
    setCalculating(true)
    setError(null)
    try {
      await connectService.calculateSalary({
        connect_student_id: Number(selectedStudent),
        reference_month: month,
        bonuses: Number(bonuses) || 0,
        deductions: Number(deductions) || 0,
      })
      setSuccess('Salario calculado e salvo com sucesso.')
      setPreview(null)
      loadRecords()
    } catch {
      setError('Nao foi possivel calcular o salario.')
    } finally {
      setCalculating(false)
    }
  }

  const handleBatchCalculate = async () => {
    if (!window.confirm(`Calcular salario de todos os alunos para ${formatMonthLabel(month)}?`)) return
    setBatching(true)
    setError(null)
    try {
      const res = await connectService.calculateSalaryBatch(month)
      setSuccess(res.message)
      loadRecords()
    } catch {
      setError('Nao foi possivel calcular em lote.')
    } finally {
      setBatching(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await connectService.getSalaries({
        reference_month: month,
        per_page: 500,
        ...(search ? { search } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(studentFilter ? { connect_student_id: studentFilter } : {}),
      })
      exportSalariesCsv(res.data, month)
    } catch {
      setError('Nao foi possivel exportar os dados.')
    } finally {
      setExporting(false)
    }
  }

  const subtitle = isStudentView
    ? 'Acompanhe sua remuneracao de aprendiz com base na frequencia do mes.'
    : isCompanyView
      ? 'Consulte a remuneracao dos alunos vinculados a sua empresa.'
      : 'Calcule, simule e acompanhe a remuneracao dos aprendizes com base em contratos e frequencia.'

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Salario"
        subtitle={subtitle}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select className={selectClass} value={month} onChange={(e) => { setMonth(e.target.value); setPage(1) }}>
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {canCalculate && (
              <OutlineButton type="button" onClick={handleBatchCalculate} disabled={batching}>
                <RefreshCw className={`h-4 w-4 ${batching ? 'animate-spin' : ''}`} />
                {batching ? 'Calculando...' : 'Calcular todos'}
              </OutlineButton>
            )}
          </div>
        }
      />

      {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      {success && <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{success}</p>}

      {summary && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard icon={Users} label="Registros no mes" value={summary.total_records} variant="blue" />
          <KpiCard icon={Wallet} label="Folha base" value={formatBRL(summary.total_base)} variant="senai" />
          <KpiCard icon={CircleDollarSign} label="Total liquido" value={formatBRL(summary.total_net)} variant="green" />
          <KpiCard icon={TrendingDown} label="Descontos" value={formatBRL(summary.total_deductions)} variant="amber" />
        </div>
      )}

      {canCalculate && (
        <div className="mb-6 grid gap-4 xl:grid-cols-5">
          <ConnectCard className="space-y-4 p-5 xl:col-span-2">
            <h3 className="font-semibold text-hub-navy">Simulador de salario</h3>
            <FormField label="Aluno aprendiz">
              <select
                className={selectClass}
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                disabled={loadingStudents}
              >
                <option value="">Selecione um aluno</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} {s.registration_number ? `(${s.registration_number})` : ''}
                  </option>
                ))}
              </select>
            </FormField>

            {selectedStudentData && (
              <div className="rounded-xl bg-hub-bg/80 px-4 py-3 text-sm text-hub-text-muted">
                <p><span className="font-medium text-hub-navy">Turma:</span> {selectedStudentData.class?.name ?? '-'}</p>
                <p><span className="font-medium text-hub-navy">Curso:</span> {selectedStudentData.class?.course?.name ?? '-'}</p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Bonificacoes (R$)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputClass}
                  value={bonuses}
                  onChange={(e) => setBonuses(e.target.value)}
                />
              </FormField>
              <FormField label="Descontos (R$)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputClass}
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  disabled={useAutoDeductions}
                />
              </FormField>
            </div>

            <label className="flex items-center gap-2 text-sm text-hub-navy">
              <input
                type="checkbox"
                checked={useAutoDeductions}
                onChange={(e) => setUseAutoDeductions(e.target.checked)}
                className="h-4 w-4 rounded border-hub-border"
              />
              Descontar faltas injustificadas automaticamente (22 dias uteis)
            </label>

            <div className="flex flex-wrap gap-2">
              <OutlineButton type="button" onClick={handlePreview} disabled={previewing || !selectedStudent}>
                <Calculator className="h-4 w-4" />
                {previewing ? 'Simulando...' : 'Simular'}
              </OutlineButton>
              <PrimaryButton type="button" onClick={handleCalculate} disabled={calculating || !selectedStudent || !preview}>
                {calculating ? 'Salvando...' : 'Confirmar calculo'}
              </PrimaryButton>
            </div>
          </ConnectCard>

          <ConnectCard className="p-5 xl:col-span-3">
            {!preview ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center text-center text-sm text-hub-text-muted">
                <Calculator className="mb-3 h-10 w-10 opacity-40" />
                <p>Selecione um aluno e clique em <strong>Simular</strong> para ver o detalhamento antes de salvar.</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-hub-navy">{preview.student.full_name}</h3>
                    <p className="text-sm text-hub-text-muted">
                      {formatMonthLabel(month)}
                      {preview.contract ? ` · ${preview.contract.company_name}` : ' · Sem contrato ativo (valor padrao)'}
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600">{formatBRL(preview.amounts.net)}</p>
                </div>

                <AttendanceBreakdown preview={preview} />

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-hub-bg px-4 py-3">
                    <p className="text-xs text-hub-text-muted">Valor/dia</p>
                    <p className="font-semibold text-hub-navy">{formatBRL(preview.daily_rate)}</p>
                  </div>
                  <div className="rounded-xl bg-hub-bg px-4 py-3">
                    <p className="text-xs text-hub-text-muted">Base contrato</p>
                    <p className="font-semibold text-hub-navy">{formatBRL(preview.amounts.base)}</p>
                  </div>
                  <div className="rounded-xl bg-hub-bg px-4 py-3">
                    <p className="text-xs text-hub-text-muted">Desconto faltas</p>
                    <p className="font-semibold text-red-600">{formatBRL(preview.amounts.absence_deduction)}</p>
                  </div>
                </div>

                <div className="space-y-2 rounded-xl border border-hub-border/50 p-4">
                  {preview.breakdown.map((line) => (
                    <div key={line.label} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-hub-text-muted">
                        {line.type === 'bonus' && <PlusCircle className="h-4 w-4 text-emerald-600" />}
                        {line.type === 'deduction' && <MinusCircle className="h-4 w-4 text-red-500" />}
                        {line.label}
                      </span>
                      <span className={`font-medium ${line.type === 'net' ? 'text-emerald-600' : line.value < 0 ? 'text-red-600' : 'text-hub-navy'}`}>
                        {formatBRL(Math.abs(line.value))}
                        {line.value < 0 ? ' (-)' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ConnectCard>
        </div>
      )}

      <ConnectCard>
        <div className="flex w-full min-w-0 flex-col gap-3 border-b border-hub-border/60 p-4 lg:flex-row lg:items-end">
          <div className="min-w-0 flex-1">
            <FormField label="Buscar aluno">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-hub-text-muted" />
                <input
                  className={`${inputClass} pl-9`}
                  placeholder="Nome ou matricula..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
            </FormField>
          </div>
          {!isStudentView && (
            <FormField label="Filtrar aluno">
              <select className={selectClass} value={studentFilter} onChange={(e) => { setStudentFilter(e.target.value); setPage(1) }}>
                <option value="">Todos</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            </FormField>
          )}
          <FormField label="Status">
            <select className={selectClass} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
              <option value="">Todos</option>
              <option value="calculated">Calculado</option>
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
            </select>
          </FormField>
          <OutlineButton type="button" onClick={handleExport} disabled={exporting}>
            <Download className="h-4 w-4" />
            {exporting ? 'Exportando...' : 'Exportar CSV'}
          </OutlineButton>
        </div>

        {loading ? (
          <ConnectLoadingSpinner label="Carregando historico de salarios..." className="min-h-[280px]" />
        ) : records.length === 0 ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center p-8 text-center text-sm text-hub-text-muted">
            <Wallet className="mb-3 h-10 w-10 opacity-40" />
            <p>Nenhum registro de salario para {formatMonthLabel(month)}.</p>
            {canCalculate && <p className="mt-1">Use o simulador acima ou &quot;Calcular todos&quot; para gerar os registros.</p>}
          </div>
        ) : (
          <>
            <ConnectTableScroll>
              <table className="w-full min-w-[900px] text-sm">
                <thead className="glass-thead text-hub-text-muted">
                  <tr>
                    <th className="px-4 py-3 text-left">Aluno</th>
                    <th className="px-4 py-3 text-left">Referencia</th>
                    <th className="px-4 py-3 text-left">Curso</th>
                    <th className="px-4 py-3 text-right">Base</th>
                    <th className="px-4 py-3 text-right">Bonus</th>
                    <th className="px-4 py-3 text-right">Descontos</th>
                    <th className="px-4 py-3 text-right">Liquido</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr
                      key={record.id}
                      className="cursor-pointer border-t border-hub-border/40 transition hover:bg-hub-bg/40"
                      onClick={() => setViewSnapshot(record)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <UserAvatar name={record.student?.full_name} size="sm" />
                          <div>
                            <p className="font-medium text-hub-navy">{record.student?.full_name ?? '-'}</p>
                            <p className="text-xs text-hub-text-muted">{record.student?.registration_number ?? ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{formatMonthShort(record.reference_month)}</td>
                      <td className="px-4 py-3">{record.student?.class?.course?.name ?? '-'}</td>
                      <td className="px-4 py-3 text-right">{formatBRL(record.base_amount)}</td>
                      <td className="px-4 py-3 text-right text-emerald-700">{formatBRL(record.bonuses)}</td>
                      <td className="px-4 py-3 text-right text-red-600">{formatBRL(record.deductions)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600">{formatBRL(record.net_amount)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={record.status_label ?? record.status} />
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <ConnectRowActionsMenu
                          ariaLabel={`Acoes do salario de ${record.student?.full_name ?? 'aluno'}`}
                          actions={[
                            viewRowAction(() => setViewSnapshot(record)),
                            ...(canCalculate
                              ? [
                                  {
                                    key: 'recalc',
                                    label: 'Recalcular',
                                    icon: Calculator,
                                    onClick: () => {
                                      if (record.connect_student_id) {
                                        setSelectedStudent(String(record.connect_student_id))
                                        setMonth(record.reference_month?.slice(0, 7) ?? month)
                                        setBonuses(String(record.bonuses))
                                        setDeductions(String(record.deductions))
                                        setUseAutoDeductions(false)
                                        setPreview(null)
                                        window.scrollTo({ top: 0, behavior: 'smooth' })
                                      }
                                    },
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
            <ConnectPagination meta={meta} onPageChange={setPage} />
          </>
        )}
      </ConnectCard>

      <ConnectEntityViewDrawer
        kind="salary"
        entityId={null}
        open={viewSnapshot !== null}
        onClose={() => setViewSnapshot(null)}
        snapshot={viewSnapshot ?? undefined}
      />
    </div>
  )
}
