<?php

namespace App\Http\Controllers\Api\Safe;

use App\Enums\Safe\AuthorizationStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Safe\SafeAuthorizationResource;
use App\Models\Safe\SafeAuthorization;
use App\Services\Safe\SafeWorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PortariaController extends Controller
{
    public function __construct(
        private readonly SafeWorkflowService $workflow,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $authorizations = SafeAuthorization::query()
            ->with(['requester', 'teacherApprover', 'student'])
            ->where('status', AuthorizationStatus::LiberadoPortaria)
            ->orderByDesc('scheduled_at')
            ->paginate($request->integer('per_page', 15));

        return SafeAuthorizationResource::collection($authorizations)->response();
    }

    public function confirm(Request $request, SafeAuthorization $safeAuthorization): JsonResponse
    {
        $authorization = $this->workflow->confirmByPortaria($safeAuthorization, $request->user());

        return response()->json([
            'data' => new SafeAuthorizationResource($authorization),
            'message' => 'Validação concluída.',
        ]);
    }

    public function deny(Request $request, SafeAuthorization $safeAuthorization): JsonResponse
    {
        $authorization = $this->workflow->denyByPortaria($safeAuthorization, $request->user());

        return response()->json([
            'data' => new SafeAuthorizationResource($authorization),
            'message' => 'Solicitação recusada.',
        ]);
    }
}
