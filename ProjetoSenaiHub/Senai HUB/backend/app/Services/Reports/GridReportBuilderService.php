<?php

namespace App\Services\Reports;

use App\Models\Grid\GridInventoryItem;
use App\Models\Grid\GridTask;
use App\Models\Grid\GridTicket;
use App\Support\Reports\ReportSchemaRegistry;
use Illuminate\Support\Carbon;
class GridReportBuilderService
{
    /**
     * @param  array<string, mixed>  $config
     * @return array<string, mixed>
     */
    public function build(array $config): array
    {
        $from = ! empty($config['from_date']) ? Carbon::parse($config['from_date'])->startOfDay() : null;
        $to = ! empty($config['to_date']) ? Carbon::parse($config['to_date'])->endOfDay() : null;
        $filters = $config['filters'] ?? [];
        $sections = $config['sections'] ?? [];
        $columns = $config['columns'] ?? [];

        $metrics = $this->computeMetrics($filters, $from, $to);

        $built = [];
        foreach ($sections as $sectionId) {
            $section = $this->buildSection($sectionId, $metrics, $filters, $from, $to, $columns);
            if ($section !== null) {
                $built[] = $section;
            }
        }

        return [
            'meta' => [
                'module' => 'grid',
                'module_label' => 'SENAI Grid',
                'title' => $config['title'] ?? 'Relatorio de Manutencao',
                'subtitle' => $config['subtitle'] ?? '',
                'from_date' => $from?->toDateString(),
                'to_date' => $to?->toDateString(),
                'filters' => $this->humanFilters($filters),
                'generated_at' => now()->format('d/m/Y H:i'),
                'sections_count' => count($built),
            ],
            'sections' => $built,
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function computeMetrics(array $filters, ?Carbon $from, ?Carbon $to): array
    {
        $ticketsQuery = $this->ticketsQuery($filters, $from, $to);
        $tickets = $ticketsQuery->get();

        $statusBreakdown = $tickets->groupBy('status')->map(fn ($group, $status) => [
            'label' => $this->statusLabel($status),
            'value' => $group->count(),
            'color' => config("chart_palette.grid_status.{$status}", '#64748b'),
        ])->values()->all();

        $byMonth = $tickets
            ->filter(fn (GridTicket $t) => $t->opened_at !== null)
            ->groupBy(fn (GridTicket $t) => $t->opened_at->format('Y-m'))
            ->map(fn ($group, $month) => [
                'label' => Carbon::createFromFormat('Y-m', $month)->translatedFormat('M/Y'),
                'value' => $group->count(),
            ])
            ->values()
            ->all();

        $byTechnician = $tickets
            ->groupBy(fn (GridTicket $t) => $t->assignee ?: 'Sem responsavel')
            ->map(fn ($group, $name) => ['label' => $name, 'value' => $group->count()])
            ->sortByDesc('value')
            ->values()
            ->take(10)
            ->all();

        return [
            'tickets' => $tickets,
            'total_tickets' => $tickets->count(),
            'open' => $tickets->where('status', 'aberto')->count(),
            'pending' => $tickets->where('status', 'pendente')->count(),
            'in_progress' => $tickets->whereIn('status', ['em_atendimento', 'em_andamento'])->count(),
            'finished' => $tickets->where('status', 'concluido')->count(),
            'urgent' => $tickets->where('priority', 'alta')->whereNotIn('status', ['concluido'])->count(),
            'low_stock' => GridInventoryItem::query()->where('status', 'baixo')->count(),
            'status_breakdown' => $statusBreakdown,
            'by_month' => $byMonth,
            'by_technician' => $byTechnician,
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return \Illuminate\Database\Eloquent\Builder<GridTicket>
     */
    private function ticketsQuery(array $filters, ?Carbon $from, ?Carbon $to)
    {
        $query = GridTicket::query()->orderByDesc('opened_at');

        if ($from) {
            $query->where('opened_at', '>=', $from);
        }
        if ($to) {
            $query->where('opened_at', '<=', $to);
        }
        if (! empty($filters['ticket_status'])) {
            $query->where('status', $filters['ticket_status']);
        }
        if (! empty($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }
        if (! empty($filters['block'])) {
            $query->where('block', 'like', '%'.$filters['block'].'%');
        }

        return $query;
    }

    /**
     * @param  array<string, mixed>  $metrics
     * @param  array<string, list<string>>  $columns
     * @return array<string, mixed>|null
     */
    private function buildSection(
        string $id,
        array $metrics,
        array $filters,
        ?Carbon $from,
        ?Carbon $to,
        array $columns,
    ): ?array {
        return match ($id) {
            'cover' => ['id' => $id, 'type' => 'cover', 'title' => 'Capa'],
            'executive_summary' => [
                'id' => $id,
                'type' => 'summary',
                'title' => 'Resumo executivo',
                'paragraphs' => [
                    "Foram identificados {$metrics['total_tickets']} chamado(s) no recorte, sendo {$metrics['open']} aberto(s) e {$metrics['finished']} concluido(s).",
                    "{$metrics['in_progress']} chamado(s) em atendimento e {$metrics['urgent']} urgente(s) ainda em aberto.",
                    "O estoque registra {$metrics['low_stock']} item(ns) em nivel critico.",
                ],
            ],
            'kpi_cards' => [
                'id' => $id,
                'type' => 'kpis',
                'title' => 'Indicadores',
                'items' => [
                    ['label' => 'Total de chamados', 'value' => (string) $metrics['total_tickets'], 'variant' => 'blue'],
                    ['label' => 'Abertos', 'value' => (string) $metrics['open'], 'variant' => 'amber'],
                    ['label' => 'Em atendimento', 'value' => (string) $metrics['in_progress'], 'variant' => 'coral'],
                    ['label' => 'Concluidos', 'value' => (string) $metrics['finished'], 'variant' => 'green'],
                    ['label' => 'Urgentes', 'value' => (string) $metrics['urgent'], 'variant' => 'senai'],
                    ['label' => 'Estoque critico', 'value' => (string) $metrics['low_stock'], 'variant' => 'violet'],
                ],
            ],
            'tickets_by_status_chart' => [
                'id' => $id,
                'type' => 'chart',
                'chart_kind' => 'donut',
                'title' => 'Chamados por status',
                'items' => $metrics['status_breakdown'],
            ],
            'tickets_by_month_chart' => [
                'id' => $id,
                'type' => 'chart',
                'chart_kind' => 'bar',
                'title' => 'Chamados por mes',
                'items' => $metrics['by_month'],
            ],
            'tickets_by_technician_chart' => [
                'id' => $id,
                'type' => 'chart',
                'chart_kind' => 'bar_horizontal',
                'title' => 'Por tecnico',
                'items' => $metrics['by_technician'],
            ],
            'tickets_table' => $this->tableSection($id, 'Chamados', $this->ticketsRows($metrics['tickets']), $columns['tickets_table'] ?? null, 'tickets_table'),
            'tasks_table' => $this->tableSection($id, 'Tarefas', $this->tasksRows($filters, $from, $to), $columns['tasks_table'] ?? null, 'tasks_table'),
            'inventory_table' => $this->tableSection($id, 'Estoque', $this->inventoryRows(), $columns['inventory_table'] ?? null, 'inventory_table'),
            'low_stock_table' => $this->tableSection($id, 'Estoque critico', $this->lowStockRows(), ['titulo', 'disponivel', 'minimo', 'local', 'status'], null),
            default => null,
        };
    }

    /**
     * @param  \Illuminate\Support\Collection<int, GridTicket>  $tickets
     * @return list<array<string, string>>
     */
    private function ticketsRows($tickets): array
    {
        return $tickets->map(fn (GridTicket $t) => [
            'codigo' => $t->code,
            'titulo' => $t->title,
            'solicitante' => $t->requester,
            'responsavel' => $t->assignee ?? '',
            'prioridade' => $t->priority,
            'status' => $this->statusLabel($t->status),
            'sala' => $t->room ?? '',
            'bloco' => $t->block ?? '',
            'aberto_em' => $t->opened_at?->format('d/m/Y H:i') ?? '',
        ])->values()->all();
    }

    /**
     * @return list<array<string, string>>
     */
    private function tasksRows(array $filters, ?Carbon $from, ?Carbon $to): array
    {
        $query = GridTask::query()->with('ticket')->orderByDesc('opened_at');

        if ($from) {
            $query->where('opened_at', '>=', $from);
        }
        if ($to) {
            $query->where('opened_at', '<=', $to);
        }

        return $query->limit(500)->get()->map(fn (GridTask $t) => [
            'codigo' => $t->code,
            'titulo' => $t->title,
            'chamado' => $t->ticket?->code ?? '',
            'responsavel' => $t->assignee ?? '',
            'coluna' => $t->column,
            'prioridade' => $t->priority,
            'status' => $t->status_label ?? '',
        ])->all();
    }

    /**
     * @return list<array<string, string>>
     */
    private function inventoryRows(): array
    {
        return GridInventoryItem::query()->orderBy('title')->get()->map(fn (GridInventoryItem $i) => [
            'titulo' => $i->title,
            'categoria' => $i->category ?? '',
            'disponivel' => (string) $i->qty_available,
            'minimo' => (string) $i->qty_min,
            'local' => $i->location ?? '',
            'status' => $i->status,
        ])->all();
    }

    /**
     * @return list<array<string, string>>
     */
    private function lowStockRows(): array
    {
        return GridInventoryItem::query()
            ->where('status', 'baixo')
            ->orderBy('qty_available')
            ->get()
            ->map(fn (GridInventoryItem $i) => [
                'titulo' => $i->title,
                'disponivel' => (string) $i->qty_available,
                'minimo' => (string) $i->qty_min,
                'local' => $i->location ?? '',
                'status' => $i->status,
            ])
            ->all();
    }

    /**
     * @param  list<array<string, string>>  $rows
     * @param  list<string>|null  $selectedColumns
     */
    private function tableSection(string $id, string $title, array $rows, ?array $selectedColumns, ?string $schemaKey): array
    {
        $allColumns = $this->columnDefs($schemaKey, $rows);
        $keys = $selectedColumns ?? array_column($allColumns, 'key');

        return [
            'id' => $id,
            'type' => 'table',
            'title' => $title,
            'columns' => array_values(array_filter($allColumns, fn ($c) => in_array($c['key'], $keys, true))),
            'rows' => array_map(function (array $row) use ($keys) {
                $filtered = [];
                foreach ($keys as $key) {
                    $filtered[$key] = $row[$key] ?? '';
                }

                return $filtered;
            }, $rows),
            'total_rows' => count($rows),
        ];
    }

    /**
     * @param  list<array<string, string>>  $rows
     * @return list<array{key: string, label: string}>
     */
    private function columnDefs(?string $schemaKey, array $rows): array
    {
        if ($schemaKey) {
            $schema = ReportSchemaRegistry::schema('grid');
            foreach ($schema['sections'] ?? [] as $section) {
                if (($section['id'] ?? '') === $schemaKey && ! empty($section['columns'])) {
                    return array_map(fn ($c) => ['key' => $c['key'], 'label' => $c['label']], $section['columns']);
                }
            }
        }

        if ($rows === []) {
            return [];
        }

        return array_map(fn ($key) => ['key' => $key, 'label' => $key], array_keys($rows[0]));
    }

    private function statusLabel(string $status): string
    {
        return match ($status) {
            'aberto' => 'Aberto',
            'pendente' => 'Pendente',
            'em_atendimento', 'em_andamento' => 'Em atendimento',
            'aguardando_aprovacao' => 'Aguardando aprovacao',
            'avaliacao_pendente' => 'Avaliacao pendente',
            'concluido' => 'Concluido',
            default => $status,
        };
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return list<array{label: string, value: string}>
     */
    private function humanFilters(array $filters): array
    {
        $out = [];
        if (! empty($filters['ticket_status'])) {
            $out[] = ['label' => 'Status', 'value' => $this->statusLabel((string) $filters['ticket_status'])];
        }
        if (! empty($filters['priority'])) {
            $out[] = ['label' => 'Prioridade', 'value' => (string) $filters['priority']];
        }
        if (! empty($filters['block'])) {
            $out[] = ['label' => 'Bloco', 'value' => (string) $filters['block']];
        }

        return $out;
    }
}
