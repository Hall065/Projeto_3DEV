import { useEffect, useRef } from 'react'
import { Bell, CheckCheck, ExternalLink, Trash2, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppearance } from '../../contexts/AppearanceContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { intlLocale, normalizeLocale } from '../../i18n'
import type { HubNotification, NotificationModule } from '../../types/notification'
import { resolveNotificationText } from '../../utils/notificationI18n'
import type { WallpaperTone } from '../../utils/wallpaperTone'

type NotificationBellVariant = 'hub' | 'connect' | 'grid' | 'safe' | 'chrome'

const SEVERITY_DOT: Record<string, string> = {
  info: 'bg-sky-500',
  warning: 'bg-amber-500',
  urgent: 'bg-red-500',
}

function formatWhen(
  iso: string,
  language: string,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return t('notifications.now')
  if (diffMin < 60) return t('notifications.minutes', { count: diffMin })
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return t('notifications.hours', { count: diffHours })
  return date.toLocaleDateString(intlLocale(normalizeLocale(language)), { day: '2-digit', month: 'short' })
}

function moduleLabel(module: NotificationModule, t: (key: string) => string): string {
  if (module === 'hub') return t('hub.title')
  return t(`modules.${module}`)
}

function resolveBellVariant(variant: NotificationBellVariant, wallpaperTone: WallpaperTone): NotificationBellVariant {
  if (variant === 'chrome') return 'chrome'
  return wallpaperTone === 'dark' ? 'chrome' : variant
}

function variantClasses(variant: NotificationBellVariant) {
  if (variant === 'chrome') {
    return {
      button: 'rounded-full p-2.5 text-white/80 transition hover:bg-white/10 hover:text-white',
      panel: 'rounded-2xl border border-white/15 bg-slate-900/95 text-white shadow-2xl backdrop-blur-md',
      muted: 'text-white/60',
      title: 'text-white',
      itemHover: 'hover:bg-white/10',
      border: 'border-white/10',
    }
  }

  return {
    button: 'rounded-full p-2.5 text-hub-text-muted transition hover:bg-hub-bg hover:text-hub-text',
    panel: 'glass-panel-menu rounded-2xl border border-hub-border bg-white/95 shadow-xl backdrop-blur-md',
    muted: 'text-hub-text-muted',
    title: 'text-hub-navy',
    itemHover: 'hover:bg-hub-bg/70',
    border: 'border-hub-border/60',
  }
}

function NotificationItem({
  item,
  variant,
  onOpen,
  onMarkRead,
  onRemove,
  language,
}: {
  item: HubNotification
  variant: NotificationBellVariant
  onOpen: (item: HubNotification) => void
  onMarkRead: (id: number) => void
  onRemove: (id: number) => void
  language: string
}) {
  const { t } = useTranslation()
  const styles = variantClasses(variant)
  const { title, message } = resolveNotificationText(item, t)

  return (
    <div
      className={`group flex gap-3 border-b px-4 py-3 last:border-b-0 ${styles.border} ${
        item.is_read ? 'opacity-75' : ''
      } ${styles.itemHover}`}
    >
      <span
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[item.severity] ?? SEVERITY_DOT.info}`}
        aria-hidden
      />
      <button
        type="button"
        className="min-w-0 flex-1 text-left"
        onClick={() => onOpen(item)}
      >
        <p className={`text-sm font-semibold ${styles.title}`}>{title}</p>
        <p className={`mt-0.5 line-clamp-2 text-xs ${styles.muted}`}>{message}</p>
        <div className={`mt-1.5 flex flex-wrap items-center gap-2 text-[11px] ${styles.muted}`}>
          <span>{moduleLabel(item.module, t)}</span>
          <span>·</span>
          <span>{formatWhen(item.created_at, language, t)}</span>
          {item.actor_name && (
            <>
              <span>·</span>
              <span>{item.actor_name}</span>
            </>
          )}
        </div>
      </button>
      <div className="flex shrink-0 flex-col gap-1 opacity-0 transition group-hover:opacity-100">
        {!item.is_read && (
          <button
            type="button"
            className={`rounded p-1 ${styles.muted} hover:text-emerald-600`}
            aria-label={t('notifications.markRead')}
            onClick={() => onMarkRead(item.id)}
          >
            <CheckCheck className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          className={`rounded p-1 ${styles.muted} hover:text-red-600`}
          aria-label={t('notifications.remove')}
          onClick={() => onRemove(item.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export function NotificationBell({ variant = 'hub' }: { variant?: NotificationBellVariant }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const panelRef = useRef<HTMLDivElement>(null)
  const { wallpaperTone } = useAppearance()
  const resolvedVariant = resolveBellVariant(variant, wallpaperTone)
  const {
    unreadCount,
    notifications,
    isLoading,
    isOpen,
    setOpen,
    markRead,
    markAllRead,
    remove,
  } = useNotifications()
  const styles = variantClasses(resolvedVariant)

  useEffect(() => {
    if (!isOpen) return
    const onClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [isOpen, setOpen])

  const handleOpen = async (item: HubNotification) => {
    if (!item.is_read) {
      await markRead(item.id)
    }
    setOpen(false)
    if (item.action_url) {
      navigate(item.action_url)
    }
  }

  return (
    <div className="relative z-50" ref={panelRef}>
      <button
        type="button"
        className={`relative ${styles.button}`}
        aria-label={t('notifications.ariaLabel')}
        aria-expanded={isOpen}
        onClick={() => setOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-hub-red px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 top-full z-[70] mt-2 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden ${styles.panel}`}
        >
          <div className={`flex items-center justify-between border-b px-4 py-3 ${styles.border}`}>
            <div>
              <p className={`text-sm font-semibold ${styles.title}`}>{t('notifications.title')}</p>
              <p className={`text-xs ${styles.muted}`}>
                {unreadCount > 0 ? t('notifications.unreadCount', { count: unreadCount }) : t('notifications.allCaughtUp')}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className={`rounded-lg px-2 py-1 text-xs font-medium ${styles.muted} hover:bg-hub-bg`}
                  onClick={() => void markAllRead()}
                >
                  {t('notifications.markAll')}
                </button>
              )}
              <button
                type="button"
                className={`rounded-lg p-1 ${styles.muted} hover:bg-hub-bg`}
                aria-label={t('common.close')}
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[min(24rem,60vh)] overflow-y-auto">
            {isLoading && (
              <p className={`px-4 py-8 text-center text-sm ${styles.muted}`}>{t('notifications.loading')}</p>
            )}
            {!isLoading && notifications.length === 0 && (
              <p className={`px-4 py-8 text-center text-sm ${styles.muted}`}>
                {t('notifications.empty')}
              </p>
            )}
            {!isLoading &&
              notifications.map((item) => (
                <NotificationItem
                  key={item.id}
                  item={item}
                  variant={resolvedVariant}
                  onOpen={(n) => void handleOpen(n)}
                  onMarkRead={(id) => void markRead(id)}
                  onRemove={(id) => void remove(id)}
                  language={i18n.language}
                />
              ))}
          </div>

          <div className={`border-t px-4 py-2.5 ${styles.border}`}>
            <Link
              to="/configuracoes"
              className={`inline-flex items-center gap-1.5 text-xs font-medium ${styles.muted} hover:underline`}
              onClick={() => setOpen(false)}
            >
              {t('notifications.preferencesLink')}
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
