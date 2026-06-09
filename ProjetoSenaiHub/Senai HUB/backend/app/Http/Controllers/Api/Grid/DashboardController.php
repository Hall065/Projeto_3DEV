<?php

namespace App\Http\Controllers\Api\Grid;

use App\Http\Controllers\Controller;
use App\Http\Resources\Grid\GridTicketResource;
use App\Models\Grid\GridInventoryItem;
use App\Models\Grid\GridTask;
use App\Models\Grid\GridTicket;
use App\Models\User;
use App\Support\UserAccessScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $tickets = fn () => UserAccessScope::gridTicketQuery($user);
        $tasks = fn () => UserAccessScope::gridTaskQuery($user);

        $totalTickets = $tickets()->count();
        $openTickets = $tickets()->where('status', 'aberto')->count();
        $pendingTickets = $tickets()->where('status', 'pendente')->count();
        $inProgress = $tickets()->where('status', 'em_atendimento')->count();
        $awaitingApproval = $tickets()->where('status', 'aguardando_aprovacao')->count();
        $awaitingEvaluation = $tickets()->where('status', 'avaliacao_pendente')->count();
        $finished = $tickets()->where('status', 'concluido')->count();
        $completedMonth = $tickets()
            ->where('status', 'concluido')
            ->where(function ($q) {
                $q->where('evaluated_at', '>=', Carbon::now()->startOfMonth())
                    ->orWhere(function ($q2) {
                        $q2->whereNull('evaluated_at')
                            ->where('updated_at', '>=', Carbon::now()->startOfMonth());
                    });
            })
            ->count();
        $lowStock = GridInventoryItem::query()->where('status', 'baixo')->count();
        $reservedInventory = GridInventoryItem::query()->where('qty_reserved', '>', 0)->count();
        $urgentTickets = $tickets()
            ->where('priority', 'alta')
            ->whereIn('status', ['aberto', 'pendente', 'em_atendimento', 'aguardando_aprovacao', 'avaliacao_pendente'])
            ->count();

        $reportKpis = [
            'created' => $totalTickets,
            'pending' => $pendingTickets,
            'without_technician' => $tickets()
                ->where('status', 'aberto')
                ->where(function ($q) {
                    $q->whereNull('assignee')->orWhere('assignee', '');
                })
                ->count(),
            'in_progress' => $inProgress,
            'awaiting_approval' => $awaitingApproval,
            'awaiting_evaluation' => $awaitingEvaluation,
            'finished' => $finished,
            'urgent' => $urgentTickets,
        ];

        $recentTickets = $tickets()
            ->orderByDesc('opened_at')
            ->limit(5)
            ->get();

        $statusColors = config('chart_palette.grid_status');
        $priorityColors = config('chart_palette.grid_priority');

        $maintenanceBreakdown = $this->breakdownByField($user, 'status', [
            'aberto' => ['label' => 'Abertos', 'color' => $statusColors['aberto']],
            'pendente' => ['label' => 'Pendentes', 'color' => $statusColors['pendente']],
            'em_atendimento' => ['label' => 'Em atendimento', 'color' => $statusColors['em_atendimento']],
            'em_andamento' => ['label' => 'Em atendimento', 'color' => $statusColors['em_atendimento']],
            'aguardando_aprovacao' => ['label' => 'Aguardando aprovação', 'color' => $statusColors['aguardando_aprovacao']],
            'avaliacao_pendente' => ['label' => 'Avaliação pendente', 'color' => $statusColors['avaliacao_pendente']],
            'concluido' => ['label' => 'Finalizados', 'color' => $statusColors['concluido']],
        ]);

        $priorityBreakdown = $this->breakdownByField($user, 'priority', [
            'alta' => ['label' => 'Alta', 'color' => $priorityColors['alta']],
            'media' => ['label' => 'Média', 'color' => $priorityColors['media']],
            'baixa' => ['label' => 'Baixa', 'color' => $priorityColors['baixa']],
        ]);

        $lowStockItems = GridInventoryItem::query()
            ->where('status', 'baixo')
            ->orderBy('qty_available')
            ->limit(5)
            ->get()
            ->map(fn ($item) => [
                'id' => (string) $item->id,
                'category' => $item->title,
                'current' => $item->qty_available,
                'minimum' => $item->qty_min,
                'unit' => 'un',
            ]);

        $urgentItems = $tickets()
            ->where('priority', 'alta')
            ->whereIn('status', ['aberto', 'pendente', 'em_atendimento', 'aguardando_aprovacao', 'avaliacao_pendente'])
            ->orderByDesc('opened_at')
            ->limit(5)
            ->get()
            ->map(fn ($ticket) => [
                'id' => (string) $ticket->id,
                'title' => $ticket->title,
                'priority' => $ticket->priority,
                'when' => $ticket->opened_at?->isToday() ? 'Hoje' : $ticket->opened_at?->diffForHumans(),
            ]);

        $activities = $tasks()
            ->where('column', 'em_andamento')
            ->orderByDesc('updated_at')
            ->limit(8)
            ->get()
            ->map(fn ($task) => [
                'id' => (string) $task->id,
                'code' => $task->code,
                'title' => $task->title,
                'assignee' => $task->assignee,
                'column' => $task->column,
                'status_label' => $task->status_label,
                'room' => $task->room,
                'block' => $task->block,
            ]);

        return response()->json([
            'data' => [
                'kpis' => [
                    'total_tickets' => $totalTickets,
                    'open_tickets' => $openTickets,
                    'pending_tickets' => $pendingTickets,
                    'in_progress' => $inProgress,
                    'awaiting_evaluation' => $awaitingEvaluation,
                    'finished' => $finished,
                    'completed_month' => $completedMonth,
                    'low_stock' => $lowStock,
                    'reserved_inventory' => $reservedInventory,
                    'urgent_tickets' => $urgentTickets,
                ],
                'report_kpis' => $reportKpis,
                'kpi_trends' => $this->computeKpiTrends($user, $openTickets, $inProgress, $completedMonth, $lowStock),
                'kpi_sparklines' => [
                    'open_tickets' => $this->weeklyOpenTicketsSnapshotSeries($user),
                    'in_progress' => $this->weeklyInProgressSnapshotSeries($user),
                    'completed_month' => $this->weeklyCompletedSeries($user),
                    'low_stock' => $this->weeklyLowStockSnapshotSeries(),
                    'urgent' => $this->weeklyUrgentTicketsSnapshotSeries($user),
                ],
                'recent_tickets' => $recentTickets
                    ->map(fn ($ticket) => (new GridTicketResource($ticket))->resolve())
                    ->values()
                    ->all(),
                'maintenance_breakdown' => $maintenanceBreakdown,
                'priority_breakdown' => $priorityBreakdown,
                'tasks_by_column' => $this->tasksByColumn($user),
                'low_stock_items' => $lowStockItems,
                'urgent_items' => $urgentItems,
                'activities' => $activities,
                'tickets_by_month' => $this->ticketsByMonth($user, 6),
                'tickets_by_technician' => $this->ticketsByTechnician($user),
                'top_inventory' => $this->topLowStockItems(),
            ],
        ]);
    }

    /**
     * @param  array<string, array{label: string, color: string}>  $map
     * @return list<array{label: string, value: int, count: int, color: string}>
     */
    private function breakdownByField(User $user, string $field, array $map): array
    {
        $counts = UserAccessScope::gridTicketQuery($user)
            ->select($field, DB::raw('count(*) as total'))
            ->groupBy($field)
            ->pluck('total', $field);

        $total = max((int) $counts->sum(), 1);

        $result = [];

        foreach ($map as $key => $meta) {
            $count = (int) ($counts[$key] ?? 0);
            if ($count === 0) {
                continue;
            }
            $result[] = [
                'label' => $meta['label'],
                'value' => (int) round(($count / $total) * 100),
                'count' => $count,
                'color' => $meta['color'],
            ];
        }

        return $result;
    }

    /**
     * @return list<array{label: string, count: int}>
     */
    private function tasksByColumn(User $user): array
    {
        $labels = [
            'a_fazer' => 'A fazer',
            'em_andamento' => 'Em andamento',
            'concluidas' => 'Concluídas',
        ];

        $counts = UserAccessScope::gridTaskQuery($user)
            ->select('column', DB::raw('count(*) as total'))
            ->groupBy('column')
            ->pluck('total', 'column');

        $result = [];
        foreach ($labels as $key => $label) {
            $result[] = [
                'label' => $label,
                'count' => (int) ($counts[$key] ?? 0),
            ];
        }

        return $result;
    }

    /**
     * @return list<array{label: string, count: int}>
     */
    private function ticketsByMonth(User $user, int $months): array
    {
        $result = [];
        $monthsPt = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        for ($m = $months - 1; $m >= 0; $m--) {
            $start = Carbon::now()->subMonths($m)->startOfMonth();
            $end = Carbon::now()->subMonths($m)->endOfMonth();
            $count = UserAccessScope::gridTicketQuery($user)
                ->whereBetween('created_at', [$start, $end])
                ->count();
            $result[] = [
                'label' => $monthsPt[$start->month - 1].'/'.$start->format('y'),
                'count' => $count,
            ];
        }

        return $result;
    }

    /**
     * @return list<array{name: string, count: int}>
     */
    private function ticketsByTechnician(User $user): array
    {
        return UserAccessScope::gridTicketQuery($user)
            ->select('assignee', DB::raw('count(*) as count'))
            ->whereNotNull('assignee')
            ->where('assignee', '!=', '')
            ->groupBy('assignee')
            ->orderByDesc('count')
            ->limit(8)
            ->get()
            ->map(fn ($row) => [
                'name' => $row->assignee,
                'count' => (int) $row->count,
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array{name: string, count: int}>
     */
    private function topLowStockItems(): array
    {
        return GridInventoryItem::query()
            ->where('status', 'baixo')
            ->orderBy('qty_available')
            ->limit(6)
            ->get()
            ->map(fn ($item) => [
                'name' => $item->title,
                'count' => $item->qty_available,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<string, array{direction: string, value: string, label: string}>
     */
    private function computeKpiTrends(User $user, int $open, int $inProgress, int $completed, int $lowStock): array
    {
        $now = Carbon::now();
        $thisMonthStart = $now->copy()->startOfMonth();
        $lastMonthStart = $now->copy()->subMonth()->startOfMonth();
        $lastMonthEnd = $now->copy()->subMonth()->endOfMonth();

        $completedThis = UserAccessScope::gridTicketQuery($user)
            ->where('status', 'concluido')
            ->where(function ($q) use ($thisMonthStart) {
                $q->where('evaluated_at', '>=', $thisMonthStart)
                    ->orWhere(function ($q2) use ($thisMonthStart) {
                        $q2->whereNull('evaluated_at')->where('updated_at', '>=', $thisMonthStart);
                    });
            })
            ->count();
        $completedLast = UserAccessScope::gridTicketQuery($user)
            ->where('status', 'concluido')
            ->where(function ($q) use ($lastMonthStart, $lastMonthEnd) {
                $q->whereBetween('evaluated_at', [$lastMonthStart, $lastMonthEnd])
                    ->orWhere(function ($q2) use ($lastMonthStart, $lastMonthEnd) {
                        $q2->whereNull('evaluated_at')->whereBetween('updated_at', [$lastMonthStart, $lastMonthEnd]);
                    });
            })
            ->count();

        return [
            'open_tickets' => ['direction' => 'neutral', 'value' => (string) $open, 'label' => 'abertos agora'],
            'in_progress' => ['direction' => 'neutral', 'value' => (string) $inProgress, 'label' => 'em execução'],
            'completed_month' => $this->growthTrend($completedThis, $completedLast, 'vs. mês anterior'),
            'low_stock' => ['direction' => $lowStock > 0 ? 'up' : 'neutral', 'value' => (string) $lowStock, 'label' => 'itens críticos'],
        ];
    }

    /**
     * @return array{direction: string, value: string, label: string}
     */
    private function growthTrend(int $current, int $previous, string $label): array
    {
        if ($previous === 0) {
            return [
                'direction' => $current > 0 ? 'up' : 'neutral',
                'value' => (string) $current,
                'label' => $label,
            ];
        }

        $pct = round((($current - $previous) / $previous) * 100, 1);

        return [
            'direction' => $pct > 0 ? 'up' : ($pct < 0 ? 'down' : 'neutral'),
            'value' => number_format(abs($pct), 1, ',', '.').'%',
            'label' => $label,
        ];
    }

    /**
     * Total de chamados abertos ao fim de cada semana (alinhado ao KPI do card).
     *
     * @return list<int>
     */
    private function weeklyOpenTicketsSnapshotSeries(User $user, int $weeks = 8): array
    {
        $points = [];

        for ($w = $weeks - 1; $w >= 0; $w--) {
            $end = Carbon::now()->subWeeks($w)->endOfWeek();
            $points[] = (int) UserAccessScope::gridTicketQuery($user)
                ->where('status', 'aberto')
                ->where('opened_at', '<=', $end)
                ->count();
        }

        return $points;
    }

    /**
     * Chamados em atendimento ao fim de cada semana.
     *
     * @return list<int>
     */
    private function weeklyInProgressSnapshotSeries(User $user, int $weeks = 8): array
    {
        $points = [];

        for ($w = $weeks - 1; $w >= 0; $w--) {
            $end = Carbon::now()->subWeeks($w)->endOfWeek();
            $points[] = (int) UserAccessScope::gridTicketQuery($user)
                ->where('status', 'em_atendimento')
                ->whereNotNull('started_at')
                ->where('started_at', '<=', $end)
                ->count();
        }

        return $points;
    }

    /**
     * Chamados urgentes em aberto ao fim de cada semana.
     *
     * @return list<int>
     */
    private function weeklyUrgentTicketsSnapshotSeries(User $user, int $weeks = 8): array
    {
        $activeStatuses = ['aberto', 'pendente', 'em_atendimento', 'aguardando_aprovacao', 'avaliacao_pendente'];
        $points = [];

        for ($w = $weeks - 1; $w >= 0; $w--) {
            $end = Carbon::now()->subWeeks($w)->endOfWeek();
            $points[] = (int) UserAccessScope::gridTicketQuery($user)
                ->where('priority', 'alta')
                ->whereIn('status', $activeStatuses)
                ->where('opened_at', '<=', $end)
                ->count();
        }

        return $points;
    }

    /**
     * @return list<int>
     */
    private function weeklyCompletedSeries(User $user): array
    {
        $weeks = 8;
        $points = [];

        for ($w = $weeks - 1; $w >= 0; $w--) {
            $start = Carbon::now()->subWeeks($w)->startOfWeek();
            $end = Carbon::now()->subWeeks($w)->endOfWeek();
            $points[] = (int) UserAccessScope::gridTicketQuery($user)
                ->where('status', 'concluido')
                ->where(function ($q) use ($start, $end) {
                    $q->whereBetween('evaluated_at', [$start, $end])
                        ->orWhere(function ($q2) use ($start, $end) {
                            $q2->whereNull('evaluated_at')->whereBetween('updated_at', [$start, $end]);
                        });
                })
                ->count();
        }

        return $points;
    }

    /**
     * Itens com estoque baixo ao fim de cada semana.
     *
     * @return list<int>
     */
    private function weeklyLowStockSnapshotSeries(int $weeks = 8): array
    {
        $points = [];

        for ($w = $weeks - 1; $w >= 0; $w--) {
            $end = Carbon::now()->subWeeks($w)->endOfWeek();
            $points[] = (int) GridInventoryItem::query()
                ->where('status', 'baixo')
                ->where('updated_at', '<=', $end)
                ->count();
        }

        return $points;
    }
}
