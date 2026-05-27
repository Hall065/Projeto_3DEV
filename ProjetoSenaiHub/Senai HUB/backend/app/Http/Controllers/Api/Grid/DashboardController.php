<?php

namespace App\Http\Controllers\Api\Grid;

use App\Http\Controllers\Controller;
use App\Http\Resources\Grid\GridTicketResource;
use App\Models\Grid\GridInventoryItem;
use App\Models\Grid\GridTask;
use App\Models\Grid\GridTicket;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $totalTickets = GridTicket::query()->count();
        $openTickets = GridTicket::query()->where('status', 'aberto')->count();
        $pendingTickets = GridTicket::query()->where('status', 'pendente')->count();
        $inProgress = GridTicket::query()->where('status', 'em_atendimento')->count();
        $awaitingApproval = GridTicket::query()->where('status', 'aguardando_aprovacao')->count();
        $awaitingEvaluation = GridTicket::query()->where('status', 'avaliacao_pendente')->count();
        $finished = GridTicket::query()->where('status', 'concluido')->count();
        $completedMonth = GridTicket::query()
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
        $urgentTickets = GridTicket::query()
            ->where('priority', 'alta')
            ->whereIn('status', ['aberto', 'pendente', 'em_atendimento', 'aguardando_aprovacao', 'avaliacao_pendente'])
            ->count();

        $reportKpis = [
            'created' => $totalTickets,
            'pending' => $pendingTickets,
            'without_technician' => GridTicket::query()
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

        $recentTickets = GridTicket::query()
            ->orderByDesc('opened_at')
            ->limit(5)
            ->get();

        $statusColors = config('chart_palette.grid_status');
        $priorityColors = config('chart_palette.grid_priority');

        $maintenanceBreakdown = $this->breakdownByField('status', [
            'aberto' => ['label' => 'Abertos', 'color' => $statusColors['aberto']],
            'pendente' => ['label' => 'Pendentes', 'color' => $statusColors['pendente']],
            'em_atendimento' => ['label' => 'Em atendimento', 'color' => $statusColors['em_atendimento']],
            'em_andamento' => ['label' => 'Em atendimento', 'color' => $statusColors['em_atendimento']],
            'aguardando_aprovacao' => ['label' => 'Aguardando aprovação', 'color' => $statusColors['aguardando_aprovacao']],
            'avaliacao_pendente' => ['label' => 'Avaliação pendente', 'color' => $statusColors['avaliacao_pendente']],
            'concluido' => ['label' => 'Finalizados', 'color' => $statusColors['concluido']],
        ]);

        $priorityBreakdown = $this->breakdownByField('priority', [
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

        $urgentItems = GridTicket::query()
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

        $activities = GridTask::query()
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
                'kpi_trends' => $this->computeKpiTrends($openTickets, $inProgress, $completedMonth, $lowStock),
                'kpi_sparklines' => [
                    'open_tickets' => $this->weeklyTicketsOpenedSeries(),
                    'in_progress' => $this->weeklyTicketsStartedSeries(),
                    'completed_month' => $this->weeklyCompletedSeries(),
                    'low_stock' => $this->weeklyLowStockSeries(),
                    'urgent' => $this->weeklyUrgentTicketsSeries(),
                ],
                'recent_tickets' => $recentTickets
                    ->map(fn ($ticket) => (new GridTicketResource($ticket))->resolve())
                    ->values()
                    ->all(),
                'maintenance_breakdown' => $maintenanceBreakdown,
                'priority_breakdown' => $priorityBreakdown,
                'tasks_by_column' => $this->tasksByColumn(),
                'low_stock_items' => $lowStockItems,
                'urgent_items' => $urgentItems,
                'activities' => $activities,
                'tickets_by_month' => $this->ticketsByMonth(6),
                'tickets_by_technician' => $this->ticketsByTechnician(),
                'top_inventory' => $this->topLowStockItems(),
            ],
        ]);
    }

    /**
     * @param  array<string, array{label: string, color: string}>  $map
     * @return list<array{label: string, value: int, count: int, color: string}>
     */
    private function breakdownByField(string $field, array $map): array
    {
        $counts = GridTicket::query()
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
    private function tasksByColumn(): array
    {
        $labels = [
            'a_fazer' => 'A fazer',
            'em_andamento' => 'Em andamento',
            'concluidas' => 'Concluídas',
        ];

        $counts = GridTask::query()
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
    private function ticketsByMonth(int $months): array
    {
        $result = [];
        $monthsPt = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        for ($m = $months - 1; $m >= 0; $m--) {
            $start = Carbon::now()->subMonths($m)->startOfMonth();
            $end = Carbon::now()->subMonths($m)->endOfMonth();
            $count = GridTicket::query()
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
    private function ticketsByTechnician(): array
    {
        return GridTicket::query()
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
    private function computeKpiTrends(int $open, int $inProgress, int $completed, int $lowStock): array
    {
        $now = Carbon::now();
        $thisMonthStart = $now->copy()->startOfMonth();
        $lastMonthStart = $now->copy()->subMonth()->startOfMonth();
        $lastMonthEnd = $now->copy()->subMonth()->endOfMonth();

        $completedThis = GridTicket::query()
            ->where('status', 'concluido')
            ->where(function ($q) use ($thisMonthStart) {
                $q->where('evaluated_at', '>=', $thisMonthStart)
                    ->orWhere(function ($q2) use ($thisMonthStart) {
                        $q2->whereNull('evaluated_at')->where('updated_at', '>=', $thisMonthStart);
                    });
            })
            ->count();
        $completedLast = GridTicket::query()
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
     * Chamados abertos por semana (data de abertura).
     *
     * @return list<int>
     */
    private function weeklyTicketsOpenedSeries(int $weeks = 8): array
    {
        $points = [];

        for ($w = $weeks - 1; $w >= 0; $w--) {
            $start = Carbon::now()->subWeeks($w)->startOfWeek();
            $end = Carbon::now()->subWeeks($w)->endOfWeek();
            $points[] = (int) GridTicket::query()
                ->whereBetween('opened_at', [$start, $end])
                ->count();
        }

        return $points;
    }

    /**
     * Chamados que entraram em atendimento na semana (started_at).
     *
     * @return list<int>
     */
    private function weeklyTicketsStartedSeries(int $weeks = 8): array
    {
        $points = [];

        for ($w = $weeks - 1; $w >= 0; $w--) {
            $start = Carbon::now()->subWeeks($w)->startOfWeek();
            $end = Carbon::now()->subWeeks($w)->endOfWeek();
            $points[] = (int) GridTicket::query()
                ->whereNotNull('started_at')
                ->whereBetween('started_at', [$start, $end])
                ->count();
        }

        return $points;
    }

    /**
     * Novos chamados de prioridade alta por semana.
     *
     * @return list<int>
     */
    private function weeklyUrgentTicketsSeries(int $weeks = 8): array
    {
        $points = [];

        for ($w = $weeks - 1; $w >= 0; $w--) {
            $start = Carbon::now()->subWeeks($w)->startOfWeek();
            $end = Carbon::now()->subWeeks($w)->endOfWeek();
            $points[] = (int) GridTicket::query()
                ->where('priority', 'alta')
                ->whereBetween('opened_at', [$start, $end])
                ->count();
        }

        return $points;
    }

    /**
     * @return list<int>
     */
    private function weeklyCompletedSeries(): array
    {
        $weeks = 8;
        $points = [];

        for ($w = $weeks - 1; $w >= 0; $w--) {
            $start = Carbon::now()->subWeeks($w)->startOfWeek();
            $end = Carbon::now()->subWeeks($w)->endOfWeek();
            $points[] = (int) GridTicket::query()
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
     * Itens que entraram em estoque baixo na semana.
     *
     * @return list<int>
     */
    private function weeklyLowStockSeries(int $weeks = 8): array
    {
        $points = [];

        for ($w = $weeks - 1; $w >= 0; $w--) {
            $start = Carbon::now()->subWeeks($w)->startOfWeek();
            $end = Carbon::now()->subWeeks($w)->endOfWeek();
            $points[] = (int) GridInventoryItem::query()
                ->where('status', 'baixo')
                ->whereBetween('updated_at', [$start, $end])
                ->count();
        }

        return $points;
    }
}
