<?php

namespace App\Http\Controllers\Api\Grid;

use App\Http\Controllers\Controller;
use App\Http\Resources\Grid\GridTaskResource;
use App\Models\Grid\GridInventoryItem;
use App\Models\Grid\GridTask;
use App\Services\Grid\GridWorkflowService;
use App\Support\GridCode;
use App\Support\GridForm;
use App\Support\HubRole;
use App\Support\UserAccessScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TaskController extends Controller
{
    public function __construct(private GridWorkflowService $workflow) {}

    public function index(Request $request): JsonResponse
    {
        $query = UserAccessScope::gridTaskQuery($request->user())
            ->with('ticket:id,code')
            ->orderByDesc('opened_at');

        if ($request->filled('column')) {
            $query->where('column', $request->string('column')->toString());
        }

        if ($request->filled('search')) {
            $search = '%'.$request->string('search')->trim().'%';
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', $search)
                    ->orWhere('code', 'like', $search);
            });
        }

        if ($request->boolean('for_map')) {
            $query->whereIn('column', ['a_fazer', 'em_andamento']);
        }

        if ($request->boolean('all')) {
            return response()->json([
                'data' => GridTaskResource::collection($query->get()),
            ]);
        }

        $tasks = $query->paginate($request->integer('per_page', 50));

        return GridTaskResource::collection($tasks)->response();
    }

    public function store(Request $request): JsonResponse
    {
        GridForm::mergeNullableForeignIds($request, ['grid_ticket_id']);

        $validated = $request->validate([
            'grid_ticket_id' => ['nullable', 'exists:grid_tickets,id'],
            'opened_by' => ['required', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'room' => ['nullable', 'string', 'max:100'],
            'block' => ['nullable', 'string', 'max:10'],
            'assignee' => ['nullable', 'string', 'max:255'],
            'items' => ['nullable', 'array'],
            'items.*' => ['string', 'max:255'],
            'inventory_items' => ['nullable', 'array'],
            'inventory_items.*.inventory_item_id' => ['required', 'integer', 'exists:grid_inventory_items,id'],
            'inventory_items.*.quantity' => ['required', 'integer', 'min:1'],
            'inventory_items.*.title' => ['nullable', 'string', 'max:255'],
            'priority' => ['nullable', Rule::in(['alta', 'media', 'baixa'])],
            'column' => ['nullable', Rule::in(['a_fazer', 'em_andamento', 'concluidas'])],
            'opened_at' => ['nullable', 'date'],
        ]);

        $inventoryItems = $this->normalizeInventoryItems($validated['inventory_items'] ?? []);
        $column = $validated['column'] ?? 'a_fazer';

        $this->workflow->assertInventoryLinesAvailable($inventoryItems);

        if (! empty($validated['grid_ticket_id'])) {
            $ticket = \App\Models\Grid\GridTicket::query()->findOrFail($validated['grid_ticket_id']);
            $task = $this->workflow->createTaskFromTicket($ticket, $validated, $inventoryItems);

            return response()->json([
                'data' => new GridTaskResource($task),
                'message' => 'Tarefa cadastrada com sucesso.',
            ], 201);
        }

        $user = $request->user();
        if (in_array($user?->role, [HubRole::GRID_PROFESSOR, HubRole::GRID_SECRETARIA], true)) {
            $validated['opened_by'] = $user->name;
        }

        $task = GridTask::query()->create([
            ...$validated,
            'inventory_items' => $inventoryItems,
            'code' => GridCode::nextTaskCode(),
            'priority' => $validated['priority'] ?? 'media',
            'column' => $column,
            'status_label' => GridWorkflowService::taskColumnLabel($column),
            'opened_at' => $validated['opened_at'] ?? now(),
            'items' => $validated['items'] ?? [],
        ]);

        $this->workflow->syncInventoryForTask($task, null, $column);

        return response()->json([
            'data' => new GridTaskResource($task->fresh()),
            'message' => 'Tarefa cadastrada com sucesso.',
        ], 201);
    }

    public function update(Request $request, GridTask $task): JsonResponse
    {
        abort_unless(UserAccessScope::canAccessGridTask($request->user(), $task), 403);

        GridForm::mergeNullableForeignIds($request, ['grid_ticket_id']);

        $validated = $request->validate([
            'grid_ticket_id' => ['nullable', 'exists:grid_tickets,id'],
            'opened_by' => ['sometimes', 'string', 'max:255'],
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'room' => ['nullable', 'string', 'max:100'],
            'block' => ['nullable', 'string', 'max:10'],
            'assignee' => ['nullable', 'string', 'max:255'],
            'items' => ['nullable', 'array'],
            'items.*' => ['string', 'max:255'],
            'inventory_items' => ['nullable', 'array'],
            'inventory_items.*.inventory_item_id' => ['required', 'integer', 'exists:grid_inventory_items,id'],
            'inventory_items.*.quantity' => ['required', 'integer', 'min:1'],
            'inventory_items.*.title' => ['nullable', 'string', 'max:255'],
            'priority' => ['nullable', Rule::in(['alta', 'media', 'baixa'])],
            'column' => ['nullable', Rule::in(['a_fazer', 'em_andamento', 'concluidas'])],
            'opened_at' => ['nullable', 'date'],
            'resolution_summary' => ['nullable', 'string'],
            'fixed_description' => ['nullable', 'string'],
            'considerations' => ['nullable', 'string'],
        ]);

        $previousColumn = $task->column;

        if (array_key_exists('inventory_items', $validated)) {
            $normalized = $this->normalizeInventoryItems($validated['inventory_items']);
            $this->workflow->assertInventoryLinesAvailable($normalized);
            $this->workflow->updateTaskInventory($task, $normalized);
            unset($validated['inventory_items']);
        }

        if (isset($validated['column']) && $validated['column'] !== $previousColumn) {
            $task->update(collect($validated)->except('column')->all());
            $task = $this->workflow->handleTaskColumnChange($task, $previousColumn, $validated['column']);
        } else {
            if (isset($validated['column'])) {
                $validated['status_label'] = GridWorkflowService::taskColumnLabel($validated['column']);
            }
            $task->update($validated);
            if ($task->ticket && isset($validated['assignee'])) {
                $task->ticket->update(['assignee' => $validated['assignee']]);
            }
        }

        if ($task->ticket && isset($validated['fixed_description'])) {
            $task->ticket->update([
                'fixed_description' => $validated['fixed_description'],
                'considerations' => $validated['considerations'] ?? $task->ticket->considerations,
                'resolution_summary' => $validated['resolution_summary'] ?? $task->ticket->resolution_summary,
            ]);
        }

        return response()->json([
            'data' => new GridTaskResource($task->fresh(['ticket'])),
            'message' => 'Tarefa atualizada com sucesso.',
        ]);
    }

    public function destroy(Request $request, GridTask $task): JsonResponse
    {
        abort_unless(UserAccessScope::canAccessGridTask($request->user(), $task), 403);

        $this->workflow->releaseReservations($task);
        $task->delete();

        return response()->json(['message' => 'Tarefa excluída com sucesso.']);
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @return list<array{inventory_item_id: int, quantity: int, title?: string}>
     */
    private function normalizeInventoryItems(array $rows): array
    {
        return collect($rows)
            ->map(function ($row) {
                $item = GridInventoryItem::query()->find($row['inventory_item_id']);

                return [
                    'inventory_item_id' => (int) $row['inventory_item_id'],
                    'quantity' => (int) $row['quantity'],
                    'title' => $row['title'] ?? $item?->title,
                ];
            })
            ->values()
            ->all();
    }
}
