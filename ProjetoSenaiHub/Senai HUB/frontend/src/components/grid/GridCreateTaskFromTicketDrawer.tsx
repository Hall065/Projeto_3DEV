import { ClipboardList } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GRID_API_ROLE_TECHNICIAN } from '../../constants/gridRoles'
import { ConnectDrawer } from '../connect/ConnectDrawer'
import { FormField, inputClass, OutlineButton, PrimaryButton, selectClass } from '../connect/ConnectShared'
import { GridPriorityBadge, GridTicketStatusBadge } from './GridBadges'
import { GridInventoryPicker, guardInventoryBeforeSubmit } from './GridInventoryPicker'
import { useConfirmAction } from '../../hooks/useConfirmAction'
import { useCrudToast } from '../../hooks/useCrudToast'
import { gridService } from '../../services/gridService'
import type { GridInventoryLine, GridTicket, GridUser } from '../../types/grid'

export function GridCreateTaskFromTicketDrawer({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const { t } = useTranslation()
  const crudToast = useCrudToast()
  const { confirmAction } = useConfirmAction()
  const [tickets, setTickets] = useState<GridTicket[]>([])
  const [technicians, setTechnicians] = useState<GridUser[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [assignee, setAssignee] = useState('')
  const [description, setDescription] = useState('')
  const [inventoryItems, setInventoryItems] = useState<GridInventoryLine[]>([])

  const selected = tickets.find((ticket) => ticket.id === selectedId)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    Promise.all([
      gridService.getTickets({ open_for_task: true, per_page: 100, search }),
      gridService.getUsers({ per_page: 50, role: GRID_API_ROLE_TECHNICIAN }),
    ])
      .then(([ticketRes, userRes]) => {
        setTickets(ticketRes.data)
        setTechnicians(userRes.data.length ? userRes.data : userRes.data)
        gridService.getUsers({ per_page: 50 }).then((all) => {
          if (!userRes.data.length) setTechnicians(all.data)
        })
      })
      .catch((err) => crudToast.notifyError(err, t('gridComponents.createTaskFromTicket.loadError')))
      .finally(() => setLoading(false))
  }, [open, search, crudToast, t])

  useEffect(() => {
    if (!selected) return
    setDescription(selected.summary)
    setAssignee(selected.assignee || '')
  }, [selectedId, selected])

  const handleCreate = async () => {
    if (!selected) {
      crudToast.notifyWarning(t('gridComponents.createTaskFromTicket.selectTicket'))
      return
    }
    if (!assignee.trim()) {
      crudToast.notifyWarning(t('gridComponents.createTaskFromTicket.assigneeRequired'))
      return
    }

    if (inventoryItems.length > 0) {
      const catalogRes = await gridService.getInventory({ per_page: 100 })
      if (!(await guardInventoryBeforeSubmit(inventoryItems, catalogRes.data, crudToast, confirmAction))) {
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
      crudToast.notifySaved(false)
    } catch (e: unknown) {
      crudToast.notifyError(e, t('gridComponents.createTaskFromTicket.saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <ConnectDrawer
      open={open}
      onClose={onClose}
      title={t('gridComponents.createTaskFromTicket.title')}
      subtitle={t('gridComponents.createTaskFromTicket.subtitle')}
      footer={
        <div className="flex justify-end gap-2">
          <OutlineButton onClick={onClose}>{t('common.cancel')}</OutlineButton>
          <PrimaryButton onClick={() => void handleCreate()} disabled={saving || !selected}>
            {saving ? t('gridComponents.createTaskFromTicket.creating') : t('gridComponents.createTaskFromTicket.createTask')}
          </PrimaryButton>
        </div>
      }
    >
      <div className="space-y-6">
        <FormField label={t('gridComponents.createTaskFromTicket.searchTicket')}>
          <input
            className={inputClass}
            placeholder={t('gridComponents.createTaskFromTicket.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </FormField>

        <div className="max-h-[240px] space-y-2 overflow-y-auto rounded-xl border border-hub-border/50 p-2">
          {loading ? (
            <p className="p-4 text-center text-sm text-hub-text-muted">
              {t('gridComponents.createTaskFromTicket.loadingTickets')}
            </p>
          ) : tickets.length === 0 ? (
            <p className="p-4 text-center text-sm text-hub-text-muted">
              {t('gridComponents.createTaskFromTicket.noOpenTickets')}
            </p>
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
                  {t('gridComponents.createTaskFromTicket.roomBlock', {
                    requester: ticket.requester,
                    room: ticket.room,
                    block: ticket.block,
                  })}
                </p>
              </button>
            ))
          )}
        </div>

        {selected && (
          <div className="glass-panel-solid space-y-4 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-hub-navy">
              <ClipboardList className="h-4 w-4 text-hub-red" />
              {t('gridComponents.createTaskFromTicket.ticketLabel', { code: selected.code })}
            </div>
            <FormField label={t('gridComponents.createTaskFromTicket.assignee')} required>
              <select className={selectClass} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                <option value="">{t('gridComponents.createTaskFromTicket.selectTechnician')}</option>
                {technicians.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} — {u.role}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label={t('gridComponents.createTaskFromTicket.taskDescription')}>
              <textarea
                className={`${inputClass} min-h-[72px] py-2`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('gridComponents.createTaskFromTicket.taskPlaceholder')}
              />
            </FormField>
            <FormField label={t('gridComponents.createTaskFromTicket.materialsOptional')}>
              <GridInventoryPicker value={inventoryItems} onChange={setInventoryItems} />
            </FormField>
          </div>
        )}
      </div>
    </ConnectDrawer>
  )
}
