import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ShieldX } from 'lucide-react'
import { OutlineButton, PrimaryButton } from '../components/connect/ConnectShared'

export function AccessDeniedPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="glass-panel-solid max-w-md rounded-2xl p-8">
        <ShieldX className="mx-auto mb-4 h-12 w-12 text-hub-red" />
        <h1 className="text-xl font-bold text-hub-navy">{t('errors.accessDeniedTitle')}</h1>
        <p className="mt-2 text-sm leading-relaxed text-hub-text-muted">
          {t('errors.accessDeniedFrom', {
            from: from ? t('errors.fromPath', { path: from }) : '',
          })}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link to="/hub">
            <PrimaryButton>{t('common.openHub')}</PrimaryButton>
          </Link>
          <Link to="/perfil">
            <OutlineButton>{t('common.goToProfile')}</OutlineButton>
          </Link>
        </div>
      </div>
    </div>
  )
}
