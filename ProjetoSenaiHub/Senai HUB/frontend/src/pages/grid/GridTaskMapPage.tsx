import { AlertTriangle, CheckCircle2, ClipboardList, ListTodo, MapPin, Wrench } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { KpiCard, KpiCardSkeleton } from '../../components/connect/ConnectKpiCard'
import {
  ConnectCard,
  ConnectLoadingSpinner,
  ConnectPageHeader,
} from '../../components/connect/ConnectShared'
import { GridPriorityBadge, GridTicketStatusBadge } from '../../components/grid/GridBadges'
import { MapSimulationBadge } from '../../components/map/MapSimulationBadge'
import { usePublicConfig } from '../../hooks/usePublicConfig'
import { CampusMapContainer } from '../../components/map/CampusMapContainer'
import { gridService } from '../../services/gridService'
import type { GridTaskCard, GridTicket } from '../../types/grid'
import { UserAvatar } from '../../components/ui/UserAvatar'
import { buildCampusTicketMarkers } from '../../utils/campusTicketMarkers'

export function GridTaskMapPage() {
  const { t } = useTranslation()
  const mapConfig = usePublicConfig()
  const [tasks, setTasks] = useState<GridTaskCard[]>([])
  const [tickets, setTickets] = useState<GridTicket[]>([])
  const [stats, setStats] = useState({ total: 0, todo: 0, in_progress: 0, done_today: 0, late: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    gridService
      .getMapData()
      .then((res) => {
        setTasks(res.tasks)
        setTickets(res.tickets)
        setStats(res.stats)
      })
      .finally(() => setLoading(false))
  }, [])

  const ticketMarkers = useMemo(() => buildCampusTicketMarkers(tasks, tickets), [tasks, tickets])
  const recordCount = tasks.length + tickets.length

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title={t('grid.map.title')}
        subtitle={t('grid.map.subtitle')}
      />

      {mapConfig?.campus_map_simulation !== false && <MapSimulationBadge className="mb-4" />}

      <ConnectCard className="mb-6 min-w-0 overflow-hidden p-4 sm:p-6">
        <div className="mb-6">
          {loading ? (
            <ConnectLoadingSpinner label={t('grid.map.loading.map')} className="min-h-[420px]" />
          ) : (
            <CampusMapContainer ticketMarkers={ticketMarkers} minHeight="420px" />
          )}
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold text-hub-navy">
                <MapPin className="h-4 w-4 text-hub-red" />
                {t('grid.map.list.title')}
              </h2>
              <span className="text-sm text-hub-text-muted">{t('grid.map.list.records', { count: recordCount })}</span>
            </div>

            {loading ? (
              <ConnectLoadingSpinner label={t('grid.map.loading.list')} className="min-h-[280px]" />
            ) : (
              <ul className="scrollbar-glass-inset max-h-[400px] space-y-3 overflow-y-auto pr-1">
                {tasks.map((task) => (
                  <li key={`task-${task.id}`} className="glass-panel-solid rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-hub-red">{task.code}</p>
                        <p className="text-sm font-semibold text-hub-navy">{task.title}</p>
                        <p className="text-xs text-hub-text-muted">
                          {t('grid.common.room')} {task.room || '—'} · {t('grid.common.block')} {task.block || '—'}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <UserAvatar name={task.assignee ?? '—'} size="sm" />
                          <span className="text-xs">{task.assignee ?? t('grid.common.noResponsible')}</span>
                          <GridPriorityBadge priority={task.priority} />
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">{task.status_label}</span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
                {tickets.map((ticket) => (
                  <li key={`ticket-${ticket.id}`} className="glass-panel-solid rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-hub-red">{ticket.code}</p>
                        <p className="text-sm font-semibold text-hub-navy">{ticket.title}</p>
                        <p className="text-xs text-hub-text-muted">
                          {t('grid.common.room')} {ticket.room || '—'} · {t('grid.common.block')} {ticket.block || '—'}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <GridTicketStatusBadge status={ticket.status} />
                          <GridPriorityBadge priority={ticket.priority} />
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <Link to="/grid/tarefas" className="font-medium text-hub-red hover:underline">
                {t('grid.map.links.tasks')}
              </Link>
              <Link to="/grid/chamados" className="font-medium text-hub-red hover:underline">
                {t('grid.map.links.tickets')}
              </Link>
            </div>
          </div>
        </div>
      </ConnectCard>

      <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <KpiCardSkeleton key={i} />)
        ) : (
          <>
            <KpiCard icon={ClipboardList} label={t('grid.map.kpis.total')} value={stats.total} variant="blue" to="/grid/tarefas" />
            <KpiCard icon={ListTodo} label={t('grid.map.kpis.todo')} value={stats.todo} variant="violet" />
            <KpiCard icon={Wrench} label={t('grid.map.kpis.inProgress')} value={stats.in_progress} variant="coral" />
            <KpiCard icon={CheckCircle2} label={t('grid.map.kpis.done')} value={stats.done_today} variant="green" />
            <KpiCard icon={AlertTriangle} label={t('grid.map.kpis.overdue')} value={stats.late} variant="senai" />
          </>
        )}
      </div>
    </div>
  )
}
