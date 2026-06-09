import { Clock, Mail, ShieldQuestion } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function PendingAccessPanel() {
  const { t } = useTranslation()

  return (
    <div className="glass-panel-solid mx-auto max-w-xl rounded-2xl border border-amber-200/80 bg-amber-50/40 p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <ShieldQuestion className="h-7 w-7" strokeWidth={1.75} />
      </div>
      <h2 className="text-xl font-bold text-hub-navy">{t('hub.pendingAccessTitle')}</h2>
      <p className="mt-3 text-sm leading-relaxed text-hub-text-muted">{t('hub.pendingAccessBody')}</p>
      <ul className="mt-6 space-y-3 text-left text-sm text-hub-text-muted">
        <li className="flex items-start gap-3 rounded-xl bg-white/70 px-4 py-3">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-hub-red" />
          <span>{t('hub.pendingAccessWait')}</span>
        </li>
        <li className="flex items-start gap-3 rounded-xl bg-white/70 px-4 py-3">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-hub-red" />
          <span>
            {t('hub.pendingAccessContact')}{' '}
            <Link to="/solicitar-acesso" className="font-medium text-hub-red hover:underline">
              {t('auth.requestAccess')}
            </Link>
          </span>
        </li>
      </ul>
    </div>
  )
}
