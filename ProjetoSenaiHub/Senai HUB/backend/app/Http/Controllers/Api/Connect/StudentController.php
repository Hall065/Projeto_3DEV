<?php

namespace App\Http\Controllers\Api\Connect;

use App\Http\Controllers\Controller;
use App\Http\Resources\Connect\ConnectStudentResource;
use App\Models\Connect\ConnectActivity;
use App\Models\Connect\ConnectStudent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StudentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ConnectStudent::query()
            ->with(['connectClass.course', 'location'])
            ->orderBy('full_name');

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('full_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('registration_number', 'like', "%{$search}%")
                    ->orWhere('cpf', 'like', "%{$search}%");
            });
        }

        if ($request->filled('connect_class_id')) {
            $query->where('connect_class_id', $request->integer('connect_class_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        $students = $query->paginate($request->integer('per_page', 15));

        return ConnectStudentResource::collection($students)->response();
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'connect_class_id' => ['nullable', 'exists:connect_classes,id'],
            'full_name' => ['required', 'string', 'max:255'],
            'cpf' => ['nullable', 'string', 'max:14'],
            'registration_number' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'birth_date' => ['nullable', 'date'],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'graduated'])],
            'user_id' => ['nullable', 'exists:users,id'],
        ]);

        $student = ConnectStudent::query()->create([
            ...$validated,
            'status' => $validated['status'] ?? 'active',
        ]);

        ConnectActivity::query()->create([
            'title' => 'Novo aluno cadastrado',
            'description' => "Cadastro de {$student->full_name} realizado no SENAI Connect.",
            'type' => 'cadastro',
            'entity_type' => 'student',
            'entity_id' => $student->id,
            'performed_by' => $request->user()?->name ?? 'Sistema',
            'occurred_at' => now(),
        ]);

        $student->load(['connectClass.course', 'location']);

        return response()->json([
            'data' => new ConnectStudentResource($student),
            'message' => 'Aluno cadastrado com sucesso.',
        ], 201);
    }
}
