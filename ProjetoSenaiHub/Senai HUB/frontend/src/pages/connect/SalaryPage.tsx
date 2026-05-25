import { Download, MoreVertical } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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
import type { ConnectSalaryRecord, ConnectStudent, PaginatedMeta, SalaryCalculationResult } from '../../types/connect'

export function SalaryPage() {
  const [records, setRecords] = useState<ConnectSalaryRecord[]>([])
  const [students, setStudents] = useState<ConnectStudent[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | undefined>()
  const [page, setPage] = useState(1)
  const [selectedStudent, setSelectedStudent] = useState('')
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [result, setResult] = useState<SalaryCalculationResult | null>(null)
  const [loading, setLoading] = useState(true)

  const loadRecords = () => {
    setLoading(true)
    connectService
      .getSalaries({ page, per_page: 10, reference_month: month })
      .then((res) => {
        setRecords(res.data)
        setMeta(res.meta)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadRecords()
    connectService.getStudents({ per_page: 50 }).then((res) => setStudents(res.data))
  }, [page, month])

  const handleCalculate = async () => {
    if (!selectedStudent) return
    const calc = await connectService.calculateSalary({
      connect_student_id: Number(selectedStudent),
      reference_month: month,
    })
    setResult(calc)
    loadRecords()
  }

  const summary = useMemo(() => {
    const record = result?.data
    const attendance = result?.attendance
    const base = record?.base_amount ?? 0
    const deductions = record?.deductions ?? 0
    const final = record?.net_amount ?? 0
    const dailyRate = result?.daily_rate ?? (base > 0 ? base / 22 : 0)

    return { base, deductions, final, dailyRate, attendance, record }
  }, [result])

  const monthOptions = useMemo(() => {
    const options: { value: string; label: string }[] = []
    const now = new Date()
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) })
    }
    return options
  }, [])

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Salario"
        subtitle="Calcule e acompanhe o salario dos alunos aprendizes com base na frequencia e faltas."
        actions={
          <select className={selectClass} value={month} onChange={(e) => setMonth(e.target.value)}>
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        }
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <ConnectCard className="p-5">
          <FormField label="Selecionar aluno">
            <select className={selectClass} value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
              <option value="">Selecione um aluno</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}
                </option>
              ))}
            </select>
          </FormField>
          <div className="mt-4">
            <PrimaryButton onClick={handleCalculate}>Calcular salario</PrimaryButton>
          </div>
        </ConnectCard>
        <ConnectCard className="p-5">
          <p className="text-sm text-hub-text-muted">Frequencia do mes</p>
          <p className="text-3xl font-bold text-hub-navy">
            {summary.attendance ? `${summary.attendance.rate}%` : '-'}
          </p>
          {summary.attendance && (
            <>
              <p className="mt-2 text-sm text-amber-600">
                Faltas justificadas: {summary.attendance.justified_absences} dia(s)
              </p>
              <p className="text-sm text-red-600">
                Faltas injustificadas: {summary.attendance.unjustified_absences} dia(s)
              </p>
            </>
          )}
        </ConnectCard>
      </div>

      {summary.record && (
        <ConnectCard className="mb-6 p-5">
          <h3 className="mb-4 font-semibold text-hub-navy">Calculo do salario</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Salario base">
              <input className={inputClass} value={`R$ ${summary.base.toFixed(2)}`} readOnly />
            </FormField>
            <FormField label="Tipo de pagamento">
              <input className={inputClass} value="Mensal" readOnly />
            </FormField>
            <FormField label="Carga horaria">
              <input className={inputClass} value="8 horas" readOnly />
            </FormField>
            <FormField label="Frequencia automatica">
              <input
                className={inputClass}
                value={summary.attendance ? `${summary.attendance.rate}%` : '-'}
                readOnly
              />
            </FormField>
          </div>
          <div className="mt-4 rounded-xl bg-hub-bg p-4 text-sm">
            <div className="flex flex-wrap gap-6">
              <span>Valor por dia: R$ {summary.dailyRate.toFixed(2)}</span>
              <span>Desconto por faltas: R$ {summary.deductions.toFixed(2)}</span>
              <span className="font-bold text-emerald-600">Salario final: R$ {summary.final.toFixed(2)}</span>
            </div>
          </div>
        </ConnectCard>
      )}

      <ConnectCard>
        <div className="flex w-full min-w-0 flex-col gap-3 border-b border-hub-border/60 p-4 sm:flex-row sm:items-center [&_button]:w-full sm:[&_button]:w-auto">
          <input className={`${inputClass} min-w-0 flex-1 sm:max-w-xs`} placeholder="Pesquisar aluno..." />
          <OutlineButton>
            <Download className="h-4 w-4" />
            Exportar
          </OutlineButton>
        </div>
        {loading ? (
          <ConnectLoadingSpinner label="Carregando historico de salarios..." className="min-h-[280px]" />
        ) : (
        <>
        <ConnectTableScroll>
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-hub-bg/60 text-hub-text-muted">
              <tr>
                <th className="px-4 py-3 text-left">Aluno</th>
                <th className="px-4 py-3 text-left">Curso</th>
                <th className="px-4 py-3 text-left">Salario base</th>
                <th className="px-4 py-3 text-left">Salario final</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-t border-hub-border/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <UserAvatar name={record.student?.full_name} size="sm" />
                      {record.student?.full_name ?? '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3">{record.student?.class?.course?.name ?? '-'}</td>
                  <td className="px-4 py-3">R$ {record.base_amount.toFixed(2)}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-600">R$ {record.net_amount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={record.status} />
                  </td>
                  <td className="px-4 py-3">
                    <MoreVertical className="h-4 w-4" />
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
    </div>
  )
}
