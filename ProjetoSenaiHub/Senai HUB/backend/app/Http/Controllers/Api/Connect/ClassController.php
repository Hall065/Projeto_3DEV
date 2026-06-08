<?php

namespace App\Http\Controllers\Api\Connect;

use App\Http\Controllers\Controller;
use App\Http\Resources\Connect\ConnectClassResource;
use App\Models\Connect\ConnectActivity;
use App\Models\Connect\ConnectClass;
use App\Services\Connect\ConnectEnrollmentService;
use App\Services\Connect\ConnectScheduleService;
use App\Support\ConnectForm;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ClassController extends Controller
{
    public function __construct(
        private readonly ConnectEnrollmentService $enrollment,
        private readonly ConnectScheduleService $schedule,
    ) {}
    public function index(Request $request): JsonResponse
    {
        $query = \App\Support\UserAccessScope::connectClassQuery($request->user())
            ->with(['course', 'teacher.hubPerson'])
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
        ConnectForm::mergeNullableForeignIds($request, ['connect_course_id', 'connect_teacher_id']);

        $validated = $request->validate([
            'connect_course_id' => ['nullable', 'exists:connect_courses,id'],
            'connect_teacher_id' => ['nullable', 'exists:connect_teachers,id'],
            'code' => ['nullable', 'string', 'max:50', 'unique:connect_classes,code'],
            'name' => ['required', 'string', 'max:255'],
            'shift' => ['nullable', Rule::in(['manha', 'tarde', 'noite'])],
            'semester' => ['nullable', 'string', 'max:20'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'weekly_patterns' => ['nullable', 'array'],
            'weekly_patterns.*.day_of_week' => ['required_with:weekly_patterns', 'integer', 'min:0', 'max:6'],
            'weekly_patterns.*.start_time' => ['required_with:weekly_patterns', 'date_format:H:i'],
            'weekly_patterns.*.end_time' => ['required_with:weekly_patterns', 'date_format:H:i'],
            'weekly_patterns.*.lessons_count' => ['nullable', 'integer', 'min:1', 'max:5'],
            'weekly_patterns.*.subject' => ['nullable', 'string', 'max:255'],
            'generate_schedule' => ['nullable', 'boolean'],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:200'],
            'default_lessons_per_day' => ['nullable', 'integer', 'min:1', 'max:5'],
            'max_absences_allowed' => ['nullable', 'integer', 'min:1', 'max:999'],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'finished'])],
        ]);

        $code = $validated['code'] ?? strtoupper(str_replace(' ', '-', preg_replace('/[^a-zA-Z0-9\s-]/', '', $validated['name'])));
        if (strlen($code) < 2) {
            $code = 'TURMA-'.now()->format('ymdHis');
        }

        $weeklyPatterns = $validated['weekly_patterns'] ?? null;
        $generateSchedule = $request->boolean('generate_schedule');
        unset($validated['weekly_patterns'], $validated['generate_schedule']);

        $class = ConnectClass::query()->create([
            ...$validated,
            'code' => $code,
            'connect_course_id' => $validated['connect_course_id'] ?? null,
            'connect_teacher_id' => $validated['connect_teacher_id'] ?? null,
            'shift' => $validated['shift'] ?? 'manha',
            'capacity' => $validated['capacity'] ?? 30,
            'status' => $validated['status'] ?? 'active',
        ]);

        $this->schedule->validateClassAssignment($class->fresh(['course']));

        if (is_array($weeklyPatterns)) {
            $this->schedule->syncWeeklyPatterns($class, $weeklyPatterns);
            if ($generateSchedule) {
                $this->schedule->generateFromPatterns($class->fresh(['course', 'weeklyPatterns']));
            }
        }

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

        $this->enrollment->syncTeacherCourseFromClass($class);

        app(\App\Services\Notification\SystemNotificationTriggers::class)
            ->connectClassAssigned($class, $request->user());

        return response()->json([
            'data' => new ConnectClassResource($class),
            'message' => 'Turma cadastrada com sucesso.',
        ], 201);
    }

    public function update(Request $request, ConnectClass $connectClass): JsonResponse
    {
        ConnectForm::mergeNullableForeignIds($request, ['connect_course_id', 'connect_teacher_id']);

        $validated = $request->validate([
            'connect_course_id' => ['sometimes', 'nullable', 'exists:connect_courses,id'],
            'connect_teacher_id' => ['nullable', 'exists:connect_teachers,id'],
            'code' => ['sometimes', 'string', 'max:50', Rule::unique('connect_classes', 'code')->ignore($connectClass->id)],
            'name' => ['sometimes', 'string', 'max:255'],
            'shift' => ['nullable', Rule::in(['manha', 'tarde', 'noite'])],
            'semester' => ['nullable', 'string', 'max:20'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'weekly_patterns' => ['nullable', 'array'],
            'weekly_patterns.*.day_of_week' => ['required_with:weekly_patterns', 'integer', 'min:0', 'max:6'],
            'weekly_patterns.*.start_time' => ['required_with:weekly_patterns', 'date_format:H:i'],
            'weekly_patterns.*.end_time' => ['required_with:weekly_patterns', 'date_format:H:i'],
            'weekly_patterns.*.lessons_count' => ['nullable', 'integer', 'min:1', 'max:5'],
            'weekly_patterns.*.subject' => ['nullable', 'string', 'max:255'],
            'generate_schedule' => ['nullable', 'boolean'],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:200'],
            'default_lessons_per_day' => ['nullable', 'integer', 'min:1', 'max:5'],
            'max_absences_allowed' => ['nullable', 'integer', 'min:1', 'max:999'],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'finished'])],
        ]);

        $weeklyPatterns = $validated['weekly_patterns'] ?? null;
        $generateSchedule = $request->boolean('generate_schedule');
        unset($validated['weekly_patterns'], $validated['generate_schedule']);

        $connectClass->update($validated);
        $connectClass->load(['course', 'teacher']);
        $this->schedule->validateClassAssignment($connectClass);
        $this->enrollment->syncTeacherCourseFromClass($connectClass);

        if (is_array($weeklyPatterns)) {
            $this->schedule->syncWeeklyPatterns($connectClass, $weeklyPatterns);
            if ($generateSchedule) {
                $this->schedule->generateFromPatterns($connectClass->fresh(['course', 'weeklyPatterns']));
            }
        }

        app(\App\Services\Notification\SystemNotificationTriggers::class)
            ->connectClassAssigned($connectClass, $request->user());

        return response()->json([
            'data' => new ConnectClassResource($connectClass),
            'message' => 'Turma atualizada com sucesso.',
        ]);
    }

    public function destroy(ConnectClass $connectClass): JsonResponse
    {
        if ($connectClass->students()->exists()) {
            return response()->json([
                'message' => 'Não é possível excluir uma turma com alunos matriculados.',
            ], 422);
        }

        $connectClass->delete();

        return response()->json(['message' => 'Turma excluída com sucesso.']);
    }
}
