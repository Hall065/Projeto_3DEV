<?php

namespace App\Http\Middleware;

use App\Support\HubRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! HubRole::isAdmin($user->role)) {
            return response()->json([
                'message' => 'Apenas administradores podem realizar esta acao.',
            ], 403);
        }

        return $next($request);
    }
}
