import { LayoutGrid, Shield, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConnectDrawer } from '../connect/ConnectDrawer'
import { ConnectDrawerHeroCard } from '../connect/ConnectDrawerHeroCard'
import { ConnectLoadingSpinner } from '../connect/ConnectShared'
import { UserAvatar } from '../ui/UserAvatar'
import { adminService } from '../../services/adminService'
import type { HubUserDetail } from '../../types/auth'
import { groupPermissions } from '../../utils/profileLabels'

import { intlLocale, normalizeLocale } from '../../i18n'

function formatDateTime(value: string | undefined | null, locale: string) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString(locale)
  } catch {
    return value
  }
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-hub-border/30 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-hub-text-muted">{label}</dt>
      <dd className="text-sm font-medium text-hub-navy sm:text-right">{value}</dd>
    </div>
  )
}

export function HubUserDetailDrawer({
  userId,
  open,
  onClose,
}: {
  userId: number | null
  open: boolean
  onClose: () => void
}) {
  const { t, i18n } = useTranslation()
  const locale = intlLocale(normalizeLocale(i18n.language))
  const [tab, setTab] = useState<'overview' | 'access'>('overview')
  const [detail, setDetail] = useState<HubUserDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !userId) {
      setDetail(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    setTab('overview')

    adminService
      .getUser(userId)
      .then(setDetail)
      .catch(() => setError(t('gridComponents.shared.loadUserError')))
      .finally(() => setLoading(false))
  }, [open, userId])

  const permissionGroups = detail?.permissions ? groupPermissions(detail.permissions) : []

  return (
    <ConnectDrawer
      open={open}
      onClose={onClose}
      title={detail?.name ?? t('common.user')}
      subtitle={detail?.role_label ?? detail?.role ?? t('common.loading')}
      width="2xl"
    >
      {loading ? (
        <ConnectLoadingSpinner label={t('gridComponents.shared.loadingUser')} className="min-h-[320px]" />
      ) : error ? (
        <p className="py-12 text-center text-sm text-red-600">{error}</p>
      ) : detail ? (
        <div className="space-y-6">
          <ConnectDrawerHeroCard onBack={onClose}>
            <UserAvatar name={detail.name} avatarUrl={detail.avatar_url} size="lg" />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h3 className="text-lg font-bold text-hub-navy">{detail.name}</h3>
              <p className="mt-1 text-sm text-hub-text-muted">{detail.email}</p>
              <p className="mt-2">
                <span className="rounded-full bg-hub-bg px-2.5 py-1 text-xs font-medium text-hub-navy">
                  {detail.role_label ?? detail.role}
                </span>
              </p>
              {detail.is_admin && (
                <p className="mt-2 text-xs font-medium text-amber-700">{t('gridComponents.shared.adminAccount')}</p>
              )}
            </div>
          </ConnectDrawerHeroCard>

          <div className="flex gap-2 border-b border-hub-border/50">
            <button
              type="button"
              onClick={() => setTab('overview')}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
                tab === 'overview' ? 'border-hub-red text-hub-red' : 'border-transparent text-hub-text-muted hover:text-hub-navy'
              }`}
            >
              {t('gridComponents.shared.overview')}
            </button>
            <button
              type="button"
              onClick={() => setTab('access')}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
                tab === 'access' ? 'border-hub-red text-hub-red' : 'border-transparent text-hub-text-muted hover:text-hub-navy'
              }`}
            >
              {t('gridComponents.shared.accessAndPermissions')}
            </button>
          </div>

          {tab === 'overview' ? (
            <>
              {detail.role_description && (
                <p className="rounded-xl border border-hub-border/50 bg-hub-bg/40 px-4 py-3 text-sm text-hub-text-muted">
                  {detail.role_description}
                </p>
              )}

              <dl className="surface-inset rounded-2xl border border-hub-border/50 px-4">
                <DetailRow label="ID" value={detail.id} />
                <DetailRow label={t('connect.table.email')} value={detail.email} />
                <DetailRow label={t('common.role')} value={detail.role_label ?? detail.role ?? '—'} />
                <DetailRow label={t('gridComponents.shared.mainModule')} value={detail.role_module ?? '—'} />
                {detail.company_name ? <DetailRow label={t('gridComponents.shared.company')} value={detail.company_name} /> : null}
                <DetailRow
                  label={t('gridComponents.shared.emailVerified')}
                  value={detail.email_verified_at ? formatDateTime(detail.email_verified_at, locale) : t('gridComponents.shared.pending')}
                />
                <DetailRow label={t('gridComponents.shared.registeredAt')} value={formatDateTime(detail.created_at, locale)} />
                <DetailRow label={t('gridComponents.shared.lastUpdate')} value={formatDateTime(detail.updated_at, locale)} />
              </dl>
            </>
          ) : (
            <div className="space-y-6">
              <section>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-hub-navy">
                  <LayoutGrid className="h-4 w-4 text-hub-red" />
                  {t('gridComponents.shared.releasedApps')}
                </h4>
                {(detail.applications_detail?.length ?? 0) === 0 ? (
                  <p className="text-sm text-hub-text-muted">{t('gridComponents.shared.noApps')}</p>
                ) : (
                  <ul className="space-y-2">
                    {detail.applications_detail?.map((app) => (
                      <li
                        key={app.slug}
                        className="surface-inset rounded-xl border border-hub-border/50 px-4 py-3 text-sm"
                      >
                        <p className="font-medium text-hub-navy">{app.name}</p>
                        {app.description && <p className="mt-0.5 text-xs text-hub-text-muted">{app.description}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-hub-navy">
                  <Shield className="h-4 w-4 text-hub-red" />
                  {t('gridComponents.shared.profilePermissions')}
                </h4>
                {permissionGroups.length === 0 ? (
                  <p className="text-sm text-hub-text-muted">{t('gridComponents.shared.noPermissions')}</p>
                ) : (
                  <div className="space-y-4">
                    {permissionGroups.map((group) => (
                      <div key={group.module} className="surface-inset rounded-xl border border-hub-border/50 px-4 py-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-hub-text-muted">{group.module}</p>
                        <ul className="space-y-1">
                          {group.items.map((item) => (
                            <li key={item} className="text-sm text-hub-navy">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      ) : (
        <p className="flex items-center justify-center gap-2 py-12 text-sm text-hub-text-muted">
          <User className="h-5 w-5" /> {t('gridComponents.shared.selectUser')}
        </p>
      )}
    </ConnectDrawer>
  )
}
