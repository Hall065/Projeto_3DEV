import {
  ArrowUpRight,
  Bell,
  Database,
  Paintbrush,
  Sparkles,
  User as UserIcon,
  Users,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { AppearanceSettings } from '../components/settings/AppearanceSettings'
import {
  ConnectCard,
  ConnectPageHeader,
  OutlineButton,
} from '../components/connect/ConnectShared'
import { LanguageSwitcher } from '../components/settings/LanguageSwitcher'
import { useAppearance } from '../contexts/AppearanceContext'
import { useAuth } from '../contexts/AuthContext'
import { notificationService } from '../services/notificationService'
import type { NotificationPreferences } from '../types/notification'
import { useCrudToast } from '../hooks/useCrudToast'
import { useInterfacePreferences } from '../hooks/useInterfacePreferences'
import { usePermissions } from '../hooks/usePermissions'
import { DEFAULT_WALLPAPER_ID } from '../constants/wallpapers'

type QuickLink = {
  to: string
  label: string
  description: string
  icon: typeof UserIcon
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  return (
    <label
      className={`flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-hub-border/50 px-4 py-3 transition ${
        disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-hub-bg/60'
      }`}
    >
      <span>
        <span className="block text-sm font-medium text-hub-navy">{label}</span>
        <span className="mt-0.5 block text-xs text-hub-text-muted">{description}</span>
      </span>
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 shrink-0 accent-hub-red"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  )
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  in_app: true,
  email: false,
  modules: { hub: true, connect: true, grid: true, safe: true },
}

export function SettingsPage() {
  const { t } = useTranslation()
  const { user, refreshUser } = useAuth()
  const { isAdmin, can } = usePermissions()
  const { setWallpaperId, removeCustomWallpaper } = useAppearance()
  const { reduceMotion, setReduceMotion } = useInterfacePreferences()
  const crudToast = useCrudToast()
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(
    user?.notification_preferences ?? DEFAULT_NOTIFICATION_PREFS,
  )
  const [savingNotifications, setSavingNotifications] = useState(false)

  useEffect(() => {
    if (user?.notification_preferences) {
      setNotificationPrefs(user.notification_preferences)
      return
    }
    if (!user) return
    notificationService
      .getPreferences()
      .then(setNotificationPrefs)
      .catch(() => undefined)
  }, [user])

  async function updateNotificationPrefs(patch: Partial<NotificationPreferences>) {
    const next: NotificationPreferences = {
      ...notificationPrefs,
      ...patch,
      modules: { ...notificationPrefs.modules, ...(patch.modules ?? {}) },
    }
    setNotificationPrefs(next)
    setSavingNotifications(true)
    try {
      await notificationService.updatePreferences(next)
      await refreshUser()
      crudToast.notifySuccess(t('settings.notificationsSaved'))
    } catch {
      setNotificationPrefs(notificationPrefs)
      crudToast.notifyError(null, t('settings.notificationsSaveError'))
    } finally {
      setSavingNotifications(false)
    }
  }

  const quickLinks: QuickLink[] = [
    {
      to: '/perfil',
      label: t('settings.profileShortcut'),
      description: t('settings.profileShortcutDesc'),
      icon: UserIcon,
    },
    {
      to: '/temas',
      label: t('settings.themesShortcut'),
      description: t('settings.themesShortcutDesc'),
      icon: Paintbrush,
    },
  ]

  if (isAdmin || can('hub.users.manage')) {
    quickLinks.push({
      to: '/hub/usuarios',
      label: t('settings.usersShortcut'),
      description: t('settings.usersShortcutDesc'),
      icon: Users,
    })
  }

  function clearLocalDrafts() {
    try {
      localStorage.removeItem('senai_report_config_connect')
      localStorage.removeItem('senai_report_config_grid')
      crudToast.notifySuccess(t('settings.draftsCleared'))
    } catch {
      crudToast.notifyError(null, t('settings.draftsClearError'))
    }
  }

  function resetWallpaper() {
    removeCustomWallpaper()
    setWallpaperId(DEFAULT_WALLPAPER_ID)
    crudToast.notifySuccess(t('settings.wallpaperReset'))
  }

  return (
    <section className="w-full min-w-0">
      <ConnectPageHeader
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
        actions={
          <Link
            to="/perfil"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-hub-border px-4 text-sm font-medium text-hub-navy transition hover:bg-hub-bg"
          >
            <UserIcon className="h-4 w-4" />
            {t('settings.myProfile')}
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <aside className="space-y-4 lg:col-span-4">
          <ConnectCard className="p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-hub-text-muted">{t('settings.shortcuts')}</h2>
            <ul className="mt-4 space-y-2">
              {quickLinks.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="flex items-start gap-3 rounded-xl border border-hub-border/50 p-3 transition hover:border-hub-navy/20 hover:bg-hub-bg/50"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-hub-red/10 text-hub-red">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1 text-sm font-semibold text-hub-navy">
                          {item.label}
                          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
                        </span>
                        <span className="mt-0.5 block text-xs text-hub-text-muted">{item.description}</span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </ConnectCard>

          {user && (
            <ConnectCard className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-hub-text-muted">{t('settings.account')}</p>
              <p className="mt-2 text-sm font-medium text-hub-navy">{user.name}</p>
              <p className="text-xs text-hub-text-muted">{user.email}</p>
              <p className="mt-2 text-xs text-hub-text-muted">
                {t('settings.roleLabel')}: <span className="font-medium text-hub-navy">{user.role_label ?? user.role}</span>
              </p>
              <Link to="/perfil" className="mt-4 inline-flex text-sm font-medium text-hub-red hover:underline">
                {t('settings.editAccount')}
              </Link>
            </ConnectCard>
          )}
        </aside>

        <div className="space-y-6 lg:col-span-8">
          <AppearanceSettings embedded />

          <ConnectCard className="p-6">
            <header className="mb-4 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-hub-navy/10 text-hub-navy">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-hub-navy">{t('settings.interface')}</h2>
                <p className="mt-0.5 text-sm text-hub-text-muted">{t('settings.interfaceHint')}</p>
              </div>
            </header>
            <div className="space-y-2">
              <ToggleRow
                label={t('settings.reduceMotion')}
                description={t('settings.reduceMotionDesc')}
                checked={reduceMotion}
                onChange={setReduceMotion}
              />
            </div>
          </ConnectCard>

          <ConnectCard className="p-6">
            <header className="mb-4 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700">
                <Bell className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-hub-navy">{t('settings.notificationsTitle')}</h2>
                <p className="mt-0.5 text-sm text-hub-text-muted">
                  {t('settings.notificationsHint')}
                </p>
              </div>
            </header>
            <div className="space-y-2">
              <ToggleRow
                label={t('settings.notificationsInApp')}
                description={t('settings.notificationsInAppDesc')}
                checked={notificationPrefs.in_app}
                disabled={savingNotifications}
                onChange={(value) => void updateNotificationPrefs({ in_app: value })}
              />
              <ToggleRow
                label={t('settings.notificationsEmail')}
                description={t('settings.notificationsEmailDesc')}
                checked={notificationPrefs.email}
                disabled={savingNotifications}
                onChange={(value) => void updateNotificationPrefs({ email: value })}
              />
              <ToggleRow
                label={t('settings.moduleHub')}
                description={t('settings.moduleHubDesc')}
                checked={notificationPrefs.modules.hub}
                disabled={savingNotifications || !notificationPrefs.in_app}
                onChange={(value) =>
                  void updateNotificationPrefs({ modules: { ...notificationPrefs.modules, hub: value } })
                }
              />
              <ToggleRow
                label={t('settings.moduleConnect')}
                description={t('settings.moduleConnectDesc')}
                checked={notificationPrefs.modules.connect}
                disabled={savingNotifications || !notificationPrefs.in_app}
                onChange={(value) =>
                  void updateNotificationPrefs({ modules: { ...notificationPrefs.modules, connect: value } })
                }
              />
              <ToggleRow
                label={t('settings.moduleGrid')}
                description={t('settings.moduleGridDesc')}
                checked={notificationPrefs.modules.grid}
                disabled={savingNotifications || !notificationPrefs.in_app}
                onChange={(value) =>
                  void updateNotificationPrefs({ modules: { ...notificationPrefs.modules, grid: value } })
                }
              />
              <ToggleRow
                label={t('settings.moduleSafe')}
                description={t('settings.moduleSafeDesc')}
                checked={notificationPrefs.modules.safe ?? true}
                disabled={savingNotifications || !notificationPrefs.in_app}
                onChange={(value) =>
                  void updateNotificationPrefs({ modules: { ...notificationPrefs.modules, safe: value } })
                }
              />
            </div>
          </ConnectCard>

          <ConnectCard className="p-6">
            <LanguageSwitcher />
          </ConnectCard>

          <ConnectCard className="p-6">
            <header className="mb-4 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-700">
                <Database className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-hub-navy">{t('settings.localData')}</h2>
                <p className="mt-0.5 text-sm text-hub-text-muted">
                  {t('settings.localDataHint')}
                </p>
              </div>
            </header>
            <div className="flex flex-wrap gap-2">
              <OutlineButton type="button" onClick={clearLocalDrafts}>
                <Zap className="h-4 w-4" />
                {t('settings.clearDrafts')}
              </OutlineButton>
              <OutlineButton type="button" onClick={resetWallpaper}>
                <Paintbrush className="h-4 w-4" />
                {t('settings.resetWallpaper')}
              </OutlineButton>
            </div>
          </ConnectCard>
        </div>
      </div>
    </section>
  )
}
