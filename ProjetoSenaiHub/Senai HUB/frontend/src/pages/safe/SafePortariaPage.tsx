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
import { useConfirmAction } from '../../hooks/useConfirmAction'
import { useCrudToast } from '../../hooks/useCrudToast'
export function SafePortariaPage() {
  const { t } = useTranslation()
  const crudToast = useCrudToast()
  const { confirmAction } = useConfirmAction()
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
      crudToast.notifySuccess(t('safe.portaria.confirmedSuccess'))
      load()
    } catch (e: unknown) {
      crudToast.notifyError(e)
    } finally {
      setActingId(null)
    }
  }

  const handleDeny = async (id: number) => {
    if (!(await confirmAction({ message: t('safe.portaria.denyConfirm'), variant: 'danger' }))) return
    setActingId(id)
    try {
      await safeService.denyByPortaria(id)
      crudToast.notifySuccess(t('safe.portaria.deniedSuccess'))
      load()
    } catch (e: unknown) {
      crudToast.notifyError(e)
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
          <p className="px-4 py-10 text-center text-sm text-hub-text-muted sm:px-6">{t('safe.portaria.empty')}</p>
        ) : (
          <ConnectTableScroll>
            <table className="w-full min-w-[760px] text-sm">
              <thead className="glass-thead text-hub-text-muted">
                <tr>
                  <th className="px-4 py-3 text-left sm:px-6">{t('safe.table.protocol')}</th>
                  <th className="px-4 py-3 text-left sm:px-6">{t('safe.table.student')}</th>
                  <th className="px-4 py-3 text-left sm:px-6">{t('safe.table.teacher')}</th>
                  <th className="px-4 py-3 text-left sm:px-6">{t('safe.table.scheduled')}</th>
                  <th className="px-4 py-3 text-right sm:px-6">{t('connect.common.actions')}</th>
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
                          <Check className="h-4 w-4" /> {t('safe.portaria.confirm')}
                        </PrimaryButton>
                        <OutlineButton onClick={() => handleDeny(auth.id)} disabled={actingId === auth.id}>
                          <X className="h-4 w-4 text-red-600" /> {t('safe.portaria.deny')}
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
