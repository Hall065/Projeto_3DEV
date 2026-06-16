<?php

namespace App\Http\Controllers\Api\Safe;

use App\Enums\Safe\AuthorizationType;
use App\Http\Controllers\Controller;
use App\Http\Resources\Safe\SafeAuthorizationLogResource;
use App\Http\Resources\Safe\SafeAuthorizationResource;
use App\Models\Safe\SafeAuthorization;
use App\Services\Safe\SafeWorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AuthorizationController extends Controller
{
    public function __construct(
        private readonly SafeWorkflowService $workflow,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));

        $authorizations = SafeAuthorization::query()
            ->with(['requester', 'teacherApprover', 'portariaApprover', 'student'])
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->when($request->filled('type'), fn ($query) => $query->where('type', $request->string('type')->toString()))
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('protocol', 'like', '%'.$search.'%')
                        ->orWhere('student_name', 'like', '%'.$search.'%')
                        ->orWhere('class_name', 'like', '%'.$search.'%');
                });
            })
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15));

        return SafeAuthorizationResource::collection($authorizations)->response();
    }

    public function show(SafeAuthorization $safeAuthorization): JsonResponse
    {
        $safeAuthorization->load(['requester', 'teacherApprover', 'portariaApprover', 'student', 'logs.user']);

        return response()->json([
            'data' => new SafeAuthorizationResource($safeAuthorization),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateAuthorizationPayload($request);

        $authorization = $this->workflow->createAuthorization(
            $request->user(),
            $this->payloadFromValidated($validated),
        );

        return response()->json([
            'data' => new SafeAuthorizationResource($authorization),
            'message' => 'Solicitação criada e enviada para o professor.',
        ], 201);
    }

    public function update(Request $request, SafeAuthorization $safeAuthorization): JsonResponse
    {
        $validated = $this->validateAuthorizationPayload($request, true);

        $authorization = $this->workflow->updateAuthorization(
            $safeAuthorization,
            $request->user(),
            $this->payloadFromValidated($validated, $safeAuthorization),
        );

        return response()->json([
            'data' => new SafeAuthorizationResource($authorization),
            'message' => 'Solicitação atualizada com sucesso.',
        ]);
    }

    public function history(SafeAuthorization $safeAuthorization): JsonResponse
    {
        $logs = $safeAuthorization->logs()->with('user')->orderBy('created_at')->get();

        return response()->json([
            'data' => [
                'authorization' => new SafeAuthorizationResource($safeAuthorization->load(['requester', 'student'])),
                'logs' => SafeAuthorizationLogResource::collection($logs)->resolve(),
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateAuthorizationPayload(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'safe_student_id' => ['nullable', 'integer', Rule::exists('safe_students', 'id')],
            'connect_student_id' => ['nullable', 'integer', Rule::exists('connect_students', 'id')],
            'student_name' => array_merge(
                $partial ? ['sometimes'] : [],
                ['required_without_all:safe_student_id,connect_student_id', 'string', 'max:255'],
            ),
            'class_name' => array_merge(
                $partial ? ['sometimes'] : [],
                ['required_without_all:safe_student_id,connect_student_id', 'string', 'max:255'],
            ),
            'type' => [$required, Rule::in(array_map(fn (AuthorizationType $type) => $type->value, AuthorizationType::cases()))],
            'reason' => [$required, 'string', 'max:2000'],
            'absence_count' => ['nullable', 'integer', 'min:0', 'max:5'],
            'date' => [$required, 'date'],
            'time' => [$required, 'date_format:H:i'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function payloadFromValidated(array $validated, ?SafeAuthorization $existing = null): array
    {
        $payload = $validated;

        if (isset($validated['date'], $validated['time'])) {
            $payload['scheduled_at'] = $this->workflow->parseScheduledAt($validated['date'], $validated['time']);
        } elseif ($existing) {
            $payload['scheduled_at'] = $existing->scheduled_at;
        }

        unset($payload['date'], $payload['time']);

        return $payload;
    }
}
