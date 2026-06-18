import type { TFunction } from 'i18next'
import type { HubNotification } from '../types/notification'

function i18nParams(item: HubNotification): Record<string, unknown> {
  const meta = item.metadata
  if (meta && typeof meta === 'object' && 'i18n' in meta && meta.i18n && typeof meta.i18n === 'object') {
    return meta.i18n as Record<string, unknown>
  }

  return {}
}

export function resolveNotificationText(
  item: HubNotification,
  t: TFunction,
): { title: string; message: string } {
  const params = i18nParams(item)
  const titleKey = `notificationTypes.${item.type}.title`
  const messageKey = `notificationTypes.${item.type}.message`

  const title = t(titleKey, { ...params, defaultValue: item.title })
  const message = t(messageKey, { ...params, defaultValue: item.message })

  return { title, message }
}
