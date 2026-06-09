import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import {
  ConnectCard,
  ConnectLoadingSpinner,
  ConnectPageHeader,
  EMPTY,
  formatDateTime,
  OutlineButton,
} from '../../components/connect/ConnectShared'
import { SafeStatusBadge } from '../../components/safe/SafeStatusBadge'
import { safeService } from '../../services/safeService'
import type { SafeAuthorization, SafeAuthorizationLog } from '../../types/safe'

export function SafeAuthorizationDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const [authorization, setAuthorization] = useState<SafeAuthorization | null>(null)
  const [logs, setLogs] = useState<SafeAuthorizationLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    safeService
      .getAuthorizationHistory(Number(id))
      .then((res) => {
        setAuthorization(res.authorization)
        setLogs(res.logs)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <ConnectLoadingSpinner label={t('safe.detail.loading')} />
  }

  if (!authorization) {
    return (
      <div className="text-center">
        <p className="text-hub-text-muted">{t('safe.detail.notFound')}</p>
        <Link to="/safe/autorizacoes" className="mt-4 inline-block text-hub-red hover:underline">
          {t('safe.detail.backToList')}
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title={authorization.protocol}
        subtitle={`${authorization.student_name} · ${authorization.class_name}`}
        actions={
          <Link to="/safe/autorizacoes">
            <OutlineButton>
              <ArrowLeft className="h-4 w-4" /> {t('common.back')}
            </OutlineButton>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <ConnectCard className="p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-hub-navy">{t('safe.detail.details')}</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-hub-text-muted">{t('safe.detail.fields.status')}</dt>
              <dd>
                <SafeStatusBadge status={authorization.status} label={authorization.status_label} />
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-hub-text-muted">{t('safe.detail.fields.type')}</dt>
              <dd className="font-medium text-hub-navy">{authorization.type_label}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-hub-text-muted">{t('safe.detail.fields.scheduled')}</dt>
              <dd>{formatDateTime(authorization.scheduled_at)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-hub-text-muted">{t('safe.detail.fields.requester')}</dt>
              <dd>{authorization.requester_name ?? EMPTY}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-hub-text-muted">{t('safe.detail.fields.teacher')}</dt>
              <dd>{authorization.teacher_approver_name ?? EMPTY}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-hub-text-muted">{t('safe.detail.fields.portaria')}</dt>
              <dd>{authorization.portaria_approver_name ?? EMPTY}</dd>
            </div>
            <div>
              <dt className="mb-1 text-hub-text-muted">{t('safe.detail.fields.reason')}</dt>
              <dd className="rounded-xl border border-hub-border/50 bg-hub-bg/40 p-3 text-hub-text">{authorization.reason}</dd>
            </div>
            {authorization.notes && (
              <div>
                <dt className="mb-1 text-hub-text-muted">{t('safe.detail.fields.notes')}</dt>
                <dd className="rounded-xl border border-hub-border/50 bg-hub-bg/40 p-3 text-hub-text">{authorization.notes}</dd>
              </div>
            )}
          </dl>
        </ConnectCard>

        <ConnectCard className="p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-hub-navy">{t('safe.detail.history')}</h2>
          {logs.length === 0 ? (
            <p className="text-sm text-hub-text-muted">{t('safe.detail.noHistory')}</p>
          ) : (
            <ul className="space-y-3">
              {logs.map((log) => (
                <li
                  key={log.id}
                  className="rounded-xl border border-hub-border/50 bg-gradient-to-r from-white to-hub-bg/30 p-3"
                >
                  <p className="text-sm font-medium text-hub-navy">{log.action}</p>
                  <p className="mt-1 text-xs text-hub-text-muted">
                    {log.user_name ?? t('safe.detail.system')} · {formatDateTime(log.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </ConnectCard>
      </div>
    </div>
  )
}
