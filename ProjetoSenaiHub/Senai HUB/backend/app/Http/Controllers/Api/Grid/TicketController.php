<?php

namespace App\Http\Controllers\Api\Grid;

use App\Http\Controllers\Controller;
use App\Http\Requests\Grid\UploadGridTicketAttachmentRequest;
use App\Http\Resources\Grid\GridTicketAttachmentResource;
use App\Http\Resources\Grid\GridTicketResource;
use App\Http\Resources\Grid\GridTaskResource;
use App\Models\Grid\GridInventoryItem;
use App\Models\Grid\GridTask;
use App\Models\Grid\GridTicket;
use App\Models\Grid\GridTicketAttachment;
use App\Services\Grid\GridTicketAttachmentService;
use App\Services\Grid\GridWorkflowService;
use App\Support\GridCode;
use App\Support\GridParticipantSync;
use App\Support\HubRole;
use App\Support\UserAccessScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TicketController extends Controller
{
    public function __construct(
        private GridWorkflowService $workflow,
        private GridTicketAttachmentService $attachments,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = UserAccessScope::gridTicketQuery($request->user())
            ->withCount(['tasks', 'attachments'])
            ->with(['attachments' => fn ($builder) => $builder->orderBy('created_at')])
            ->orderByDesc('opened_at');

        $query->search($request->string('search')->trim()->toString() ?: null);

        if ($request->filled('block')) {
            $query->where('block', $request->string('block')->toString());
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->string('priority')->toString());
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->boolean('open_for_task')) {
            $query->whereIn('status', ['aberto', 'pendente']);
        }

        if ($request->boolean('for_map')) {
            $query->whereIn('status', ['aberto', 'pendente', 'em_atendimento', 'aguardando_aprovacao', 'avaliacao_pendente']);
        }

        $perPage = $request->boolean('all') ? max($query->count(), 1) : $request->integer('per_page', 10);
        $tickets = $query->paginate($perPage);

        return GridTicketResource::collection($tickets)->response();
    }

    public function show(Request $request, GridTicket $ticket): JsonResponse
    {
        abort_unless(UserAccessScope::canAccessGridTicket($request->user(), $ticket), 403);

        $ticket->load(['tasks', 'attachments']);

        return response()->json([
            'data' => new GridTicketResource($ticket),
        ]);
    }

    public function report(Request $request, GridTicket $ticket): JsonResponse
    {
        abort_unless(UserAccessScope::canAccessGridTicket($request->user(), $ticket), 403);

        $report = $this->workflow->buildTicketReport($ticket);

        return response()->json([
            'data' => [
                'ticket' => (new GridTicketResource($report['ticket']))->resolve(),
                'timeline' => $report['timeline'],
                'tasks' => $report['tasks']->map(fn ($task) => [
                    'id' => $task->id,
                    'code' => $task->code,
                    'title' => $task->title,
                    'description' => $task->description,
                    'assignee' => $task->assignee,
                    'column' => $task->column,
                    'status_label' => $task->status_label,
                    'opened_at' => $task->opened_at?->toIso8601String(),
                    'completed_at' => $task->completed_at?->toIso8601String(),
                    'items' => $task->items ?? [],
                    'inventory_items' => $task->inventory_items ?? [],
                ]),
                'materials' => $report['materials'],
                'location' => $report['location'],
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'requester' => ['required', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'summary' => ['nullable', 'string'],
            'room' => ['nullable', 'string', 'max:100'],
            'block' => ['nullable', 'string', 'max:10'],
            'priority' => ['nullable', Rule::in(['alta', 'media', 'baixa'])],
            'status' => ['nullable', Rule::in(GridWorkflowService::TICKET_STATUSES)],
            'assignee' => ['nullable', 'string', 'max:255'],
            'opened_at' => ['nullable', 'date'],
        ]);

        $status = $this->workflow->resolveStatusForNewTicket(
            $validated['assignee'] ?? null,
            $validated['status'] ?? null,
        );

        $user = $request->user();
        if (in_array($user?->role, [HubRole::GRID_PROFESSOR, HubRole::GRID_SECRETARIA], true)) {
            $validated['requester'] = $user->name;
            $validated['requester_user_id'] = $user->id;
        }

        GridParticipantSync::syncTicket($validated);

        $ticket = GridTicket::query()->create([
            ...$validated,
            'code' => GridCode::nextTicketCode(),
            'priority' => $validated['priority'] ?? 'media',
            'status' => $status,
            'opened_at' => $validated['opened_at'] ?? now(),
        ]);

        app(\App\Services\Notification\SystemNotificationTriggers::class)
            ->gridTicketCreated($ticket, $request->user());

        return response()->json([
            'data' => new GridTicketResource($ticket),
            'message' => 'Chamado cadastrado com sucesso.',
        ], 201);
    }

    public function update(Request $request, GridTicket $ticket): JsonResponse
    {
        abort_unless(UserAccessScope::canAccessGridTicket($request->user(), $ticket), 403);

        $validated = $request->validate([
            'requester' => ['sometimes', 'string', 'max:255'],
            'title' => ['sometimes', 'string', 'max:255'],
            'summary' => ['nullable', 'string'],
            'room' => ['nullable', 'string', 'max:100'],
            'block' => ['nullable', 'string', 'max:10'],
            'priority' => ['nullable', Rule::in(['alta', 'media', 'baixa'])],
            'status' => ['nullable', Rule::in(GridWorkflowService::TICKET_STATUSES)],
            'assignee' => ['nullable', 'string', 'max:255'],
            'opened_at' => ['nullable', 'date'],
            'resolution_summary' => ['nullable', 'string'],
            'fixed_description' => ['nullable', 'string'],
            'considerations' => ['nullable', 'string'],
        ]);

        if (
            isset($validated['status'])
            && $validated['status'] === 'aberto'
            && $ticket->status === 'pendente'
        ) {
            $validated['assignee'] = null;
        }

        $previousStatus = $ticket->status;
        $previousAssignee = $ticket->assignee;
        GridParticipantSync::syncTicket($validated);
        $ticket = $this->workflow->updateTicket($ticket, $validated);

        app(\App\Services\Notification\SystemNotificationTriggers::class)
            ->gridTicketUpdated($ticket, $previousStatus, $previousAssignee, $request->user());

        return response()->json([
            'data' => new GridTicketResource($ticket),
            'message' => 'Chamado atualizado com sucesso.',
        ]);
    }

    public function approveService(Request $request, GridTicket $ticket): JsonResponse
    {
        $validated = $request->validate([
            'approved_by' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'resolution_summary' => ['nullable', 'string'],
        ]);

        $ticket = $this->workflow->approveService(
            $ticket,
            $validated['approved_by'],
            $validated['notes'] ?? null,
            $validated['resolution_summary'] ?? null,
        );

        app(\App\Services\Notification\SystemNotificationTriggers::class)
            ->gridTicketAwaitingEvaluation($ticket, $request->user());

        return response()->json([
            'data' => new GridTicketResource($ticket),
            'message' => 'Serviço aprovado. Chamado aguarda avaliação do solicitante.',
        ]);
    }

    public function evaluate(Request $request, GridTicket $ticket): JsonResponse
    {
        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'notes' => ['nullable', 'string'],
            'evaluated_by' => ['required', 'string', 'max:255'],
        ]);

        $ticket = $this->workflow->evaluateTicket(
            $ticket,
            (int) $validated['rating'],
            $validated['notes'] ?? null,
            $validated['evaluated_by'],
        );

        return response()->json([
            'data' => new GridTicketResource($ticket),
            'message' => 'Avaliação registrada. Chamado finalizado.',
        ]);
    }

    public function createTask(Request $request, GridTicket $ticket): JsonResponse
    {
        $validated = $request->validate([
            'assignee' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'column' => ['nullable', Rule::in(['a_fazer', 'em_andamento', 'concluidas'])],
            'items' => ['nullable', 'array'],
            'items.*' => ['string', 'max:255'],
            'inventory_items' => ['nullable', 'array'],
            'inventory_items.*.inventory_item_id' => ['required', 'integer', 'exists:grid_inventory_items,id'],
            'inventory_items.*.quantity' => ['required', 'integer', 'min:1'],
            'inventory_items.*.title' => ['nullable', 'string', 'max:255'],
        ]);

        $inventoryItems = collect($validated['inventory_items'] ?? [])
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

        $task = $this->workflow->createTaskFromTicket($ticket, $validated, $inventoryItems);

        if (! empty($validated['assignee'])) {
            $ticket->update(['assignee' => $validated['assignee']]);
        }

        return response()->json([
            'data' => new GridTaskResource($task),
            'message' => 'Tarefa criada a partir do chamado.',
        ], 201);
    }

    public function storeAttachment(UploadGridTicketAttachmentRequest $request, GridTicket $ticket): JsonResponse
    {
        abort_unless(UserAccessScope::canAccessGridTicket($request->user(), $ticket), 403);

        $attachment = $this->attachments->store($ticket, $request->file('file'), $request->user());

        return response()->json([
            'data' => new GridTicketAttachmentResource($attachment),
            'message' => 'Anexo adicionado ao chamado.',
        ], 201);
    }

    public function destroyAttachment(Request $request, GridTicket $ticket, GridTicketAttachment $gridTicketAttachment): JsonResponse
    {
        abort_unless(UserAccessScope::canAccessGridTicket($request->user(), $ticket), 403);
        abort_unless($gridTicketAttachment->grid_ticket_id === $ticket->id, 404);
        abort_unless($this->attachments->canDelete($request->user(), $gridTicketAttachment), 403);

        $this->attachments->delete($gridTicketAttachment);

        return response()->json(['message' => 'Anexo removido.']);
    }

    public function destroy(Request $request, GridTicket $ticket): JsonResponse
    {
        abort_unless(UserAccessScope::canAccessGridTicket($request->user(), $ticket), 403);

        GridTask::query()->where('grid_ticket_id', $ticket->id)->each(function (GridTask $task) {
            $this->workflow->releaseReservations($task);
        });

        $this->attachments->deleteAllForTicket($ticket);
        $ticket->delete();

        return response()->json(['message' => 'Chamado excluído com sucesso.']);
    }
}
