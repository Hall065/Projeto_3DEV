import { Star } from 'lucide-react'
import { useState } from 'react'
import { ConnectDrawer } from '../connect/ConnectDrawer'
import { FormField, inputClass, OutlineButton, PrimaryButton } from '../connect/ConnectShared'
import { gridService } from '../../services/gridService'
import type { GridTicket } from '../../types/grid'

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
    } catch {
      window.alert('Não foi possível registrar a avaliação.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ConnectDrawer
      open={open}
      onClose={onClose}
      title="Avaliar atendimento (solicitante)"
      subtitle={ticket ? `${ticket.code} — ${ticket.title}` : ''}
      footer={
        <div className="flex justify-end gap-2">
          <OutlineButton onClick={onClose}>Cancelar</OutlineButton>
          <PrimaryButton onClick={() => void handleSave()} disabled={saving}>
            {saving ? 'Salvando...' : 'Finalizar chamado'}
          </PrimaryButton>
        </div>
      }
    >
      <p className="mb-4 text-sm text-hub-text-muted">
        Avaliação do solicitante ({ticket?.requester}). Após salvar, o chamado será finalizado e permanecerá disponível para consulta.
      </p>
      <FormField label="Nota (1 a 5)" required>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`rounded-lg p-2 transition-colors ${rating >= n ? 'text-amber-500' : 'text-hub-border'}`}
              aria-label={`Nota ${n}`}
            >
              <Star className={`h-6 w-6 ${rating >= n ? 'fill-current' : ''}`} />
            </button>
          ))}
        </div>
      </FormField>
      <FormField label="Considerações da avaliação">
        <textarea
          className={`${inputClass} min-h-[100px] py-2`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Comentários sobre o serviço prestado..."
        />
      </FormField>
    </ConnectDrawer>
  )
}
