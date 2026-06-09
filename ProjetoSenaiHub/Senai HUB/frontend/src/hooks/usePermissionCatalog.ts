import { useCallback, useEffect, useState } from 'react'
import {
  fetchPermissionsCatalog,
  readCachedPermissionsCatalog,
  resolvePermissionLabel,
  type PermissionsCatalog,
} from '../services/permissionsCatalogService'
import { useAuth } from '../contexts/AuthContext'
import type { NavItem } from '../config/navPermissions'

export function usePermissionCatalog() {
  const { isAuthenticated } = useAuth()
  const [catalog, setCatalog] = useState<PermissionsCatalog | null>(() => readCachedPermissionsCatalog())

  useEffect(() => {
    if (!isAuthenticated) {
      setCatalog(null)
      return
    }

    fetchPermissionsCatalog()
      .then(setCatalog)
      .catch(() => undefined)
  }, [isAuthenticated])

  const labelForNavItem = useCallback(
    (item: NavItem) => {
      const permission = Array.isArray(item.permission) ? item.permission[0] : item.permission
      return resolvePermissionLabel(catalog, permission, item.label)
    },
    [catalog],
  )

  return { catalog, labelForNavItem }
}
