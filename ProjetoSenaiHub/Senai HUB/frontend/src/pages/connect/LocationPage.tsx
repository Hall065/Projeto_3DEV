import { Filter, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ConnectDrawer } from '../../components/connect/ConnectDrawer'
import {
  ConnectCard,
  ConnectPageHeader,
  ConnectLoadingSpinner,
  ConnectPagination,
  ConnectTableScroll,
  formatDateTime,
  inputClass,
  OutlineButton,
  StatusBadge,
} from '../../components/connect/ConnectShared'
import { UserAvatar } from '../../components/ui/UserAvatar'
import { connectService } from '../../services/connectService'
import type { ConnectStudentLocation, PaginatedMeta } from '../../types/connect'

export function LocationPage() {
  const [locations, setLocations] = useState<ConnectStudentLocation[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | undefined>()
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<ConnectStudentLocation | null>(null)
  const [tab, setTab] = useState<'mapa' | 'info'>('mapa')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    connectService
      .getLocations({ page, per_page: 10 })
      .then((res) => {
        setLocations(res.data)
        setMeta(res.meta)
      })
      .finally(() => setLoading(false))
  }, [page])

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Localizacao"
        subtitle="Localize aulas, professores e salas de aula dentro do perimetro do SENAI."
      />

      <ConnectCard className="mb-4 p-4">
        <div className="mb-4 flex flex-wrap gap-3 border-b border-hub-border/60 pb-3 text-sm sm:gap-4">
          {['Cursos', 'Alunos', 'Professores', 'Turmas'].map((t, i) => (
            <button key={t} type="button" className={i === 1 ? 'border-b-2 border-hub-red font-semibold text-hub-red' : 'text-hub-text-muted'}>{t}</button>
          ))}
        </div>
        <div className="mb-4 flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-end [&_button]:w-full sm:[&_button]:w-auto">
          <input className={`${inputClass} min-w-0 flex-1`} placeholder="Buscar aluno..." />
          <OutlineButton><Filter className="h-4 w-4" /> Filtros</OutlineButton>
        </div>
        {loading ? (
          <ConnectLoadingSpinner label="Carregando localizacoes..." className="min-h-[280px]" />
        ) : (
        <>
        <ConnectTableScroll>
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-hub-bg/60 text-hub-text-muted">
              <tr>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">E-mail institucional</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Em aula?</th>
                <th className="px-4 py-3 text-left">Dentro do perimetro?</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {locations.map((loc) => (
                <tr key={loc.id} className="border-t border-hub-border/40">
                  <td className="px-4 py-3">{loc.student?.full_name ?? '-'}</td>
                  <td className="px-4 py-3">{loc.student?.email ?? '-'}</td>
                  <td className="px-4 py-3"><StatusBadge status={loc.status} /></td>
                  <td className="px-4 py-3">{loc.status === 'inside' ? 'Sim' : 'Nao'}</td>
                  <td className="px-4 py-3">{loc.status === 'inside' ? 'Sim' : 'Nao'}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => setSelected(loc)} disabled={loc.status !== 'inside'} className="disabled:opacity-40">
                      <MapPin className="h-4 w-4 text-hub-red" />
                    </button>
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

      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        O botao Ver localizacao funciona apenas quando o aluno estiver dentro do perimetro do SENAI.
      </div>

      <ConnectDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Localizacao do aluno"
      >
        {selected && (
          <>
            <div className="mb-4 flex items-center gap-3">
              <UserAvatar name={selected.student?.full_name} size="md" />
              <div>
                <p className="font-semibold text-hub-navy">{selected.student?.full_name}</p>
                <p className="text-sm text-hub-text-muted">{selected.student?.email}</p>
                <p className="text-sm text-hub-text-muted">Turma: {selected.student?.class?.name ?? '-'}</p>
              </div>
            </div>
            <div className="mb-4 flex gap-4 text-sm">
              <button type="button" onClick={() => setTab('mapa')} className={tab === 'mapa' ? 'border-b-2 border-hub-red font-semibold text-hub-red' : ''}>Mapa do campus</button>
              <button type="button" onClick={() => setTab('info')} className={tab === 'info' ? 'border-b-2 border-hub-red font-semibold text-hub-red' : ''}>Informacoes</button>
            </div>
            {tab === 'mapa' ? (
              <div className="mb-4 flex h-64 items-center justify-center rounded-xl bg-hub-bg text-hub-text-muted">
                Mapa do campus (em breve)
              </div>
            ) : (
              <ul className="space-y-2 text-sm">
                <li><strong>Endereco:</strong> {selected.address ?? 'Sala 201 - Bloco D'}</li>
                <li><strong>Cidade:</strong> {selected.city ?? 'Sao Paulo'} - {selected.state ?? 'SP'}</li>
              </ul>
            )}
            <p className="mt-4 text-xs text-hub-text-muted">Ultima atualizacao: {formatDateTime(selected.last_seen_at)}</p>
          </>
        )}
      </ConnectDrawer>
    </div>
  )
}
