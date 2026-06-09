<?php

namespace App\Http\Controllers\Api\Safe;

use App\Enums\Safe\AuthorizationStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Safe\SafeAuthorizationResource;
use App\Models\Safe\SafeAuthorization;
use App\Services\Safe\SafeWorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeacherController extends Controller
{
    public function __construct(
        private readonly SafeWorkflowService $workflow,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $authorizations = SafeAuthorization::query()
            ->with(['requester', 'student'])
            ->where('status', AuthorizationStatus::AguardandoProfessor)
            ->orderByDesc('scheduled_at')
            ->paginate($request->integer('per_page', 15));

        return SafeAuthorizationResource::collection($authorizations)->response();
    }

    public function approve(Request $request, SafeAuthorization $safeAuthorization): JsonResponse
    {
        $authorization = $this->workflow->approveByTeacher($safeAuthorization, $request->user());

        $message = $authorization->status === AuthorizationStatus::Finalizado
            ? 'Solicitação aprovada (entrada finalizada).'
            : 'Solicitação aprovada e enviada para a portaria.';

        return response()->json([
            'data' => new SafeAuthorizationResource($authorization),
            'message' => $message,
        ]);
    }

    public function deny(Request $request, SafeAuthorization $safeAuthorization): JsonResponse
    {
        $authorization = $this->workflow->denyByTeacher($safeAuthorization, $request->user());

        return response()->json([
            'data' => new SafeAuthorizationResource($authorization),
            'message' => 'Solicitação negada.',
        ]);
    }
}
