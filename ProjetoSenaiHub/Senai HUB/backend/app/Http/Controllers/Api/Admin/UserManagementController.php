<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\HubUserDetailResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\Auth\PermissionService;
use App\Support\HubRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserManagementController extends Controller
{
    public function roles(): JsonResponse
    {
        $roles = collect(config('permissions.roles', []))->map(fn (array $meta, string $key) => [
            'key' => $key,
            'label' => $meta['label'],
            'module' => $meta['module'],
            'description' => $meta['description'],
            'assignable' => $key !== HubRole::ADMIN
                && $key !== HubRole::UNASSIGNED
                && ($meta['assignable'] ?? true),
            'default_permissions' => app(PermissionService::class)->defaultPermissionsForRole($key),
        ])->values();

        return response()->json(['data' => $roles]);
    }

    public function navPermissions(): JsonResponse
    {
        return response()->json([
            'data' => config('permissions.nav_permissions', []),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = User::query()->orderBy('name');

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->string('role')->toString());
        }

        $users = $query->paginate($request->integer('per_page', 20));

        return UserResource::collection($users)->response();
    }

    public function show(User $user): JsonResponse
    {
        return response()->json([
            'data' => new HubUserDetailResource($user),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['nullable', Rule::in(HubRole::all())],
            'company_name' => ['nullable', 'string', 'max:255'],
            'custom_permissions' => ['nullable', 'array'],
            'custom_permissions.*' => ['string', 'max:120'],
        ]);

        $role = $validated['role'] ?? HubRole::UNASSIGNED;
        $validated['role'] = $role;
        $this->validateRoleExtras($validated);

        $customPermissions = $this->resolveCustomPermissions($role, $validated['custom_permissions'] ?? null);

        $user = User::query()->create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $role,
            'custom_permissions' => $customPermissions,
            'company_name' => $validated['company_name'] ?? null,
            'email_verified_at' => now(),
        ]);

        $this->syncApplicationAccess($user);

        app(\App\Services\Notification\SystemNotificationTriggers::class)
            ->userCreated($user, $request->user());

        return response()->json([
            'data' => new UserResource($user),
            'message' => 'Usuario criado com sucesso.',
        ], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['sometimes', Rule::in(HubRole::all())],
            'company_name' => ['nullable', 'string', 'max:255'],
            'custom_permissions' => ['nullable', 'array'],
            'custom_permissions.*' => ['string', 'max:120'],
            'reset_permissions' => ['sometimes', 'boolean'],
        ]);

        $nextRole = $validated['role'] ?? $user->role;
        $this->validateRoleExtras(array_merge($user->only(['role', 'company_name']), ['role' => $nextRole], $validated));

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        if (($validated['reset_permissions'] ?? false) === true) {
            $validated['custom_permissions'] = null;
        } elseif (array_key_exists('custom_permissions', $validated)) {
            $validated['custom_permissions'] = $this->resolveCustomPermissions(
                $nextRole,
                $validated['custom_permissions'],
            );
        }

        unset($validated['reset_permissions']);

        $previousRole = $user->role;
        $user->update($validated);
        $user = $user->fresh();
        $this->syncApplicationAccess($user);

        if (isset($validated['role']) && $validated['role'] !== $previousRole) {
            app(\App\Services\Notification\SystemNotificationTriggers::class)
                ->userRoleUpdated($user, $previousRole, $request->user());
        }

        return response()->json([
            'data' => new UserResource($user),
            'message' => 'Usuario atualizado com sucesso.',
        ]);
    }

    public function destroy(User $user): JsonResponse
    {
        if ($user->id === request()->user()?->id) {
            return response()->json(['message' => 'Voce nao pode excluir sua propria conta.'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'Usuario excluido com sucesso.']);
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function validateRoleExtras(array $validated): void
    {
        if (($validated['role'] ?? '') === HubRole::CONNECT_EMPRESA && empty($validated['company_name'])) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'company_name' => 'Informe o nome da empresa para o perfil Empresa parceira.',
            ]);
        }
    }

    /**
     * @param  list<string>|null  $selected
     * @return list<string>|null
     */
    private function resolveCustomPermissions(string $role, ?array $selected): ?array
    {
        if ($role === HubRole::UNASSIGNED || $role === HubRole::ADMIN) {
            return null;
        }

        if ($selected === null) {
            return null;
        }

        $defaults = app(PermissionService::class)->defaultPermissionsForRole($role);
        $built = app(PermissionService::class)->buildCustomPermissions($role, $selected);

        sort($defaults);
        sort($built);

        return $defaults === $built ? null : $built;
    }

    private function syncApplicationAccess(User $user): void
    {
        $slugs = app(PermissionService::class)->applicationSlugsFor($user);
        $ids = \App\Models\Application::query()->whereIn('slug', $slugs)->pluck('id');
        $user->applications()->sync($ids);
    }
}
