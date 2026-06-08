<?php

namespace App\Http\Controllers\Api\Connect;

use App\Http\Controllers\Controller;
use App\Http\Resources\Connect\ConnectClassWeeklyPatternResource;
use App\Http\Resources\Connect\ConnectLessonScheduleResource;
use App\Models\Connect\ConnectClass;
use App\Models\Connect\ConnectLessonSchedule;
use App\Services\Connect\ConnectScheduleService;
use App\Support\UserAccessScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CalendarController extends Controller
{
    public function __construct(
        private readonly ConnectScheduleService $schedule,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
            'connect_class_id' => ['nullable', 'exists:connect_classes,id'],
            'semester' => ['nullable', 'string', 'max:20'],
        ]);

        $allowedClassIds = UserAccessScope::connectClassQuery($request->user())->pluck('id');

        $query = ConnectLessonSchedule::query()
            ->with(['connectClass.course', 'teacher.hubPerson', 'attendanceSession'])
            ->whereIn('connect_class_id', $allowedClassIds)
            ->whereBetween('scheduled_date', [$validated['from'], $validated['to']])
            ->where('status', '!=', 'cancelled')
            ->orderBy('scheduled_date')
            ->orderBy('start_time');

        if (! empty($validated['connect_class_id'])) {
            $query->where('connect_class_id', $validated['connect_class_id']);
        }

        if (! empty($validated['semester'])) {
            $query->whereHas('connectClass', fn ($builder) => $builder->where('semester', $validated['semester']));
        }

        $lessons = $query->get();

        return response()->json([
            'data' => ConnectLessonScheduleResource::collection($lessons),
        ]);
    }

    public function storeLesson(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'connect_class_id' => ['required', 'exists:connect_classes,id'],
            'connect_teacher_id' => ['nullable', 'exists:connect_teachers,id'],
            'scheduled_date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i'],
            'subject' => ['nullable', 'string', 'max:255'],
            'lessons_count' => ['nullable', 'integer', 'min:1', 'max:5'],
            'notes' => ['nullable', 'string'],
        ]);

        $class = UserAccessScope::connectClassQuery($request->user())
            ->findOrFail($validated['connect_class_id']);

        $lesson = $this->schedule->createLesson($class, $validated);
        $lesson->load(['connectClass.course', 'teacher.hubPerson']);

        app(\App\Services\Notification\SystemNotificationTriggers::class)
            ->connectLessonScheduled($lesson, $request->user());

        return response()->json([
            'data' => new ConnectLessonScheduleResource($lesson),
            'message' => 'Aula cadastrada no calendario.',
        ], 201);
    }

    public function updateLesson(Request $request, ConnectLessonSchedule $connectLessonSchedule): JsonResponse
    {
        UserAccessScope::connectClassQuery($request->user())
            ->where('id', $connectLessonSchedule->connect_class_id)
            ->firstOrFail();

        $validated = $request->validate([
            'connect_teacher_id' => ['nullable', 'exists:connect_teachers,id'],
            'scheduled_date' => ['sometimes', 'date'],
            'start_time' => ['sometimes', 'date_format:H:i'],
            'end_time' => ['sometimes', 'date_format:H:i'],
            'subject' => ['nullable', 'string', 'max:255'],
            'lessons_count' => ['nullable', 'integer', 'min:1', 'max:5'],
            'status' => ['nullable', Rule::in(['scheduled', 'cancelled', 'completed'])],
            'notes' => ['nullable', 'string'],
        ]);

        $previousStatus = $connectLessonSchedule->status;
        $lesson = $this->schedule->updateLesson($connectLessonSchedule, $validated);
        $lesson->load(['connectClass.course', 'teacher.hubPerson', 'attendanceSession']);

        if (
            isset($validated['status'])
            && $validated['status'] === 'cancelled'
            && $previousStatus !== 'cancelled'
        ) {
            app(\App\Services\Notification\SystemNotificationTriggers::class)
                ->connectLessonCancelled($lesson, $request->user());
        }

        return response()->json([
            'data' => new ConnectLessonScheduleResource($lesson),
            'message' => 'Aula atualizada.',
        ]);
    }

    public function destroyLesson(Request $request, ConnectLessonSchedule $connectLessonSchedule): JsonResponse
    {
        UserAccessScope::connectClassQuery($request->user())
            ->where('id', $connectLessonSchedule->connect_class_id)
            ->firstOrFail();

        if ($connectLessonSchedule->attendanceSession()->exists()) {
            $connectLessonSchedule->update(['status' => 'cancelled']);
            app(\App\Services\Notification\SystemNotificationTriggers::class)
                ->connectLessonCancelled($connectLessonSchedule->fresh(), $request->user());

            return response()->json(['message' => 'Aula cancelada (frequencia ja registrada).']);
        }

        app(\App\Services\Notification\SystemNotificationTriggers::class)
            ->connectLessonCancelled($connectLessonSchedule, $request->user());
        $connectLessonSchedule->delete();

        return response()->json(['message' => 'Aula removida do calendario.']);
    }

    public function weeklyPatterns(Request $request, ConnectClass $connectClass): JsonResponse
    {
        UserAccessScope::connectClassQuery($request->user())
            ->where('id', $connectClass->id)
            ->firstOrFail();

        $patterns = $connectClass->weeklyPatterns()->orderBy('day_of_week')->orderBy('start_time')->get();

        return response()->json([
            'data' => ConnectClassWeeklyPatternResource::collection($patterns),
            'plan' => $this->schedule->schedulePlan($connectClass),
        ]);
    }

    public function syncWeeklyPatterns(Request $request, ConnectClass $connectClass): JsonResponse
    {
        UserAccessScope::connectClassQuery($request->user())
            ->where('id', $connectClass->id)
            ->firstOrFail();

        $validated = $request->validate([
            'patterns' => ['required', 'array'],
            'patterns.*.day_of_week' => ['required', 'integer', 'min:0', 'max:6'],
            'patterns.*.start_time' => ['required', 'date_format:H:i'],
            'patterns.*.end_time' => ['required', 'date_format:H:i'],
            'patterns.*.lessons_count' => ['nullable', 'integer', 'min:1', 'max:5'],
            'patterns.*.subject' => ['nullable', 'string', 'max:255'],
            'generate' => ['nullable', 'boolean'],
            'replace_future' => ['nullable', 'boolean'],
        ]);

        $patterns = $this->schedule->syncWeeklyPatterns($connectClass, $validated['patterns']);
        $generation = null;

        if ($request->boolean('generate')) {
            $generation = $this->schedule->generateFromPatterns(
                $connectClass->fresh(['course', 'weeklyPatterns']),
                $request->boolean('replace_future'),
            );
            if (($generation['created'] ?? 0) > 0) {
                app(\App\Services\Notification\SystemNotificationTriggers::class)
                    ->connectScheduleGenerated($connectClass->fresh(), (int) $generation['created'], $request->user());
            }
        }

        return response()->json([
            'data' => ConnectClassWeeklyPatternResource::collection($patterns),
            'plan' => $this->schedule->schedulePlan($connectClass->fresh(['course', 'weeklyPatterns', 'lessonSchedules'])),
            'generation' => $generation,
            'message' => 'Grade semanal atualizada.',
        ]);
    }

    public function generateSchedule(Request $request, ConnectClass $connectClass): JsonResponse
    {
        UserAccessScope::connectClassQuery($request->user())
            ->where('id', $connectClass->id)
            ->firstOrFail();

        $connectClass->load(['course', 'weeklyPatterns']);

        $result = $this->schedule->generateFromPatterns(
            $connectClass,
            $request->boolean('replace_future'),
        );

        if (($result['created'] ?? 0) > 0) {
            app(\App\Services\Notification\SystemNotificationTriggers::class)
                ->connectScheduleGenerated($connectClass->fresh(), (int) $result['created'], $request->user());
        }

        return response()->json([
            'generation' => $result,
            'plan' => $this->schedule->schedulePlan($connectClass->fresh(['course', 'weeklyPatterns', 'lessonSchedules'])),
            'message' => "Calendario gerado: {$result['created']} aula(s) criada(s).",
        ]);
    }

    public function schedulePlan(Request $request, ConnectClass $connectClass): JsonResponse
    {
        UserAccessScope::connectClassQuery($request->user())
            ->where('id', $connectClass->id)
            ->firstOrFail();

        return response()->json([
            'data' => $this->schedule->schedulePlan($connectClass->load(['course', 'weeklyPatterns', 'lessonSchedules'])),
        ]);
    }
}
