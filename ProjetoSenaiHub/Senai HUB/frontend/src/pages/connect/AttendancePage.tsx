import { Download, Pencil, Save } from 'lucide-react'
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
import { connectService } from '../../services/connectService'
import type { ConnectAttendanceMark, ConnectAttendanceSession, ConnectClass } from '../../types/connect'

type MarkStatus = 'present' | 'justified' | 'absent'

const statusMap: Record<MarkStatus, string> = { present: 'P', justified: 'FJ', absent: 'FI' }
const apiStatus: Record<MarkStatus, string> = { present: 'present', justified: 'justified', absent: 'absent' }

export function AttendancePage() {
  const [classes, setClasses] = useState<ConnectClass[]>([])
  const [classId, setClassId] = useState('')
  const [session, setSession] = useState<ConnectAttendanceSession | null>(null)
  const [marks, setMarks] = useState<Record<number, MarkStatus>>({})
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [lessons, setLessons] = useState(2)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    connectService.getClasses({ per_page: 50 }).then((r) => setClasses(r.data))
  }, [])

  useEffect(() => {
    if (!classId) {
      setSession(null)
      setMarks({})
      setLoading(false)
      return
    }
    setLoading(true)
    connectService
      .getAttendanceSession({ connect_class_id: classId, session_date: date })
      .then((data) => {
        setSession(data)
        const initial: Record<number, MarkStatus> = {}
        data.marks?.forEach((mark) => {
          const status = mark.status === 'justified' ? 'justified' : mark.status === 'absent' ? 'absent' : 'present'
          initial[mark.connect_student_id] = status
        })
        setMarks(initial)
      })
      .finally(() => setLoading(false))
  }, [classId, date])

  const setAllPresent = () => {
    const next: Record<number, MarkStatus> = {}
    session?.marks?.forEach((m) => { next[m.connect_student_id] = 'present' })
    setMarks(next)
  }

  const handleSave = async () => {
    if (!session) return
    const payload = Object.entries(marks).map(([studentId, status]) => ({
      connect_student_id: Number(studentId),
      status: apiStatus[status],
    }))
    await connectService.saveAttendanceMarks(session.id, payload)
  }

  const renderMarkButtons = (studentId: number) => (
    <div className="flex gap-1">
      {(['present', 'justified', 'absent'] as MarkStatus[]).map((status) => (
        <button
          key={status}
          type="button"
          onClick={() => setMarks({ ...marks, [studentId]: status })}
          className={`h-7 w-7 rounded text-xs font-bold ${
            marks[studentId] === status
              ? status === 'present'
                ? 'bg-emerald-500 text-white'
                : status === 'justified'
                  ? 'bg-amber-500 text-white'
                  : 'border-2 border-red-500 text-red-600'
              : 'bg-hub-bg text-hub-text-muted'
          }`}
        >
          {statusMap[status]}
        </button>
      ))}
    </div>
  )

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Frequencia"
        subtitle="Lancar e gerenciar frequencia dos alunos."
        actions={
          <>
            <OutlineButton><Download className="h-4 w-4" /> Exportar</OutlineButton>
            <OutlineButton><Pencil className="h-4 w-4" /> Editar</OutlineButton>
            <PrimaryButton onClick={handleSave}><Save className="h-4 w-4" /> Salvar</PrimaryButton>
          </>
        }
      />

      <ConnectCard className="mb-4 p-4">
        <h3 className="mb-4 font-semibold text-hub-navy">Registrar frequencia</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Turma">
            <select className={selectClass} value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Selecione a turma</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>
          <FormField label="Data">
            <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
          </FormField>
          <FormField label="Quantidade de aulas dadas">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setLessons(n)} className={`h-9 w-9 rounded-lg border ${lessons === n ? 'border-hub-red text-hub-red' : 'border-hub-border'}`}>{n}</button>
              ))}
            </div>
          </FormField>
          <div className="flex items-end">
            <PrimaryButton onClick={setAllPresent}>Todos Presentes</PrimaryButton>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-hub-text-muted sm:gap-4">
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" /> P Presente</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-500" /> FJ Falta Justificada</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-red-500" /> FI Falta Injustificada</span>
        </div>
      </ConnectCard>

      <ConnectCard>
        {loading ? (
          <ConnectLoadingSpinner label="Carregando lista de frequencia..." className="min-h-[280px]" />
        ) : !classId ? (
          <p className="px-4 py-12 text-center text-sm text-hub-text-muted sm:px-6">
            Selecione uma turma e a data para carregar os alunos.
          </p>
        ) : (
        <ConnectTableScroll>
          <table className="w-full min-w-[560px] text-sm">
            <thead className="glass-thead text-hub-text-muted">
              <tr>
                <th className="px-4 py-3 text-left">No</th>
                <th className="px-4 py-3 text-left">Aluno</th>
                <th className="px-4 py-3 text-left">Aulas do dia - Pre Intervalo</th>
                <th className="px-4 py-3 text-left">Aulas do dia - Pos Intervalo</th>
              </tr>
            </thead>
            <tbody>
              {session?.marks?.map((mark: ConnectAttendanceMark, index: number) => (
                <tr key={mark.id} className="border-t border-hub-border/40">
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3">{mark.student?.full_name ?? '-'}</td>
                  <td className="px-4 py-3">{renderMarkButtons(mark.connect_student_id)}</td>
                  <td className="px-4 py-3">{renderMarkButtons(mark.connect_student_id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ConnectTableScroll>
        )}
      </ConnectCard>
    </div>
  )
}
