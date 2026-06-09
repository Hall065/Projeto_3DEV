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
  EMPTY,
  OutlineButton,
  PrimaryButton,
} from '../../components/connect/ConnectShared'
import { safeService } from '../../services/safeService'
import type { PaginatedMeta, SafeAuthorization } from '../../types/safe'
import { parseApiError } from '../../utils/parseApiError'

export function SafePortariaPage() {
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
      .getPortariaQueue({ page, per_page: 10 })
      .then((res) => {
        setItems(res.data)
        setMeta(res.meta)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page])

  const handleConfirm = async (id: number) => {
    setActingId(id)
    try {
      await safeService.confirmByPortaria(id)
      load()
    } catch (e: unknown) {
      window.alert(parseApiError(e))
    } finally {
      setActingId(null)
    }
  }

  const handleDeny = async (id: number) => {
    if (!window.confirm('Recusar esta autorização na portaria?')) return
    setActingId(id)
    try {
      await safeService.denyByPortaria(id)
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
        title={t('safe.portaria.title')}
        subtitle={t('safe.portaria.subtitle')}
      />

      <ConnectCard className="min-w-0 overflow-hidden">
        {loading ? (
          <ConnectLoadingSpinner />
        ) : items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-hub-text-muted sm:px-6">Nenhuma autorização aguardando confirmação.</p>
        ) : (
          <ConnectTableScroll>
            <table className="w-full min-w-[760px] text-sm">
              <thead className="glass-thead text-hub-text-muted">
                <tr>
                  <th className="px-4 py-3 text-left sm:px-6">Protocolo</th>
                  <th className="px-4 py-3 text-left sm:px-6">Aluno</th>
                  <th className="px-4 py-3 text-left sm:px-6">Professor</th>
                  <th className="px-4 py-3 text-left sm:px-6">Agendado</th>
                  <th className="px-4 py-3 text-right sm:px-6">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((auth) => (
                  <tr key={auth.id} className="border-t border-hub-border/40">
                    <td className="px-4 py-3 font-medium text-hub-red sm:px-6">{auth.protocol}</td>
                    <td className="px-4 py-3 sm:px-6">{auth.student_name}</td>
                    <td className="px-4 py-3 sm:px-6">{auth.teacher_approver_name ?? EMPTY}</td>
                    <td className="px-4 py-3 sm:px-6">{formatDateTime(auth.scheduled_at)}</td>
                    <td className="px-4 py-3 sm:px-6">
                      <div className="flex justify-end gap-2">
                        <OutlineButton onClick={() => navigate(`/safe/autorizacoes/${auth.id}`)}>
                          <Eye className="h-4 w-4" />
                        </OutlineButton>
                        <PrimaryButton onClick={() => handleConfirm(auth.id)} disabled={actingId === auth.id}>
                          <Check className="h-4 w-4" /> Confirmar
                        </PrimaryButton>
                        <OutlineButton onClick={() => handleDeny(auth.id)} disabled={actingId === auth.id}>
                          <X className="h-4 w-4 text-red-600" /> Recusar
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
