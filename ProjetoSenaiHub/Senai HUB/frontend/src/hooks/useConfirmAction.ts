import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useConfirm, type ConfirmOptions } from '../contexts/ConfirmContext'

export function useConfirmAction() {
  const { confirm } = useConfirm()
  const { t } = useTranslation()

  const confirmDelete = useCallback(
    async (entityLabel: string) =>
      confirm({
        title: t('common.confirmDeleteTitle'),
        message: t('connect.confirm.delete', { entity: entityLabel }),
        confirmLabel: t('common.delete'),
        variant: 'danger',
      }),
    [confirm, t],
  )

  const confirmAction = useCallback(
    async (options: ConfirmOptions) => {
      const resolved: ConfirmOptions = {
        variant: 'default',
        ...options,
        title: options.title ?? t('common.confirmTitle'),
      }
      return confirm(resolved)
    },
    [confirm, t],
  )

  return { confirm, confirmDelete, confirmAction }
}
