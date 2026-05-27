<?php

namespace App\Http\Controllers\Api\Grid;

use App\Http\Controllers\Controller;
use App\Http\Resources\Grid\GridUserResource;
use App\Models\Grid\GridUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = GridUser::query()->orderBy('name');

        $query->search($request->string('search')->trim()->toString() ?: null);

        if ($request->filled('role')) {
            $query->where('role', $request->string('role')->toString());
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        $users = $query->paginate($request->integer('per_page', 10));

        return GridUserResource::collection($users)->response();
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:grid_users,email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'role' => ['required', 'string', 'max:100'],
            'cpf' => ['nullable', 'string', 'max:14'],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ]);

        $user = GridUser::query()->create([
            ...$validated,
            'status' => $validated['status'] ?? 'active',
        ]);

        return response()->json([
            'data' => new GridUserResource($user),
            'message' => 'Usuário cadastrado com sucesso.',
        ], 201);
    }

    public function update(Request $request, GridUser $gridUser): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('grid_users', 'email')->ignore($gridUser->id)],
            'phone' => ['nullable', 'string', 'max:20'],
            'role' => ['sometimes', 'string', 'max:100'],
            'cpf' => ['nullable', 'string', 'max:14'],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ]);

        $gridUser->update($validated);

        return response()->json([
            'data' => new GridUserResource($gridUser->fresh()),
            'message' => 'Usuário atualizado com sucesso.',
        ]);
    }

    public function destroy(GridUser $gridUser): JsonResponse
    {
        $gridUser->delete();

        return response()->json(['message' => 'Usuário excluído com sucesso.']);
    }
}
