<?php

namespace App\Services\Grid;

use App\Models\Grid\GridInventoryItem;
use App\Models\Grid\GridInventoryReservation;
use App\Models\Grid\GridTask;
use App\Models\Grid\GridTicket;
use App\Support\GridCode;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class GridWorkflowService
{
    public const TICKET_STATUSES = [
        'aberto',
        'pendente',
        'em_atendimento',
        'aguardando_aprovacao',
        'avaliacao_pendente',
        'concluido',
    ];

    /** Coluna do chamado bloqueada no Kanban até a tarefa ser concluída */
    public const LOCKED_TICKET_STATUS = 'em_atendimento';

    /**
     * @param  list<array{inventory_item_id: int, quantity: int}>  $inventoryItems
     */
    public function assertInventoryLinesAvailable(array $inventoryItems): void
    {
        if ($inventoryItems === []) {
            return;
        }

        $aggregated = [];
        foreach ($inventoryItems as $row) {
            $id = (int) ($row['inventory_item_id'] ?? 0);
            if ($id < 1) {
                continue;
            }
            $aggregated[$id] = ($aggregated[$id] ?? 0) + (int) ($row['quantity'] ?? 0);
        }

        foreach ($aggregated as $itemId => $requestedQty) {
            $inventory = GridInventoryItem::query()->find($itemId);
            if (! $inventory) {
                throw ValidationException::withMessages([
                    'inventory_items' => ["Item de estoque #{$itemId} não encontrado."],
                ]);
            }

            if ($inventory->qty_available <= 0) {
                throw ValidationException::withMessages([
                    'inventory_items' => [
                        "\"{$inventory->title}\" está com estoque zerado. Não é possível incluir na solicitação.",
                    ],
                ]);
            }

            if ($requestedQty > $inventory->qty_available) {
                throw ValidationException::withMessages([
                    'inventory_items' => [
                        "Estoque insuficiente para \"{$inventory->title}\" (solicitado: {$requestedQty}, disponível: {$inventory->qty_available}).",
                    ],
                ]);
            }
        }
    }

    public function resolveStatusForNewTicket(?string $assignee, ?string $requestedStatus = null): string
    {
        if ($requestedStatus && in_array($requestedStatus, self::TICKET_STATUSES, true)) {
            return $requestedStatus;
        }

        return filled($assignee) ? 'pendente' : 'aberto';
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function updateTicket(GridTicket $ticket, array $attributes): GridTicket
    {
        return DB::transaction(function () use ($ticket, $attributes) {
            $previousStatus = $ticket->status;
            $newStatus = $attributes['status'] ?? $previousStatus;

            if (isset($attributes['assignee'])) {
                $this->applyAssigneeRules($ticket, $attributes['assignee'], $newStatus);
                $attributes['assignee'] = $ticket->assignee;
                if (! isset($attributes['status'])) {
                    $attributes['status'] = $ticket->status;
                    $newStatus = $ticket->status;
                }
            }

            if ($newStatus !== $previousStatus) {
                $ticket = $this->transitionTicketStatus($ticket, $previousStatus, $newStatus);
                unset($attributes['status']);
            }

            if ($attributes !== []) {
                $ticket->update($attributes);
            }

            return $ticket->fresh(['tasks']);
        });
    }

    public function transitionTicketStatus(GridTicket $ticket, string $from, string $to): GridTicket
    {
        if ($from === $to) {
            return $ticket;
        }

        if ($from === self::LOCKED_TICKET_STATUS) {
            throw ValidationException::withMessages([
                'status' => [
                    'Chamado em atendimento não pode ser movido manualmente. Conclua a tarefa vinculada para liberar a próxima etapa.',
                ],
            ]);
        }

        $this->assertTransitionAllowed($from, $to, $ticket);

        if ($to === 'em_atendimento') {
            return $this->enterEmAtendimento($ticket);
        }

        if ($to === 'aguardando_aprovacao') {
            throw ValidationException::withMessages([
                'status' => ['Use a conclusão da tarefa para enviar à aprovação do chefe.'],
            ]);
        }

        if ($to === 'avaliacao_pendente') {
            throw ValidationException::withMessages([
                'status' => ['A avaliação do solicitante só após a aprovação do chefe de manutenção.'],
            ]);
        }

        if ($to === 'concluido') {
            throw ValidationException::withMessages([
                'status' => ['Finalize com a avaliação do solicitante.'],
            ]);
        }

        if ($from === 'pendente' && $to === 'aberto') {
            $ticket->assignee = null;
        }

        $ticket->status = $to;
        $ticket->save();

        return $ticket->fresh(['tasks']);
    }

    public function enterEmAtendimento(GridTicket $ticket): GridTicket
    {
        if (! filled($ticket->assignee)) {
            throw ValidationException::withMessages([
                'assignee' => ['Atribua um técnico antes de iniciar o atendimento.'],
            ]);
        }

        if (! $ticket->started_at) {
            $ticket->started_at = now();
        }

        $task = $this->ensurePrimaryTask($ticket, 'em_andamento');
        $this->syncInventoryForTask($task, $task->column === 'em_andamento' ? null : $task->column, 'em_andamento');

        if ($task->column !== 'em_andamento') {
            $task = $this->handleTaskColumnChange($task, $task->column, 'em_andamento');
        }

        $ticket->status = self::LOCKED_TICKET_STATUS;
        $ticket->save();

        return $ticket->fresh(['tasks']);
    }

    public function ensurePrimaryTask(GridTicket $ticket, string $column = 'em_andamento'): GridTask
    {
        $existing = GridTask::query()
            ->where('grid_ticket_id', $ticket->id)
            ->orderBy('id')
            ->first();

        if ($existing) {
            if ($existing->column !== $column) {
                return $this->handleTaskColumnChange($existing, $existing->column, $column);
            }

            return $existing;
        }

        return GridTask::query()->create([
            'grid_ticket_id' => $ticket->id,
            'code' => GridCode::nextTaskCode(),
            'opened_by' => $ticket->requester,
            'title' => $ticket->title,
            'description' => $ticket->summary,
            'room' => $ticket->room,
            'block' => $ticket->block,
            'assignee' => $ticket->assignee,
            'items' => [],
            'inventory_items' => [],
            'priority' => $ticket->priority,
            'column' => $column,
            'status_label' => self::taskColumnLabel($column),
            'opened_at' => now(),
        ]);
    }

    public function approveService(GridTicket $ticket, string $approvedBy, ?string $notes, ?string $resolutionSummary = null): GridTicket
    {
        if ($ticket->status !== 'aguardando_aprovacao') {
            throw ValidationException::withMessages([
                'status' => ['Somente chamados aguardando aprovação do chefe podem ser aprovados.'],
            ]);
        }

        $primaryTask = $ticket->tasks()->orderBy('id')->first();
        if ($primaryTask && $primaryTask->column !== 'concluidas') {
            throw ValidationException::withMessages([
                'status' => ['A tarefa vinculada ainda não foi concluída.'],
            ]);
        }

        $ticket->update([
            'status' => 'avaliacao_pendente',
            'approved_by' => $approvedBy,
            'approved_at' => now(),
            'approval_notes' => $notes,
            'resolution_summary' => $resolutionSummary ?? $ticket->resolution_summary,
        ]);

        return $ticket->fresh(['tasks']);
    }

    public function evaluateTicket(GridTicket $ticket, int $rating, ?string $notes, string $evaluatedBy): GridTicket
    {
        if ($ticket->status !== 'avaliacao_pendente') {
            throw ValidationException::withMessages([
                'status' => ['Somente chamados em avaliação pendente podem ser avaliados pelo solicitante.'],
            ]);
        }

        $ticket->update([
            'status' => 'concluido',
            'evaluation_rating' => max(1, min(5, $rating)),
            'evaluation_notes' => $notes,
            'evaluated_by' => $evaluatedBy,
            'evaluated_at' => now(),
        ]);

        return $ticket->fresh(['tasks']);
    }

    public function createTaskFromTicket(GridTicket $ticket, array $payload, array $inventoryItems = []): GridTask
    {
        if ($ticket->status === self::LOCKED_TICKET_STATUS) {
            throw ValidationException::withMessages([
                'grid_ticket_id' => ['Este chamado já possui tarefa em atendimento. Edite a tarefa vinculada.'],
            ]);
        }

        if (GridTask::query()->where('grid_ticket_id', $ticket->id)->exists()) {
            throw ValidationException::withMessages([
                'grid_ticket_id' => ['Já existe uma tarefa principal para este chamado.'],
            ]);
        }

        $this->assertInventoryLinesAvailable($inventoryItems);

        return DB::transaction(function () use ($ticket, $payload, $inventoryItems) {
            $column = $payload['column'] ?? 'a_fazer';

            $task = GridTask::query()->create([
                'grid_ticket_id' => $ticket->id,
                'code' => GridCode::nextTaskCode(),
                'opened_by' => $payload['opened_by'] ?? $ticket->requester,
                'title' => $payload['title'] ?? $ticket->title,
                'description' => $payload['description'] ?? $ticket->summary,
                'room' => $payload['room'] ?? $ticket->room,
                'block' => $payload['block'] ?? $ticket->block,
                'assignee' => $payload['assignee'] ?? $ticket->assignee,
                'items' => $payload['items'] ?? [],
                'inventory_items' => $inventoryItems,
                'priority' => $payload['priority'] ?? $ticket->priority,
                'column' => $column,
                'status_label' => self::taskColumnLabel($column),
                'opened_at' => $payload['opened_at'] ?? now(),
            ]);

            $this->syncTicketAssigneeFromTask($task);
            $this->syncInventoryForTask($task, null, $column);

            return $task->fresh(['ticket']);
        });
    }

    public function handleTaskColumnChange(GridTask $task, string $previousColumn, string $newColumn): GridTask
    {
        return DB::transaction(function () use ($task, $previousColumn, $newColumn) {
            $task->column = $newColumn;

            if ($newColumn === 'concluidas' && ! $task->completed_at) {
                $task->completed_at = now();
            }
            if ($newColumn !== 'concluidas') {
                $task->completed_at = null;
            }

            $task->status_label = self::taskColumnLabel($newColumn);
            $task->save();

            $this->syncInventoryForTask($task, $previousColumn, $newColumn);
            $this->syncTicketOnTaskChange($task, $previousColumn, $newColumn);

            return $task->fresh(['ticket']);
        });
    }

    public function syncTicketOnTaskChange(GridTask $task, ?string $previousColumn, string $newColumn): void
    {
        $ticket = $task->ticket;
        if (! $ticket) {
            return;
        }

        $this->syncTicketAssigneeFromTask($task);

        if ($newColumn === 'concluidas') {
            $openTasks = $ticket->tasks()
                ->where('column', '!=', 'concluidas')
                ->exists();

            if (! $openTasks && $ticket->status === self::LOCKED_TICKET_STATUS) {
                $ticket->status = 'aguardando_aprovacao';
                $ticket->completed_at = now();
                $ticket->save();
            }
        }
    }

    protected function syncTicketAssigneeFromTask(GridTask $task): void
    {
        $ticket = $task->ticket;
        if (! $ticket || ! $task->assignee) {
            return;
        }

        if (! $ticket->assignee) {
            $ticket->assignee = $task->assignee;
            if ($ticket->status === 'aberto') {
                $ticket->status = 'pendente';
            }
            $ticket->save();
        }
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    protected function applyAssigneeRules(GridTicket $ticket, ?string $assignee, string $targetStatus): void
    {
        if (in_array($ticket->status, [self::LOCKED_TICKET_STATUS, 'aguardando_aprovacao', 'avaliacao_pendente', 'concluido'], true)) {
            $ticket->assignee = $assignee;

            return;
        }

        $ticket->assignee = $assignee;

        if (filled($assignee) && in_array($ticket->status, ['aberto'], true)) {
            $ticket->status = 'pendente';
        }

        if (! filled($assignee) && $ticket->status === 'pendente') {
            $ticket->status = 'aberto';
        }
    }

    protected function assertTransitionAllowed(string $from, string $to, GridTicket $ticket): void
    {
        $allowed = match ($from) {
            'aberto' => ['pendente'],
            'pendente' => ['aberto', 'em_atendimento'],
            'aguardando_aprovacao' => [],
            'avaliacao_pendente' => [],
            'concluido' => [],
            default => [],
        };

        if ($to === 'pendente' && ! filled($ticket->assignee)) {
            throw ValidationException::withMessages([
                'assignee' => ['Atribua um técnico antes de mover para Pendentes.'],
            ]);
        }

        if ($from === 'pendente' && $to === 'em_atendimento' && ! filled($ticket->assignee)) {
            throw ValidationException::withMessages([
                'assignee' => ['Atribua um técnico antes de mover para Em atendimento.'],
            ]);
        }

        if ($from === 'pendente' && $to === 'aberto') {
            return;
        }

        if (! in_array($to, $allowed, true)) {
            throw ValidationException::withMessages([
                'status' => ["Não é permitido mover de \"{$from}\" para \"{$to}\"."],
            ]);
        }
    }

    public function syncInventoryForTask(GridTask $task, ?string $previousColumn, string $newColumn): void
    {
        if ($previousColumn === 'em_andamento' && $newColumn !== 'em_andamento') {
            $this->releaseReservations($task);
        }

        if ($newColumn === 'em_andamento') {
            $this->reserveInventory($task);
        }

        if ($newColumn === 'concluidas') {
            $this->consumeReservations($task);
        }
    }

    /**
     * @param  list<array{inventory_item_id: int, quantity: int}>  $inventoryItems
     */
    public function updateTaskInventory(GridTask $task, array $inventoryItems): void
    {
        DB::transaction(function () use ($task, $inventoryItems) {
            if ($task->column === 'em_andamento') {
                $this->releaseReservations($task);
            }

            $task->inventory_items = $inventoryItems;
            $task->save();

            if ($task->column === 'em_andamento') {
                $this->reserveInventory($task);
            }
        });
    }

    public function reserveInventory(GridTask $task): void
    {
        $items = $task->inventory_items ?? [];
        if ($items === []) {
            return;
        }

        foreach ($items as $row) {
            $itemId = (int) ($row['inventory_item_id'] ?? 0);
            $qty = (int) ($row['quantity'] ?? 0);
            if ($itemId < 1 || $qty < 1) {
                continue;
            }

            $inventory = GridInventoryItem::query()->lockForUpdate()->find($itemId);
            if (! $inventory) {
                throw ValidationException::withMessages([
                    'inventory_items' => ["Item de estoque #{$itemId} não encontrado."],
                ]);
            }

            if ($inventory->qty_available < $qty) {
                throw ValidationException::withMessages([
                    'inventory_items' => ["Estoque insuficiente para \"{$inventory->title}\" (disponível: {$inventory->qty_available})."],
                ]);
            }

            GridInventoryReservation::query()->updateOrCreate(
                [
                    'grid_task_id' => $task->id,
                    'grid_inventory_item_id' => $itemId,
                    'status' => 'reserved',
                ],
                [
                    'grid_ticket_id' => $task->grid_ticket_id,
                    'quantity' => $qty,
                ]
            );

            $inventory->qty_available -= $qty;
            $inventory->qty_reserved += $qty;
            $inventory->status = 'reservado';
            $inventory->save();
        }
    }

    public function releaseReservations(GridTask $task): void
    {
        $reservations = GridInventoryReservation::query()
            ->where('grid_task_id', $task->id)
            ->where('status', 'reserved')
            ->get();

        foreach ($reservations as $reservation) {
            $inventory = GridInventoryItem::query()->lockForUpdate()->find($reservation->grid_inventory_item_id);
            if ($inventory) {
                $inventory->qty_available += $reservation->quantity;
                $inventory->qty_reserved = max(0, $inventory->qty_reserved - $reservation->quantity);
                $inventory->refreshStockStatus();
                if ($inventory->qty_reserved === 0 && $inventory->status === 'reservado') {
                    $inventory->status = 'disponivel';
                }
                $inventory->save();
            }
            $reservation->update(['status' => 'released']);
        }
    }

    public function consumeReservations(GridTask $task): void
    {
        $reservations = GridInventoryReservation::query()
            ->where('grid_task_id', $task->id)
            ->where('status', 'reserved')
            ->get();

        foreach ($reservations as $reservation) {
            $inventory = GridInventoryItem::query()->lockForUpdate()->find($reservation->grid_inventory_item_id);
            if ($inventory) {
                $inventory->qty_reserved = max(0, $inventory->qty_reserved - $reservation->quantity);
                $inventory->refreshStockStatus();
                if ($inventory->qty_reserved === 0 && $inventory->status === 'reservado') {
                    $inventory->status = 'disponivel';
                }
                $inventory->save();
            }
            $reservation->update(['status' => 'consumed']);
        }
    }

    public function buildTicketReport(GridTicket $ticket): array
    {
        $ticket->load(['tasks' => fn ($q) => $q->with(['reservations.inventoryItem'])]);

        $startedAt = $ticket->started_at ?? $ticket->opened_at;
        $completedAt = $ticket->completed_at ?? $ticket->evaluated_at;
        $durationMinutes = null;
        if ($startedAt && $completedAt) {
            $durationMinutes = $startedAt->diffInMinutes($completedAt);
        }

        $materials = [];
        foreach ($ticket->tasks as $task) {
            foreach ($task->reservations as $reservation) {
                $materials[] = [
                    'task_code' => $task->code,
                    'item' => $reservation->inventoryItem?->title ?? 'Item',
                    'quantity' => $reservation->quantity,
                    'status' => $reservation->status,
                ];
            }
            foreach ($task->inventory_items ?? [] as $row) {
                if (! collect($materials)->contains(fn ($m) => ($m['item'] ?? '') === ($row['title'] ?? ''))) {
                    $materials[] = [
                        'task_code' => $task->code,
                        'item' => $row['title'] ?? 'Material',
                        'quantity' => $row['quantity'] ?? 1,
                        'status' => 'planejado',
                    ];
                }
            }
        }

        return [
            'ticket' => $ticket,
            'timeline' => [
                'opened_at' => $ticket->opened_at?->toIso8601String(),
                'started_at' => $ticket->started_at?->toIso8601String(),
                'completed_at' => $ticket->completed_at?->toIso8601String(),
                'approved_at' => $ticket->approved_at?->toIso8601String(),
                'evaluated_at' => $ticket->evaluated_at?->toIso8601String(),
                'duration_minutes' => $durationMinutes,
                'duration_label' => $durationMinutes !== null ? self::formatDuration($durationMinutes) : null,
            ],
            'tasks' => $ticket->tasks,
            'materials' => $materials,
            'location' => [
                'room' => $ticket->room,
                'block' => $ticket->block,
            ],
        ];
    }

    public static function taskColumnLabel(string $column): string
    {
        return match ($column) {
            'em_andamento' => 'Em atendimento',
            'concluidas' => 'Concluída',
            default => 'A fazer',
        };
    }

    public static function formatDuration(int $minutes): string
    {
        if ($minutes < 60) {
            return "{$minutes} min";
        }
        $hours = intdiv($minutes, 60);
        $rest = $minutes % 60;

        return $rest > 0 ? "{$hours}h {$rest}min" : "{$hours}h";
    }
}
