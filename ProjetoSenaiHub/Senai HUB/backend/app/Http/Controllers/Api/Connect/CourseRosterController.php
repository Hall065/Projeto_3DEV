<?php

namespace App\Http\Controllers\Api\Connect;

use App\Http\Controllers\Controller;
use App\Http\Resources\HubPersonResource;
use App\Models\Connect\ConnectClass;
use App\Models\Connect\ConnectCourse;
use App\Models\HubPerson;
use App\Services\Connect\ConnectEnrollmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CourseRosterController extends Controller
{
    public function __construct(
        private readonly ConnectEnrollmentService $enrollment,
    ) {}

    public function index(ConnectCourse $course): JsonResponse
    {
        $course->load(['people' => function ($q): void {
            $q->orderByPivot('role')->orderBy('full_name');
        }]);

        $grouped = $course->people->groupBy(fn (HubPerson $p) => $p->pivot->role);

        return response()->json([
            'data' => [
                'course_id' => $course->id,
                'course_name' => $course->name,
                'students' => HubPersonResource::collection($grouped->get('student', collect())),
                'teachers' => HubPersonResource::collection($grouped->get('teacher', collect())),
                'coordinators' => HubPersonResource::collection($grouped->get('coordinator', collect())),
            ],
        ]);
    }

    public function store(Request $request, ConnectCourse $course): JsonResponse
    {
        $validated = $request->validate([
            'hub_person_id' => ['required', 'exists:hub_people,id'],
            'role' => ['required', Rule::in(['student', 'teacher', 'coordinator'])],
        ]);

        $person = HubPerson::query()->findOrFail($validated['hub_person_id']);
        $role = $validated['role'];

        if ($role === 'student' && ! $person->isStudent()) {
            return response()->json(['message' => 'Apenas pessoas com tipo aluno podem ser matriculadas como estudante.'], 422);
        }

        if (in_array($role, ['teacher', 'coordinator'], true) && ! in_array($person->kind, ['teacher', 'staff'], true)) {
            return response()->json(['message' => 'Professores ou equipe podem ser vinculados como docente/coordenador.'], 422);
        }

        $this->enrollment->attachPersonToCourse($person, $course, $role);

        app(\App\Services\Notification\SystemNotificationTriggers::class)
            ->connectCourseRosterAdded($person, $role, $course->id, $course->name, $request->user());

        return response()->json([
            'message' => 'Vinculo ao curso registrado.',
            'data' => new HubPersonResource($person->load('courses')),
        ], 201);
    }

    public function storeFromClass(Request $request, ConnectCourse $course): JsonResponse
    {
        $validated = $request->validate([
            'connect_class_id' => ['required', 'exists:connect_classes,id'],
        ]);

        $class = ConnectClass::query()->findOrFail($validated['connect_class_id']);
        $result = $this->enrollment->enrollClassInCourse($class, $course);

        $message = $result['enrolled'] > 0
            ? "Turma vinculada. {$result['enrolled']} aluno(s) matriculado(s) no curso."
            : 'Turma vinculada. Nenhum aluno novo para matricular (todos já estavam no curso ou a turma está vazia).';

        return response()->json([
            'message' => $message,
            'data' => $result,
        ], 201);
    }

    public function destroy(Request $request, ConnectCourse $course, HubPerson $person): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['required', Rule::in(['student', 'teacher', 'coordinator'])],
        ]);

        $this->enrollment->detachPersonFromCourse($person, $course, $validated['role']);

        return response()->json(['message' => 'Vinculo removido.']);
    }
}
