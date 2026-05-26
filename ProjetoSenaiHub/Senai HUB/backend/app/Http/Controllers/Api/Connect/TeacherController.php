<?php

namespace App\Http\Controllers\Api\Connect;

use App\Http\Controllers\Controller;
use App\Http\Resources\Connect\ConnectTeacherResource;
use App\Models\Connect\ConnectActivity;
use App\Models\Connect\ConnectTeacher;
use App\Models\HubPerson;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TeacherController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ConnectTeacher::query()
            ->with('hubPerson')
            ->withCount('classes')
            ->orderBy('full_name');

        if ($search = $request->string('search')->trim()->toString()) {
            $query->whereProfileMatches($search, ['full_name', 'email', 'specialty', 'cpf']);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        $teachers = $query->paginate($request->integer('per_page', 15));

        return ConnectTeacherResource::collection($teachers)->response();
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'cpf' => ['nullable', 'string', 'max:14'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'specialty' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
            'user_id' => ['nullable', 'exists:users,id'],
        ]);

        $teacher = DB::transaction(function () use ($validated) {
            $person = HubPerson::query()->create([
                'kind' => 'teacher',
                'user_id' => $validated['user_id'] ?? null,
                'full_name' => $validated['full_name'],
                'cpf' => $validated['cpf'] ?? null,
                'registration_number' => null,
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'birth_date' => null,
                'specialty' => $validated['specialty'] ?? null,
                'status' => $validated['status'] ?? 'active',
            ]);

            return ConnectTeacher::query()->create([
                'hub_person_id' => $person->id,
                'user_id' => $validated['user_id'] ?? null,
                'full_name' => $validated['full_name'],
                'cpf' => $validated['cpf'] ?? null,
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'specialty' => $validated['specialty'] ?? null,
                'status' => $validated['status'] ?? 'active',
            ]);
        });

        ConnectActivity::query()->create([
            'title' => 'Novo professor cadastrado',
            'description' => "Cadastro de {$teacher->full_name} realizado.",
            'type' => 'cadastro',
            'entity_type' => 'teacher',
            'entity_id' => $teacher->id,
            'performed_by' => $request->user()?->name ?? 'Sistema',
            'occurred_at' => now(),
        ]);

        $teacher->load('hubPerson');

        return response()->json([
            'data' => new ConnectTeacherResource($teacher),
            'message' => 'Professor cadastrado com sucesso.',
        ], 201);
    }

    public function update(Request $request, ConnectTeacher $teacher): JsonResponse
    {
        $validated = $request->validate([
            'full_name' => ['sometimes', 'string', 'max:255'],
            'cpf' => ['nullable', 'string', 'max:14'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'specialty' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ]);

        DB::transaction(function () use ($validated, $teacher): void {
            $profileFields = collect($validated)->only([
                'full_name', 'cpf', 'email', 'phone', 'specialty', 'status',
            ])->filter(fn ($v) => $v !== null)->all();

            if ($teacher->hubPerson && $profileFields !== []) {
                $teacher->hubPerson->update($profileFields);
            }

            $teacher->update($validated);
        });

        $teacher->load('hubPerson');

        return response()->json([
            'data' => new ConnectTeacherResource($teacher),
            'message' => 'Professor atualizado com sucesso.',
        ]);
    }

    public function destroy(ConnectTeacher $teacher): JsonResponse
    {
        DB::transaction(function () use ($teacher): void {
            $personId = $teacher->hub_person_id;
            $teacher->delete();
            if ($personId) {
                HubPerson::query()->whereKey($personId)->delete();
            }
        });

        return response()->json(['message' => 'Professor excluído com sucesso.']);
    }
}
