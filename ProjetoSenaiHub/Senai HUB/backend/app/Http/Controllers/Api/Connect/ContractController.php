<?php

namespace App\Http\Controllers\Api\Connect;

use App\Http\Controllers\Controller;
use App\Http\Resources\Connect\ConnectContractResource;
use App\Models\Connect\ConnectActivity;
use App\Models\Connect\ConnectContract;
use App\Support\UserAccessScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ContractController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = UserAccessScope::connectContractQuery($request->user())
            ->with(['student.hubPerson', 'student.connectClass'])
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
        ]);

        $contract = ConnectContract::query()->create([
            ...$validated,
            'monthly_value' => $validated['monthly_value'] ?? 0,
            'status' => $validated['status'] ?? 'active',
        ]);

        ConnectActivity::query()->create([
            'title' => 'Contrato registrado',
            'description' => "Novo contrato de {$contract->contract_type} cadastrado.",
            'type' => 'contract',
            'entity_type' => 'contract',
            'entity_id' => $contract->id,
            'performed_by' => $request->user()?->name ?? 'Sistema',
            'occurred_at' => now(),
        ]);

        $contract->load('student.connectClass');

        app(\App\Services\Notification\SystemNotificationTriggers::class)
            ->connectContractCreated($contract, $request->user());

        return response()->json([
            'data' => new ConnectContractResource($contract),
            'message' => 'Contrato cadastrado com sucesso.',
        ], 201);
    }

    public function update(Request $request, ConnectContract $contract): JsonResponse
    {
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
        $contract->load('student.connectClass');

        return response()->json([
            'data' => new ConnectContractResource($contract),
            'message' => 'Contrato atualizado com sucesso.',
        ]);
    }

    public function destroy(ConnectContract $contract): JsonResponse
    {
        $contract->delete();

        return response()->json(['message' => 'Contrato excluído com sucesso.']);
    }
}
