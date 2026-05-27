import { useState } from 'react'
import { ConnectDrawer } from '../connect/ConnectDrawer'
import { FormField, inputClass, OutlineButton, PrimaryButton } from '../connect/ConnectShared'
import { gridService } from '../../services/gridService'
import type { GridTicket } from '../../types/grid'

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
    } catch {
      window.alert('Não foi possível registrar a aprovação.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ConnectDrawer
      open={open}
      onClose={onClose}
      title="Aprovar serviço"
      subtitle={ticket ? `${ticket.code} — ${ticket.title}` : ''}
      footer={
        <div className="flex justify-end gap-2">
          <OutlineButton onClick={onClose}>Cancelar</OutlineButton>
          <PrimaryButton onClick={() => void handleSave()} disabled={saving}>
            {saving ? 'Salvando...' : 'Aprovar e enviar ao solicitante'}
          </PrimaryButton>
        </div>
      }
    >
      <p className="mb-4 text-sm text-hub-text-muted">
        Como chefe de manutenção, confirme se o serviço foi executado corretamente. Após aprovar, o chamado segue para
        avaliação do solicitante.
      </p>
      <FormField label="Resumo da resolução">
        <textarea
          className={`${inputClass} min-h-[80px] py-2`}
          value={resolutionSummary}
          onChange={(e) => setResolutionSummary(e.target.value)}
          placeholder="Descreva o que foi verificado..."
        />
      </FormField>
      <FormField label="Observações da aprovação">
        <textarea
          className={`${inputClass} min-h-[80px] py-2`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Comentários internos ou pendências..."
        />
      </FormField>
    </ConnectDrawer>
  )
}
