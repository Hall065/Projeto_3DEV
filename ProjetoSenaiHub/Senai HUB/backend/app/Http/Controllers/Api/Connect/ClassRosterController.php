<?php

namespace App\Http\Controllers\Api\Connect;

use App\Http\Controllers\Controller;
use App\Http\Resources\HubPersonResource;
use App\Models\Connect\ConnectClass;
use App\Models\HubPerson;
use App\Services\Connect\ConnectEnrollmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClassRosterController extends Controller
{
    public function __construct(
        private readonly ConnectEnrollmentService $enrollment,
    ) {}

    public function index(ConnectClass $class): JsonResponse
    {
        $class->load(['enrolledPeople' => fn ($q) => $q->orderBy('full_name')]);

        return response()->json([
            'data' => HubPersonResource::collection($class->enrolledPeople),
        ]);
    }

    public function store(Request $request, ConnectClass $class): JsonResponse
    {
        $validated = $request->validate([
            'hub_person_id' => ['required', 'exists:hub_people,id'],
        ]);

        $person = HubPerson::query()->findOrFail($validated['hub_person_id']);

        if (! $person->isStudent()) {
            return response()->json(['message' => 'Somente cadastros do tipo aluno podem ser matriculados na turma.'], 422);
        }

        $this->enrollment->attachStudentToClass($person, $class);
        $this->enrollment->attachPersonToCourse($person, $class->course, 'student');

        return response()->json([
            'message' => 'Aluno vinculado a turma e ao curso.',
            'data' => new HubPersonResource($person),
        ], 201);
    }

    public function destroy(ConnectClass $class, HubPerson $person): JsonResponse
    {
        $this->enrollment->detachStudentFromClass($person, $class);

        return response()->json(['message' => 'Aluno removido da turma.']);
    }
}
