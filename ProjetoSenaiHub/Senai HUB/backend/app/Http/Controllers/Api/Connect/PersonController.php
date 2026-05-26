<?php

namespace App\Http\Controllers\Api\Connect;

use App\Http\Controllers\Controller;
use App\Http\Resources\HubPersonResource;
use App\Models\HubPerson;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PersonController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = HubPerson::query()->orderBy('full_name');

        if ($request->filled('kind')) {
            $query->where('kind', $request->string('kind')->toString());
        }

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search): void {
                $q->where('full_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('registration_number', 'like', "%{$search}%")
                    ->orWhere('cpf', 'like', "%{$search}%");
            });
        }

        $people = $query->paginate($request->integer('per_page', 20));

        return HubPersonResource::collection($people)->response();
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kind' => ['required', Rule::in(['student', 'teacher', 'staff', 'other'])],
            'full_name' => ['required', 'string', 'max:255'],
            'cpf' => ['nullable', 'string', 'max:14'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'registration_number' => ['nullable', 'string', 'max:50'],
            'birth_date' => ['nullable', 'date'],
            'specialty' => ['nullable', 'string', 'max:255'],
            'user_id' => ['nullable', 'exists:users,id'],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'graduated'])],
        ]);

        $person = HubPerson::query()->create([
            ...$validated,
            'status' => $validated['status'] ?? 'active',
        ]);

        return response()->json([
            'data' => new HubPersonResource($person),
            'message' => 'Pessoa cadastrada no cadastro global.',
        ], 201);
    }

    public function update(Request $request, HubPerson $person): JsonResponse
    {
        $validated = $request->validate([
            'kind' => ['sometimes', Rule::in(['student', 'teacher', 'staff', 'other'])],
            'full_name' => ['sometimes', 'string', 'max:255'],
            'cpf' => ['nullable', 'string', 'max:14'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'registration_number' => ['nullable', 'string', 'max:50'],
            'birth_date' => ['nullable', 'date'],
            'specialty' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'graduated'])],
        ]);

        $person->update($validated);

        return response()->json([
            'data' => new HubPersonResource($person->fresh()),
            'message' => 'Pessoa atualizada com sucesso.',
        ]);
    }

    public function destroy(HubPerson $person): JsonResponse
    {
        if ($person->connectStudent()->exists() || $person->connectTeacher()->exists()) {
            return response()->json([
                'message' => 'Esta pessoa possui perfil Connect vinculado. Exclua o perfil de aluno ou professor antes.',
            ], 422);
        }

        $person->delete();

        return response()->json(['message' => 'Pessoa excluída com sucesso.']);
    }
}
