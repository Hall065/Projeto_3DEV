import { useTranslation } from 'react-i18next'
import type { NavItem } from '../config/navPermissions'
import { usePermissionCatalog } from './usePermissionCatalog'
import { navI18nKey, type HubModule } from '../utils/navI18n'

export function useNavLabel(module: HubModule) {
  const { t } = useTranslation()
  const { labelForNavItem } = usePermissionCatalog()

  return (item: NavItem) => t(navI18nKey(module, item.to), { defaultValue: labelForNavItem(item) })
}
