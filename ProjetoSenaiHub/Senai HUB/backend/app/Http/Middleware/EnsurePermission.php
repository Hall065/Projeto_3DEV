<?php

namespace App\Http\Middleware;

use App\Services\Auth\PermissionService;
use App\Support\HubRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePermission
{
    public function __construct(
        private readonly PermissionService $permissions,
    ) {}

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Nao autenticado.'], 401);
        }

        if (HubRole::isAdmin($user->role)) {
            return $next($request);
        }

        foreach ($permissions as $permission) {
            if ($this->permissions->can($user, $permission)) {
                return $next($request);
            }
        }

        return response()->json([
            'message' => 'Voce nao tem permissao para esta acao.',
        ], 403);
    }
}
