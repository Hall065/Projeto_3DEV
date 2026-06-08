<?php

namespace App\Services\Connect;

use App\Models\Connect\ConnectClass;
use App\Models\Connect\ConnectClassWeeklyPattern;
use App\Models\Connect\ConnectLessonSchedule;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class ConnectScheduleService
{
    /**
     * @param  array<int, array<string, mixed>>  $patterns
     */
    public function syncWeeklyPatterns(ConnectClass $class, array $patterns): Collection
    {
        $class->weeklyPatterns()->delete();

        $created = collect();

        foreach ($patterns as $pattern) {
            $dayOfWeek = (int) $pattern['day_of_week'];
            $startTime = $this->normalizeTime((string) $pattern['start_time']);
            $endTime = $this->normalizeTime((string) $pattern['end_time']);

            if ($startTime >= $endTime) {
                throw ValidationException::withMessages([
                    'weekly_patterns' => 'O horario de inicio deve ser anterior ao horario de fim.',
                ]);
            }

            $created->push($class->weeklyPatterns()->create([
                'day_of_week' => $dayOfWeek,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'lessons_count' => (int) ($pattern['lessons_count'] ?? 4),
                'subject' => (string) ($pattern['subject'] ?? 'Aula regular'),
            ]));
        }

        return $created;
    }

    /**
     * @return array<string, mixed>
     */
    public function schedulePlan(ConnectClass $class): array
    {
        $class->loadMissing(['course', 'weeklyPatterns', 'lessonSchedules']);

        $workloadHours = (int) ($class->course?->workload_hours ?? 0);
        $scheduledLessons = (int) $class->lessonSchedules()
            ->where('status', '!=', 'cancelled')
            ->sum('lessons_count');

        $weeklyLessons = (int) $class->weeklyPatterns->sum('lessons_count');
        $weeksNeeded = $weeklyLessons > 0 && $workloadHours > 0
            ? (int) ceil($workloadHours / $weeklyLessons)
            : null;

        return [
            'workload_hours' => $workloadHours,
            'scheduled_lessons' => $scheduledLessons,
            'remaining_lessons' => $workloadHours > 0 ? max(0, $workloadHours - $scheduledLessons) : null,
            'weekly_lessons' => $weeklyLessons,
            'estimated_weeks' => $weeksNeeded,
            'class_start_date' => $class->start_date?->format('Y-m-d'),
            'class_end_date' => $class->end_date?->format('Y-m-d'),
            'course_start_date' => $class->course?->start_date?->format('Y-m-d'),
            'course_end_date' => $class->course?->end_date?->format('Y-m-d'),
            'semester' => $class->semester,
            'patterns_count' => $class->weeklyPatterns->count(),
        ];
    }

    /**
     * @return array{created: int, skipped: int, errors: array<int, string>}
     */
    public function generateFromPatterns(ConnectClass $class, bool $replaceFuture = false): array
    {
        $class->loadMissing(['course', 'weeklyPatterns']);

        $this->assertClassHasSchedulingPeriod($class);

        if ($class->weeklyPatterns->isEmpty()) {
            throw ValidationException::withMessages([
                'weekly_patterns' => 'Cadastre ao menos um horario semanal antes de gerar o calendario.',
            ]);
        }

        $periodStart = Carbon::parse($class->start_date)->startOfDay();
        $periodEnd = Carbon::parse($class->end_date)->startOfDay();
        $workloadHours = (int) ($class->course?->workload_hours ?? 0);

        if ($replaceFuture) {
            $class->lessonSchedules()
                ->where('scheduled_date', '>=', now()->toDateString())
                ->where('status', 'scheduled')
                ->whereDoesntHave('attendanceSession')
                ->delete();
        }

        $created = 0;
        $skipped = 0;
        $errors = [];
        $totalLessons = (int) $class->lessonSchedules()
            ->where('status', '!=', 'cancelled')
            ->sum('lessons_count');

        for ($date = $periodStart->copy(); $date->lte($periodEnd); $date->addDay()) {
            foreach ($class->weeklyPatterns as $pattern) {
                if ((int) $date->dayOfWeek !== (int) $pattern->day_of_week) {
                    continue;
                }

                if ($workloadHours > 0 && $totalLessons >= $workloadHours) {
                    break 2;
                }

                try {
                    $this->assertNoConflict(
                        $class->id,
                        $class->connect_teacher_id,
                        $date->toDateString(),
                        (string) $pattern->start_time,
                        (string) $pattern->end_time,
                    );

                    $exists = ConnectLessonSchedule::query()
                        ->where('connect_class_id', $class->id)
                        ->where('scheduled_date', $date->toDateString())
                        ->where('start_time', $pattern->start_time)
                        ->exists();

                    if ($exists) {
                        $skipped++;

                        continue;
                    }

                    ConnectLessonSchedule::query()->create([
                        'connect_class_id' => $class->id,
                        'connect_teacher_id' => $class->connect_teacher_id,
                        'connect_class_weekly_pattern_id' => $pattern->id,
                        'scheduled_date' => $date->toDateString(),
                        'start_time' => $pattern->start_time,
                        'end_time' => $pattern->end_time,
                        'subject' => $pattern->subject,
                        'lessons_count' => $pattern->lessons_count,
                        'status' => 'scheduled',
                    ]);

                    $created++;
                    $totalLessons += (int) $pattern->lessons_count;
                } catch (ValidationException $exception) {
                    $message = collect($exception->errors())->flatten()->first() ?? 'Conflito de horario.';
                    $errors[] = $date->format('d/m/Y').' '.$pattern->start_time.': '.$message;
                    $skipped++;
                }
            }
        }

        return compact('created', 'skipped', 'errors');
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function createLesson(ConnectClass $class, array $payload): ConnectLessonSchedule
    {
        $this->validateLessonAgainstClassPeriod($class, $payload);
        $this->assertNoConflict(
            $class->id,
            $payload['connect_teacher_id'] ?? $class->connect_teacher_id,
            (string) $payload['scheduled_date'],
            (string) $payload['start_time'],
            (string) $payload['end_time'],
        );

        return ConnectLessonSchedule::query()->create([
            'connect_class_id' => $class->id,
            'connect_teacher_id' => $payload['connect_teacher_id'] ?? $class->connect_teacher_id,
            'scheduled_date' => $payload['scheduled_date'],
            'start_time' => $this->normalizeTime((string) $payload['start_time']),
            'end_time' => $this->normalizeTime((string) $payload['end_time']),
            'subject' => $payload['subject'] ?? 'Aula regular',
            'lessons_count' => (int) ($payload['lessons_count'] ?? 4),
            'status' => $payload['status'] ?? 'scheduled',
            'notes' => $payload['notes'] ?? null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function updateLesson(ConnectLessonSchedule $lesson, array $payload): ConnectLessonSchedule
    {
        $lesson->loadMissing('connectClass');
        $class = $lesson->connectClass;

        $scheduledDate = (string) ($payload['scheduled_date'] ?? $lesson->scheduled_date?->format('Y-m-d'));
        $startTime = $this->normalizeTime((string) ($payload['start_time'] ?? $lesson->start_time));
        $endTime = $this->normalizeTime((string) ($payload['end_time'] ?? $lesson->end_time));
        $teacherId = $payload['connect_teacher_id'] ?? $lesson->connect_teacher_id ?? $class?->connect_teacher_id;

        if ($class) {
            $this->validateLessonAgainstClassPeriod($class, [
                'scheduled_date' => $scheduledDate,
                'start_time' => $startTime,
                'end_time' => $endTime,
            ]);
        }

        $this->assertNoConflict(
            $lesson->connect_class_id,
            $teacherId,
            $scheduledDate,
            $startTime,
            $endTime,
            $lesson->id,
        );

        $lesson->update([
            'connect_teacher_id' => $teacherId,
            'scheduled_date' => $scheduledDate,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'subject' => $payload['subject'] ?? $lesson->subject,
            'lessons_count' => (int) ($payload['lessons_count'] ?? $lesson->lessons_count),
            'status' => $payload['status'] ?? $lesson->status,
            'notes' => array_key_exists('notes', $payload) ? $payload['notes'] : $lesson->notes,
        ]);

        return $lesson->fresh();
    }

    public function validateClassAssignment(ConnectClass $class): void
    {
        $class->loadMissing('course');

        if (! $class->start_date || ! $class->end_date) {
            return;
        }

        if ($class->end_date->lt($class->start_date)) {
            throw ValidationException::withMessages([
                'end_date' => 'A data de termino deve ser igual ou posterior ao inicio da turma.',
            ]);
        }

        $course = $class->course;
        if (! $course) {
            return;
        }

        if ($course->start_date && $class->start_date->lt($course->start_date)) {
            throw ValidationException::withMessages([
                'start_date' => 'A turma nao pode iniciar antes do periodo do curso.',
            ]);
        }

        if ($course->end_date && $class->end_date->gt($course->end_date)) {
            throw ValidationException::withMessages([
                'end_date' => 'A turma nao pode terminar apos o periodo do curso.',
            ]);
        }
    }

    public function assertNoConflict(
        int $classId,
        ?int $teacherId,
        string $date,
        string $startTime,
        string $endTime,
        ?int $excludeLessonId = null,
    ): void {
        $startTime = $this->normalizeTime($startTime);
        $endTime = $this->normalizeTime($endTime);

        if ($startTime >= $endTime) {
            throw ValidationException::withMessages([
                'start_time' => 'O horario de inicio deve ser anterior ao horario de fim.',
            ]);
        }

        $classConflict = $this->overlappingLessonsQuery($date, $startTime, $endTime, $excludeLessonId)
            ->where('connect_class_id', $classId)
            ->exists();

        if ($classConflict) {
            throw ValidationException::withMessages([
                'scheduled_date' => 'Esta turma ja possui aula neste horario.',
            ]);
        }

        if ($teacherId) {
            $teacherConflict = $this->overlappingLessonsQuery($date, $startTime, $endTime, $excludeLessonId)
                ->where('connect_teacher_id', $teacherId)
                ->exists();

            if ($teacherConflict) {
                throw ValidationException::withMessages([
                    'connect_teacher_id' => 'O professor ja possui aula neste horario.',
                ]);
            }
        }
    }

    private function overlappingLessonsQuery(
        string $date,
        string $startTime,
        string $endTime,
        ?int $excludeLessonId,
    ) {
        $query = ConnectLessonSchedule::query()
            ->where('scheduled_date', $date)
            ->where('status', '!=', 'cancelled')
            ->where(function ($builder) use ($startTime, $endTime): void {
                $builder->where('start_time', '<', $endTime)
                    ->where('end_time', '>', $startTime);
            });

        if ($excludeLessonId) {
            $query->where('id', '!=', $excludeLessonId);
        }

        return $query;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function validateLessonAgainstClassPeriod(ConnectClass $class, array $payload): void
    {
        $class->loadMissing('course');
        $date = Carbon::parse((string) $payload['scheduled_date'])->startOfDay();

        if ($class->start_date && $date->lt($class->start_date)) {
            throw ValidationException::withMessages([
                'scheduled_date' => 'A aula esta fora do periodo da turma.',
            ]);
        }

        if ($class->end_date && $date->gt($class->end_date)) {
            throw ValidationException::withMessages([
                'scheduled_date' => 'A aula esta fora do periodo da turma.',
            ]);
        }

        $course = $class->course;
        if ($course?->start_date && $date->lt($course->start_date)) {
            throw ValidationException::withMessages([
                'scheduled_date' => 'A aula esta fora do periodo do curso.',
            ]);
        }

        if ($course?->end_date && $date->gt($course->end_date)) {
            throw ValidationException::withMessages([
                'scheduled_date' => 'A aula esta fora do periodo do curso.',
            ]);
        }
    }

    private function assertClassHasSchedulingPeriod(ConnectClass $class): void
    {
        if (! $class->start_date || ! $class->end_date) {
            throw ValidationException::withMessages([
                'start_date' => 'Informe inicio e fim da turma para gerar o calendario.',
            ]);
        }
    }

    private function normalizeTime(string $time): string
    {
        if (strlen($time) === 5) {
            return $time.':00';
        }

        return $time;
    }
}
