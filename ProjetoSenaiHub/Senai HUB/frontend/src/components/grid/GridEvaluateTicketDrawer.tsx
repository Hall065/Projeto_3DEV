import { Star } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConnectDrawer } from '../connect/ConnectDrawer'
import { FormField, inputClass, OutlineButton, PrimaryButton } from '../connect/ConnectShared'
import { gridService } from '../../services/gridService'
import type { GridTicket } from '../../types/grid'
import { useCrudToast } from '../../hooks/useCrudToast'

export function GridEvaluateTicketDrawer({
  ticket,
  open,
  onClose,
  onEvaluated,
}: {
  ticket: GridTicket | null
  open: boolean
  onClose: () => void
  onEvaluated: () => void
}) {
  const { t } = useTranslation()
  const crudToast = useCrudToast()
  const [rating, setRating] = useState(5)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!ticket) return
    setSaving(true)
    try {
      await gridService.evaluateTicket(ticket.id, {
        rating,
        notes: notes.trim() || undefined,
        evaluated_by: ticket.requester,
      })
      onEvaluated()
      onClose()
      setNotes('')
      setRating(5)
      crudToast.notifySuccess(t('gridComponents.evaluateTicket.success'))
    } catch (err: unknown) {
      crudToast.notifyError(err, t('gridComponents.evaluateTicket.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <ConnectDrawer
      open={open}
      onClose={onClose}
      title={t('gridComponents.evaluateTicket.title')}
      subtitle={ticket ? `${ticket.code} — ${ticket.title}` : ''}
      footer={
        <div className="flex justify-end gap-2">
          <OutlineButton onClick={onClose}>{t('common.cancel')}</OutlineButton>
          <PrimaryButton onClick={() => void handleSave()} disabled={saving}>
            {saving ? t('connect.common.saving') : t('gridComponents.evaluateTicket.finishTicket')}
          </PrimaryButton>
        </div>
      }
    >
      <p className="mb-4 text-sm text-hub-text-muted">
        {t('gridComponents.evaluateTicket.body', { requester: ticket?.requester })}
      </p>
      <FormField label={t('gridComponents.evaluateTicket.rating')} required>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`rounded-lg p-2 transition-colors ${rating >= n ? 'text-amber-500' : 'text-hub-border'}`}
              aria-label={t('gridComponents.evaluateTicket.ratingAria', { n })}
            >
              <Star className={`h-6 w-6 ${rating >= n ? 'fill-current' : ''}`} />
            </button>
          ))}
        </div>
      </FormField>
      <FormField label={t('gridComponents.evaluateTicket.evaluationNotes')}>
        <textarea
          className={`${inputClass} min-h-[100px] py-2`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('gridComponents.evaluateTicket.evaluationPlaceholder')}
        />
      </FormField>
    </ConnectDrawer>
  )
}
