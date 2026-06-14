<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Connect\ConnectClassResource;
use App\Http\Resources\Grid\GridTicketResource;
use App\Http\Resources\Safe\SafeAuthorizationResource;
use App\Models\Connect\ConnectAttendanceSession;
use App\Models\Safe\SafeAuthorization;
use App\Services\Auth\PermissionService;
use App\Services\Connect\ConnectClassArchiveService;
use App\Support\HubRole;
use App\Support\UserAccessScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ArchiveController extends Controller
{
    private const SAFE_ARCHIVED_STATUSES = ['finalizado', 'negado'];

    public function __construct(
        private readonly PermissionService $permissions,
        private readonly ConnectClassArchiveService $classArchive,
    ) {}

    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();
        $modules = [];

        if ($this->canConnectArchive($user)) {
            $classQuery = UserAccessScope::connectClassQuery($user)->where('status', 'finished');
            $classIds = (clone $classQuery)->pluck('connect_classes.id');
            $modules['connect'] = [
                'key' => 'connect',
                'classes_count' => $classIds->count(),
                'attendance_sessions_count' => $classIds->isEmpty()
                    ? 0
                    : ConnectAttendanceSession::query()->whereIn('connect_class_id', $classIds)->count(),
            ];
        }

        if ($this->canGridArchive($user)) {
            $modules['grid'] = [
                'key' => 'grid',
                'tickets_count' => UserAccessScope::gridTicketQuery($user)->where('status', 'concluido')->count(),
            ];
        }

        if ($this->canSafeArchive($user)) {
            $modules['safe'] = [
                'key' => 'safe',
                'authorizations_count' => SafeAuthorization::query()
                    ->whereIn('status', self::SAFE_ARCHIVED_STATUSES)
                    ->count(),
            ];
        }

        return response()->json([
            'data' => [
                'modules' => $modules,
                'auto_archive' => [
                    'pending_classes' => $this->canRunAutoArchive($user) ? $this->classArchive->countPendingAutoArchive() : 0,
                    'can_run' => $this->canRunAutoArchive($user),
                ],
            ],
        ]);
    }

    public function connectClasses(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($this->canConnectArchive($user), 403);

        $query = UserAccessScope::connectClassQuery($user)
            ->where('status', 'finished')
            ->with(['course', 'teacher'])
            ->withCount(['students', 'attendanceSessions'])
            ->orderByDesc('end_date')
            ->orderByDesc('id');

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $classes = $query->paginate($request->integer('per_page', 15));

        return ConnectClassResource::collection($classes)->response();
    }

    public function gridTickets(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($this->canGridArchive($user), 403);

        $query = UserAccessScope::gridTicketQuery($user)
            ->where('status', 'concluido')
            ->orderByDesc('updated_at');

        $query->search($request->string('search')->trim()->toString() ?: null);

        $tickets = $query->paginate($request->integer('per_page', 15));

        return GridTicketResource::collection($tickets)->response();
    }

    public function safeAuthorizations(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($this->canSafeArchive($user), 403);

        $search = trim((string) $request->query('search', ''));
        $status = $request->string('status')->trim()->toString();

        $query = SafeAuthorization::query()
            ->with(['requester', 'student'])
            ->when(
                $status !== '' && in_array($status, self::SAFE_ARCHIVED_STATUSES, true),
                fn ($builder) => $builder->where('status', $status),
                fn ($builder) => $builder->whereIn('status', self::SAFE_ARCHIVED_STATUSES),
            )
            ->when($search !== '', function ($builder) use ($search): void {
                $builder->where(function ($inner) use ($search): void {
                    $inner->where('protocol', 'like', '%'.$search.'%')
                        ->orWhere('student_name', 'like', '%'.$search.'%')
                        ->orWhere('class_name', 'like', '%'.$search.'%');
                });
            })
            ->orderByDesc('updated_at');

        $authorizations = $query->paginate($request->integer('per_page', 15));

        return SafeAuthorizationResource::collection($authorizations)->response();
    }

    public function runAutoArchive(Request $request): JsonResponse
    {
        abort_unless($this->canRunAutoArchive($request->user()), 403);

        $archived = $this->classArchive->archiveExpiredClasses($request->user());

        return response()->json([
            'message' => $archived > 0
                ? "{$archived} turma(s) arquivada(s) automaticamente."
                : 'Nenhuma turma pendente de arquivamento.',
            'data' => [
                'archived' => $archived,
                'pending' => $this->classArchive->countPendingAutoArchive(),
            ],
        ]);
    }

    private function canConnectArchive(?\App\Models\User $user): bool
    {
        if (! $user) {
            return false;
        }

        if (HubRole::isAdmin($user->role)) {
            return true;
        }

        return $this->permissions->can($user, 'connect.classes.view')
            || $this->permissions->can($user, 'connect.classes.manage');
    }

    private function canGridArchive(?\App\Models\User $user): bool
    {
        if (! $user) {
            return false;
        }

        if (HubRole::isAdmin($user->role)) {
            return true;
        }

        return $this->permissions->can($user, 'grid.tickets.view')
            || $this->permissions->can($user, 'grid.tickets.manage');
    }

    private function canSafeArchive(?\App\Models\User $user): bool
    {
        if (! $user) {
            return false;
        }

        if (HubRole::isAdmin($user->role)) {
            return true;
        }

        return $this->permissions->can($user, 'safe.access')
            || $this->permissions->can($user, 'safe.authorizations.manage')
            || $this->permissions->can($user, 'safe.approve')
            || $this->permissions->can($user, 'safe.portaria');
    }

    private function canRunAutoArchive(?\App\Models\User $user): bool
    {
        return $user !== null && HubRole::isAdmin($user->role);
    }
}
