import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConnectDrawer } from '../connect/ConnectDrawer'
import { FormField, inputClass, OutlineButton, PrimaryButton } from '../connect/ConnectShared'
import { gridService } from '../../services/gridService'
import type { GridTicket } from '../../types/grid'
import { useCrudToast } from '../../hooks/useCrudToast'

export function GridApproveServiceDrawer({
  ticket,
  open,
  onClose,
  onApproved,
  approverName,
}: {
  ticket: GridTicket | null
  open: boolean
  onClose: () => void
  onApproved: () => void
  approverName: string
}) {
  const { t } = useTranslation()
  const crudToast = useCrudToast()
  const [notes, setNotes] = useState('')
  const [resolutionSummary, setResolutionSummary] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!ticket) return
    setSaving(true)
    try {
      await gridService.approveTicketService(ticket.id, {
        approved_by: approverName,
        notes: notes.trim() || undefined,
        resolution_summary: resolutionSummary.trim() || undefined,
      })
      onApproved()
      onClose()
      setNotes('')
      setResolutionSummary('')
      crudToast.notifySuccess(t('gridComponents.approveService.success'))
    } catch (err: unknown) {
      crudToast.notifyError(err, t('gridComponents.approveService.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <ConnectDrawer
      open={open}
      onClose={onClose}
      title={t('gridComponents.approveService.title')}
      subtitle={ticket ? `${ticket.code} — ${ticket.title}` : ''}
      footer={
        <div className="flex justify-end gap-2">
          <OutlineButton onClick={onClose}>{t('common.cancel')}</OutlineButton>
          <PrimaryButton onClick={() => void handleSave()} disabled={saving}>
            {saving ? t('connect.common.saving') : t('gridComponents.approveService.approveAndSend')}
          </PrimaryButton>
        </div>
      }
    >
      <p className="mb-4 text-sm text-hub-text-muted">{t('gridComponents.approveService.body')}</p>
      <FormField label={t('gridComponents.approveService.resolutionSummary')}>
        <textarea
          className={`${inputClass} min-h-[80px] py-2`}
          value={resolutionSummary}
          onChange={(e) => setResolutionSummary(e.target.value)}
          placeholder={t('gridComponents.approveService.resolutionPlaceholder')}
        />
      </FormField>
      <FormField label={t('gridComponents.approveService.approvalNotes')}>
        <textarea
          className={`${inputClass} min-h-[80px] py-2`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('gridComponents.approveService.approvalPlaceholder')}
        />
      </FormField>
    </ConnectDrawer>
  )
}
