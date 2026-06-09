<?php

namespace App\Http\Controllers\Api\Safe;

use App\Http\Controllers\Controller;
use App\Http\Resources\Safe\SafeStudentResource;
use App\Models\Safe\SafeStudent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StudentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', $request->query('q', '')));

        $students = SafeStudent::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', '%'.$search.'%')
                        ->orWhere('registration', 'like', '%'.$search.'%')
                        ->orWhere('class_name', 'like', '%'.$search.'%');
                });
            })
            ->when($request->filled('active'), fn ($query) => $query->where('active', $request->boolean('active')))
            ->when($request->filled('class_name'), fn ($query) => $query->where('class_name', $request->string('class_name')->toString()))
            ->orderBy('name')
            ->paginate($request->integer('per_page', 15));

        return SafeStudentResource::collection($students)->response();
    }

    public function show(SafeStudent $safeStudent): JsonResponse
    {
        $safeStudent->loadCount('authorizations');

        return response()->json([
            'data' => new SafeStudentResource($safeStudent),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'registration' => ['required', 'string', 'max:50', 'unique:safe_students,registration'],
            'name' => ['required', 'string', 'max:255'],
            'class_name' => ['required', 'string', 'max:255'],
            'active' => ['nullable', 'boolean'],
        ]);

        $student = SafeStudent::query()->create([
            'registration' => $validated['registration'],
            'name' => $validated['name'],
            'class_name' => $validated['class_name'],
            'active' => (bool) ($validated['active'] ?? true),
        ]);

        return response()->json([
            'data' => new SafeStudentResource($student),
            'message' => 'Aluno cadastrado com sucesso.',
        ], 201);
    }

    public function update(Request $request, SafeStudent $safeStudent): JsonResponse
    {
        $validated = $request->validate([
            'registration' => ['sometimes', 'string', 'max:50', Rule::unique('safe_students', 'registration')->ignore($safeStudent->id)],
            'name' => ['sometimes', 'string', 'max:255'],
            'class_name' => ['sometimes', 'string', 'max:255'],
            'active' => ['nullable', 'boolean'],
        ]);

        $safeStudent->update($validated);

        return response()->json([
            'data' => new SafeStudentResource($safeStudent->fresh()),
            'message' => 'Aluno atualizado com sucesso.',
        ]);
    }

    public function destroy(SafeStudent $safeStudent): JsonResponse
    {
        $safeStudent->delete();

        return response()->json(['message' => 'Aluno removido com sucesso.']);
    }
}
