import { ClipboardList } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ConnectDrawer } from '../connect/ConnectDrawer'
import { FormField, inputClass, OutlineButton, PrimaryButton, selectClass } from '../connect/ConnectShared'
import { GridPriorityBadge, GridTicketStatusBadge } from './GridBadges'
import { GridInventoryPicker, guardInventoryBeforeSubmit } from './GridInventoryPicker'
import { gridService } from '../../services/gridService'
import type { GridInventoryLine, GridTicket, GridUser } from '../../types/grid'
import { parseApiError } from '../../utils/parseApiError'

export function GridCreateTaskFromTicketDrawer({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const [tickets, setTickets] = useState<GridTicket[]>([])
  const [technicians, setTechnicians] = useState<GridUser[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [assignee, setAssignee] = useState('')
  const [description, setDescription] = useState('')
  const [inventoryItems, setInventoryItems] = useState<GridInventoryLine[]>([])

  const selected = tickets.find((t) => t.id === selectedId)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    Promise.all([
      gridService.getTickets({ open_for_task: true, per_page: 100, search }),
      gridService.getUsers({ per_page: 50, role: 'Técnico de manutenção' }),
    ])
      .then(([ticketRes, userRes]) => {
        setTickets(ticketRes.data)
        setTechnicians(userRes.data.length ? userRes.data : userRes.data)
        gridService.getUsers({ per_page: 50 }).then((all) => {
          if (!userRes.data.length) setTechnicians(all.data)
        })
      })
      .catch((err) => window.alert(parseApiError(err, 'Nao foi possivel carregar os chamados.')))
      .finally(() => setLoading(false))
  }, [open, search])

  useEffect(() => {
    if (!selected) return
    setDescription(selected.summary)
    setAssignee(selected.assignee || '')
  }, [selectedId])

  const handleCreate = async () => {
    if (!selected) {
      window.alert('Selecione um chamado aberto.')
      return
    }
    if (!assignee.trim()) {
      window.alert('Informe o responsável pela tarefa.')
      return
    }

    if (inventoryItems.length > 0) {
      const catalogRes = await gridService.getInventory({ per_page: 100 })
      if (!guardInventoryBeforeSubmit(inventoryItems, catalogRes.data)) {
        return
      }
    }

    setSaving(true)
    try {
      await gridService.createTaskFromTicket(selected.id, {
        assignee: assignee.trim(),
        description: description.trim(),
        column: 'a_fazer',
        inventory_items: inventoryItems,
      })
      onCreated()
      onClose()
      setSelectedId(null)
      setInventoryItems([])
    } catch (e: unknown) {
      window.alert(parseApiError(e, 'Nao foi possivel criar a tarefa.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <ConnectDrawer
      open={open}
      onClose={onClose}
      title="Nova tarefa a partir de chamado"
      subtitle="Selecione um chamado aberto e defina o responsável e materiais."
      footer={
        <div className="flex justify-end gap-2">
          <OutlineButton onClick={onClose}>Cancelar</OutlineButton>
          <PrimaryButton onClick={() => void handleCreate()} disabled={saving || !selected}>
            {saving ? 'Criando...' : 'Criar tarefa'}
          </PrimaryButton>
        </div>
      }
    >
      <div className="space-y-6">
        <FormField label="Buscar chamado">
          <input
            className={inputClass}
            placeholder="Código, título ou solicitante..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </FormField>

        <div className="max-h-[240px] space-y-2 overflow-y-auto rounded-xl border border-hub-border/50 p-2">
          {loading ? (
            <p className="p-4 text-center text-sm text-hub-text-muted">Carregando chamados...</p>
          ) : tickets.length === 0 ? (
            <p className="p-4 text-center text-sm text-hub-text-muted">Nenhum chamado aberto encontrado.</p>
          ) : (
            tickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => setSelectedId(ticket.id)}
                className={`w-full rounded-xl border p-3 text-left transition-colors ${
                  selectedId === ticket.id
                    ? 'border-hub-red bg-hub-red/5 ring-1 ring-hub-red/30'
                    : 'border-hub-border/40 hover:bg-white/50'
                }`}
              >
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-hub-red">{ticket.code}</span>
                  <GridPriorityBadge priority={ticket.priority} />
                  <GridTicketStatusBadge status={ticket.status} />
                </div>
                <p className="font-semibold text-hub-navy">{ticket.title}</p>
                <p className="text-xs text-hub-text-muted">
                  {ticket.requester} · Sala {ticket.room}/{ticket.block}
                </p>
              </button>
            ))
          )}
        </div>

        {selected && (
          <div className="glass-panel-solid space-y-4 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-hub-navy">
              <ClipboardList className="h-4 w-4 text-hub-red" />
              Chamado {selected.code}
            </div>
            <FormField label="Responsável (técnico)" required>
              <select className={selectClass} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                <option value="">Selecione o técnico</option>
                {technicians.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} — {u.role}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Descrição / observações da tarefa">
              <textarea
                className={`${inputClass} min-h-[72px] py-2`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes do atendimento..."
              />
            </FormField>
            <FormField label="Materiais do estoque (opcional)">
              <GridInventoryPicker value={inventoryItems} onChange={setInventoryItems} />
            </FormField>
          </div>
        )}
      </div>
    </ConnectDrawer>
  )
}
