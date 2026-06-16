<?php

namespace App\Http\Controllers\Api\Connect;

use App\Http\Controllers\Controller;
use App\Http\Requests\Connect\UploadConnectContractAttachmentRequest;
use App\Http\Resources\Connect\ConnectContractAttachmentResource;
use App\Http\Resources\Connect\ConnectContractResource;
use App\Models\Connect\ConnectActivity;
use App\Models\Connect\ConnectContract;
use App\Models\Connect\ConnectContractAttachment;
use App\Services\Connect\ConnectContractAttachmentService;
use App\Services\Connect\ConnectContractDocumentService;
use App\Support\UserAccessScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ContractController extends Controller
{
    public function __construct(
        private readonly ConnectContractAttachmentService $attachments,
        private readonly ConnectContractDocumentService $documents,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = UserAccessScope::connectContractQuery($request->user())
            ->with(['student.hubPerson', 'student.connectClass.course', 'attachments'])
            ->orderByDesc('start_date');

        if ($request->filled('connect_student_id')) {
            $query->where('connect_student_id', $request->integer('connect_student_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('contract_type')) {
            $query->where('contract_type', $request->string('contract_type')->toString());
        }

        $contracts = $query->paginate($request->integer('per_page', 15));

        return ConnectContractResource::collection($contracts)->response();
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'connect_student_id' => ['required', 'exists:connect_students,id'],
            'contract_type' => ['required', Rule::in(['estagio', 'aprendizagem', 'clt', 'temporario'])],
            'weekly_hours' => ['nullable', 'integer', 'min:1', 'max:44'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'monthly_value' => ['nullable', 'numeric', 'min:0'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'company_email' => ['nullable', 'email', 'max:255'],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'finished'])],
            'generate_document' => ['nullable', 'boolean'],
        ]);

        $generateDocument = $request->boolean('generate_document');
        unset($validated['generate_document']);

        $contract = ConnectContract::query()->create([
            ...$validated,
            'monthly_value' => $validated['monthly_value'] ?? 0,
            'status' => $validated['status'] ?? 'active',
        ]);

        $contract->load(['student.connectClass.course', 'attachments']);

        if ($generateDocument) {
            $this->documents->generateAndAttach($contract, $request->user(), true);
            $contract->load('attachments');
        }

        ConnectActivity::query()->create([
            'title' => 'Contrato registrado',
            'description' => "Novo contrato de {$contract->contract_type} cadastrado.",
            'type' => 'contract',
            'entity_type' => 'contract',
            'entity_id' => $contract->id,
            'performed_by' => $request->user()?->name ?? 'Sistema',
            'occurred_at' => now(),
        ]);

        app(\App\Services\Notification\SystemNotificationTriggers::class)
            ->connectContractCreated($contract, $request->user());

        $message = 'Contrato cadastrado com sucesso.';
        if ($generateDocument && $contract->attachments->isNotEmpty()) {
            $message .= ' Copia padrao do contrato gerada e anexada.';
        }

        return response()->json([
            'data' => new ConnectContractResource($contract),
            'message' => $message,
        ], 201);
    }

    public function update(Request $request, ConnectContract $contract): JsonResponse
    {
        abort_unless($this->canAccessContract($request, $contract), 403);

        $validated = $request->validate([
            'connect_student_id' => ['sometimes', 'exists:connect_students,id'],
            'contract_type' => ['sometimes', Rule::in(['estagio', 'aprendizagem', 'clt', 'temporario'])],
            'weekly_hours' => ['nullable', 'integer', 'min:1', 'max:44'],
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'monthly_value' => ['nullable', 'numeric', 'min:0'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'company_email' => ['nullable', 'email', 'max:255'],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'finished'])],
        ]);

        $contract->update($validated);
        $contract->load(['student.connectClass.course', 'attachments']);

        return response()->json([
            'data' => new ConnectContractResource($contract),
            'message' => 'Contrato atualizado com sucesso.',
        ]);
    }

    public function destroy(Request $request, ConnectContract $contract): JsonResponse
    {
        abort_unless($this->canAccessContract($request, $contract), 403);

        $this->attachments->deleteAllForContract($contract);
        $contract->delete();

        return response()->json(['message' => 'Contrato excluído com sucesso.']);
    }

    public function storeAttachment(UploadConnectContractAttachmentRequest $request, ConnectContract $contract): JsonResponse
    {
        abort_unless($this->canAccessContract($request, $contract), 403);

        $attachment = $this->attachments->store($contract, $request->file('file'), $request->user());

        return response()->json([
            'data' => new ConnectContractAttachmentResource($attachment),
            'message' => 'Anexo adicionado ao contrato.',
        ], 201);
    }

    public function destroyAttachment(
        Request $request,
        ConnectContract $contract,
        ConnectContractAttachment $connectContractAttachment,
    ): JsonResponse {
        abort_unless($this->canAccessContract($request, $contract), 403);
        abort_unless($connectContractAttachment->connect_contract_id === $contract->id, 404);
        abort_unless($this->attachments->canDelete($request->user(), $connectContractAttachment), 403);

        $this->attachments->delete($connectContractAttachment);

        return response()->json(['message' => 'Anexo removido.']);
    }

    public function generateDocument(Request $request, ConnectContract $contract): JsonResponse
    {
        abort_unless($this->canAccessContract($request, $contract), 403);

        $replaceExisting = $request->boolean('replace_existing', true);
        $attachment = $this->documents->generateAndAttach($contract, $request->user(), $replaceExisting);

        return response()->json([
            'data' => new ConnectContractAttachmentResource($attachment),
            'message' => 'Copia padrao do contrato gerada com sucesso.',
        ], 201);
    }

    private function canAccessContract(Request $request, ConnectContract $contract): bool
    {
        $user = $request->user();
        if (! $user) {
            return false;
        }

        return UserAccessScope::connectContractQuery($user)->whereKey($contract->id)->exists();
    }
}
