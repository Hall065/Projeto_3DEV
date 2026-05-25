<?php

namespace App\Http\Controllers\Api\Connect;

use App\Http\Controllers\Controller;
use App\Http\Resources\Connect\ConnectClassResource;
use App\Models\Connect\ConnectActivity;
use App\Models\Connect\ConnectClass;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ClassController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ConnectClass::query()
            ->with(['course', 'teacher'])
            ->withCount('students')
            ->orderBy('code');

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('connect_course_id')) {
            $query->where('connect_course_id', $request->integer('connect_course_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        $classes = $query->paginate($request->integer('per_page', 15));

        return ConnectClassResource::collection($classes)->response();
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'connect_course_id' => ['required', 'exists:connect_courses,id'],
            'connect_teacher_id' => ['nullable', 'exists:connect_teachers,id'],
            'code' => ['required', 'string', 'max:50', 'unique:connect_classes,code'],
            'name' => ['required', 'string', 'max:255'],
            'shift' => ['nullable', Rule::in(['manha', 'tarde', 'noite'])],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:200'],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'finished'])],
        ]);

        $class = ConnectClass::query()->create([
            ...$validated,
            'shift' => $validated['shift'] ?? 'manha',
            'capacity' => $validated['capacity'] ?? 30,
            'status' => $validated['status'] ?? 'active',
        ]);

        ConnectActivity::query()->create([
            'title' => 'Nova turma criada',
            'description' => "Turma {$class->code} cadastrada no SENAI Connect.",
            'type' => 'cadastro',
            'entity_type' => 'class',
            'entity_id' => $class->id,
            'performed_by' => $request->user()?->name ?? 'Sistema',
            'occurred_at' => now(),
        ]);

        $class->load(['course', 'teacher']);

        return response()->json([
            'data' => new ConnectClassResource($class),
            'message' => 'Turma cadastrada com sucesso.',
        ], 201);
    }
}
