import { useTranslation } from 'react-i18next'
import { Check, Eye, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ConnectCard,
  ConnectLoadingSpinner,
  ConnectPageHeader,
  ConnectPagination,
  ConnectTableScroll,
  formatDateTime,
  OutlineButton,
  PrimaryButton,
} from '../../components/connect/ConnectShared'
import { safeService } from '../../services/safeService'
import type { PaginatedMeta, SafeAuthorization } from '../../types/safe'
import { parseApiError } from '../../utils/parseApiError'

export function SafeApprovalsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [items, setItems] = useState<SafeAuthorization[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | undefined>()
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    safeService
      .getTeacherQueue({ page, per_page: 10 })
      .then((res) => {
        setItems(res.data)
        setMeta(res.meta)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page])

  const handleApprove = async (id: number) => {
    setActingId(id)
    try {
      await safeService.approveByTeacher(id)
      load()
    } catch (e: unknown) {
      window.alert(parseApiError(e))
    } finally {
      setActingId(null)
    }
  }

  const handleDeny = async (id: number) => {
    if (!window.confirm('Negar esta solicitação?')) return
    setActingId(id)
    try {
      await safeService.denyByTeacher(id)
      load()
    } catch (e: unknown) {
      window.alert(parseApiError(e))
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title={t('safe.approvals.title')}
        subtitle={t('safe.approvals.subtitle')}
      />

      <ConnectCard className="min-w-0 overflow-hidden">
        {loading ? (
          <ConnectLoadingSpinner />
        ) : items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-hub-text-muted sm:px-6">Nenhuma solicitação pendente.</p>
        ) : (
          <ConnectTableScroll>
            <table className="w-full min-w-[800px] text-sm">
              <thead className="glass-thead text-hub-text-muted">
                <tr>
                  <th className="px-4 py-3 text-left sm:px-6">Protocolo</th>
                  <th className="px-4 py-3 text-left sm:px-6">Aluno</th>
                  <th className="px-4 py-3 text-left sm:px-6">Tipo</th>
                  <th className="px-4 py-3 text-left sm:px-6">Motivo</th>
                  <th className="px-4 py-3 text-left sm:px-6">Agendado</th>
                  <th className="px-4 py-3 text-right sm:px-6">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((auth) => (
                  <tr key={auth.id} className="border-t border-hub-border/40">
                    <td className="px-4 py-3 font-medium text-hub-red sm:px-6">{auth.protocol}</td>
                    <td className="px-4 py-3 sm:px-6">{auth.student_name}</td>
                    <td className="px-4 py-3 sm:px-6">{auth.type_label}</td>
                    <td className="max-w-[180px] truncate px-4 py-3 sm:px-6" title={auth.reason}>
                      {auth.reason}
                    </td>
                    <td className="px-4 py-3 sm:px-6">{formatDateTime(auth.scheduled_at)}</td>
                    <td className="px-4 py-3 sm:px-6">
                      <div className="flex justify-end gap-2">
                        <OutlineButton onClick={() => navigate(`/safe/autorizacoes/${auth.id}`)}>
                          <Eye className="h-4 w-4" />
                        </OutlineButton>
                        <PrimaryButton onClick={() => handleApprove(auth.id)} disabled={actingId === auth.id}>
                          <Check className="h-4 w-4" /> Aprovar
                        </PrimaryButton>
                        <OutlineButton onClick={() => handleDeny(auth.id)} disabled={actingId === auth.id}>
                          <X className="h-4 w-4 text-red-600" /> Negar
                        </OutlineButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ConnectTableScroll>
        )}
        <ConnectPagination meta={meta} onPageChange={setPage} />
      </ConnectCard>
    </div>
  )
}
