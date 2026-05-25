<?php

namespace App\Http\Controllers\Api\Connect;

use App\Http\Controllers\Controller;
use App\Http\Resources\Connect\ConnectTeacherResource;
use App\Models\Connect\ConnectActivity;
use App\Models\Connect\ConnectTeacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TeacherController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ConnectTeacher::query()
            ->withCount('classes')
            ->orderBy('full_name');

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('full_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('specialty', 'like', "%{$search}%");
            });
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

        $teacher = ConnectTeacher::query()->create([
            ...$validated,
            'status' => $validated['status'] ?? 'active',
        ]);

        ConnectActivity::query()->create([
            'title' => 'Novo professor cadastrado',
            'description' => "Cadastro de {$teacher->full_name} realizado.",
            'type' => 'cadastro',
            'entity_type' => 'teacher',
            'entity_id' => $teacher->id,
            'performed_by' => $request->user()?->name ?? 'Sistema',
            'occurred_at' => now(),
        ]);

        return response()->json([
            'data' => new ConnectTeacherResource($teacher),
            'message' => 'Professor cadastrado com sucesso.',
        ], 201);
    }
}
