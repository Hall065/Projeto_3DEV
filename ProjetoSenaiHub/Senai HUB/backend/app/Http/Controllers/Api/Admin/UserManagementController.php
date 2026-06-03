<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\HubUserDetailResource;
use App\Http\Resources\UserResource;
use App\Models\User;
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
            'assignable' => $key !== HubRole::ADMIN,
        ])->values();

        return response()->json(['data' => $roles]);
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
            'role' => ['required', Rule::in(HubRole::all())],
            'company_name' => ['nullable', 'string', 'max:255'],
        ]);

        $this->validateRoleExtras($validated);

        $user = User::query()->create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'company_name' => $validated['company_name'] ?? null,
            'email_verified_at' => now(),
        ]);

        $this->syncApplicationAccess($user);

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
        ]);

        if (isset($validated['role'])) {
            $this->validateRoleExtras(array_merge($user->only(['role', 'company_name']), $validated));
        }

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);
        $this->syncApplicationAccess($user->fresh());

        return response()->json([
            'data' => new UserResource($user->fresh()),
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

    private function syncApplicationAccess(User $user): void
    {
        $slugs = app(\App\Services\Auth\PermissionService::class)->applicationSlugsFor($user);
        $ids = \App\Models\Application::query()->whereIn('slug', $slugs)->pluck('id');
        $user->applications()->sync($ids);
    }
}
