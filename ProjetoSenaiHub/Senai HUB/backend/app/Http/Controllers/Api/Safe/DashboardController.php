<?php

namespace App\Http\Controllers\Api\Safe;

use App\Enums\Safe\AuthorizationStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Safe\SafeAuthorizationResource;
use App\Models\Safe\SafeAuthorization;
use App\Services\Auth\PermissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    public function __construct(
        private readonly PermissionService $permissions,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($this->permissions->can($user, 'safe.authorizations.manage')) {
            return $this->aqvDashboard();
        }

        if ($this->permissions->can($user, 'safe.approve')) {
            return $this->professorDashboard($user);
        }

        if ($this->permissions->can($user, 'safe.portaria')) {
            return $this->portariaDashboard();
        }

        return $this->aqvDashboard();
    }

    private function aqvDashboard(): JsonResponse
    {
        $today = Carbon::now()->startOfDay();

        $recent = SafeAuthorization::query()
            ->with(['requester', 'teacherApprover', 'portariaApprover'])
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        $statusBreakdown = SafeAuthorization::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return response()->json([
            'data' => [
                'view' => 'aqv',
                'kpis' => [
                    'requests_today' => SafeAuthorization::query()->where('created_at', '>=', $today)->count(),
                    'pending_teacher' => SafeAuthorization::query()->where('status', AuthorizationStatus::AguardandoProfessor)->count(),
                    'approved_today' => SafeAuthorization::query()->where('teacher_approved_at', '>=', $today)->count(),
                    'finalized_today' => SafeAuthorization::query()->where('finalized_at', '>=', $today)->count(),
                    'awaiting_portaria' => SafeAuthorization::query()->where('status', AuthorizationStatus::LiberadoPortaria)->count(),
                    'denied' => SafeAuthorization::query()->where('status', AuthorizationStatus::Negado)->count(),
                ],
                'status_breakdown' => $statusBreakdown,
                'recent_authorizations' => SafeAuthorizationResource::collection($recent)->resolve(),
            ],
        ]);
    }

    private function professorDashboard($user): JsonResponse
    {
        $authorizations = SafeAuthorization::query()
            ->with(['requester', 'student'])
            ->where('status', AuthorizationStatus::AguardandoProfessor)
            ->orderByDesc('scheduled_at')
            ->limit(25)
            ->get();

        return response()->json([
            'data' => [
                'view' => 'professor',
                'kpis' => [
                    'pending' => SafeAuthorization::query()->where('status', AuthorizationStatus::AguardandoProfessor)->count(),
                    'approved_by_me' => SafeAuthorization::query()->where('approved_by_teacher', $user->id)->count(),
                ],
                'authorizations' => SafeAuthorizationResource::collection($authorizations)->resolve(),
            ],
        ]);
    }

    private function portariaDashboard(): JsonResponse
    {
        $authorizations = SafeAuthorization::query()
            ->with(['requester', 'teacherApprover', 'student'])
            ->where('status', AuthorizationStatus::LiberadoPortaria)
            ->orderByDesc('scheduled_at')
            ->limit(25)
            ->get();

        return response()->json([
            'data' => [
                'view' => 'portaria',
                'kpis' => [
                    'awaiting_confirmation' => SafeAuthorization::query()->where('status', AuthorizationStatus::LiberadoPortaria)->count(),
                    'finalized_today' => SafeAuthorization::query()
                        ->where('finalized_at', '>=', Carbon::now()->startOfDay())
                        ->count(),
                ],
                'authorizations' => SafeAuthorizationResource::collection($authorizations)->resolve(),
            ],
        ]);
    }
}
