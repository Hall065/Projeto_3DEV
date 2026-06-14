import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../contexts/ToastContext'
import { parseApiError } from '../utils/parseApiError'

export function useCrudToast() {
  const { t } = useTranslation()
  const toast = useToast()

  const notifyCreated = useCallback(() => {
    toast.success(t('toast.created'))
  }, [toast, t])

  const notifyUpdated = useCallback(() => {
    toast.success(t('toast.updated'))
  }, [toast, t])

  const notifySaved = useCallback(
    (isEdit?: boolean) => {
      toast.success(isEdit ? t('toast.updated') : t('toast.created'))
    },
    [toast, t],
  )

  const notifyDeleted = useCallback(() => {
    toast.success(t('toast.deleted'))
  }, [toast, t])

  const notifyError = useCallback(
    (error: unknown, fallback?: string) => {
      toast.error(parseApiError(error, fallback ?? t('toast.error')))
    },
    [toast, t],
  )

  const notifySuccess = useCallback(
    (message: string) => {
      toast.success(message)
    },
    [toast],
  )

  const notifyWarning = useCallback(
    (message: string) => {
      toast.warning(message)
    },
    [toast],
  )

  const notifyInfo = useCallback(
    (message: string) => {
      toast.info(message)
    },
    [toast],
  )

  return {
    toast,
    notifyCreated,
    notifyUpdated,
    notifySaved,
    notifyDeleted,
    notifyError,
    notifySuccess,
    notifyWarning,
    notifyInfo,
  }
}
