<?php

namespace App\Http\Controllers\Api\Connect;

use App\Http\Controllers\Controller;
use App\Http\Resources\Connect\ConnectCourseResource;
use App\Models\Connect\ConnectActivity;
use App\Models\Connect\ConnectCourse;
use App\Models\Connect\ConnectLessonSchedule;
use App\Services\Connect\ConnectScheduleService;
use App\Support\UserAccessScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CourseController extends Controller
{
    public function __construct(
        private readonly ConnectScheduleService $schedule,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = UserAccessScope::connectCourseQuery($request->user())
            ->withCount('classes')
            ->orderBy('name');

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('area', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        $courses = $query->paginate($request->integer('per_page', 15));

        return ConnectCourseResource::collection($courses)->response();
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:20', 'unique:connect_courses,code'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'workload_hours' => ['nullable', 'integer', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'area' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ]);

        $course = ConnectCourse::query()->create([
            ...$validated,
            'workload_hours' => $validated['workload_hours'] ?? 0,
            'status' => $validated['status'] ?? 'active',
        ]);

        $provision = $this->schedule->provisionDefaultSemesterCalendar($course);
        $course = $course->fresh();
        $lessonsCreated = (int) ($provision['generation']['created'] ?? 0);

        ConnectActivity::query()->create([
            'title' => 'Novo curso cadastrado',
            'description' => "Curso {$course->name} adicionado ao catálogo.",
            'type' => 'cadastro',
            'entity_type' => 'course',
            'entity_id' => $course->id,
            'performed_by' => $request->user()?->name ?? 'Sistema',
            'occurred_at' => now(),
        ]);

        $message = 'Curso cadastrado com sucesso.';
        if ($lessonsCreated > 0) {
            $message .= " Calendario gerado com {$lessonsCreated} aula(s).";
        }

        return response()->json([
            'data' => new ConnectCourseResource($course),
            'message' => $message,
        ], 201);
    }

    public function update(Request $request, ConnectCourse $course): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['sometimes', 'string', 'max:20', Rule::unique('connect_courses', 'code')->ignore($course->id)],
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'workload_hours' => ['nullable', 'integer', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'area' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ]);

        $course->update($validated);
        $course = $course->fresh();

        if ($course->start_date && $course->end_date) {
            $hasLessons = ConnectLessonSchedule::query()
                ->whereHas('connectClass', fn ($query) => $query->where('connect_course_id', $course->id))
                ->where('status', '!=', 'cancelled')
                ->exists();

            if (! $hasLessons) {
                $this->schedule->provisionDefaultSemesterCalendar($course);
                $course = $course->fresh();
            }
        }

        ConnectActivity::query()->create([
            'title' => 'Curso atualizado',
            'description' => "Dados do curso {$course->name} foram atualizados.",
            'type' => 'update',
            'entity_type' => 'course',
            'entity_id' => $course->id,
            'performed_by' => $request->user()?->name ?? 'Sistema',
            'occurred_at' => now(),
        ]);

        return response()->json([
            'data' => new ConnectCourseResource($course->fresh()),
            'message' => 'Curso atualizado com sucesso.',
        ]);
    }

    public function destroy(ConnectCourse $course): JsonResponse
    {
        if ($course->classes()->exists()) {
            return response()->json([
                'message' => 'Não é possível excluir um curso com turmas vinculadas. Remova ou encerre as turmas antes.',
            ], 422);
        }

        $name = $course->name;
        $course->people()->detach();
        $course->delete();

        ConnectActivity::query()->create([
            'title' => 'Curso excluído',
            'description' => "Curso {$name} removido do catálogo.",
            'type' => 'delete',
            'entity_type' => 'course',
            'entity_id' => null,
            'performed_by' => request()->user()?->name ?? 'Sistema',
            'occurred_at' => now(),
        ]);

        return response()->json(['message' => 'Curso excluído com sucesso.']);
    }
}
