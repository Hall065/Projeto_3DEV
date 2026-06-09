<?php

namespace Tests\Feature;

use App\Models\Connect\ConnectAttendanceSession;
use App\Models\Connect\ConnectClass;
use App\Models\Connect\ConnectCourse;
use App\Models\Connect\ConnectLessonSchedule;
use App\Models\Connect\ConnectStudent;
use App\Models\Connect\ConnectTeacher;
use App\Services\Connect\ConnectScheduleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class ConnectScheduleTest extends TestCase
{
    use RefreshDatabase;

    private function createClassFixture(array $overrides = []): ConnectClass
    {
        $course = ConnectCourse::query()->create([
            'code' => 'TST',
            'name' => 'Curso Teste',
            'workload_hours' => 40,
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
            'status' => 'active',
        ]);

        $teacher = ConnectTeacher::query()->create([
            'full_name' => 'Professor Teste',
            'cpf' => '111.222.333-44',
            'email' => 'prof.teste@senai.local',
            'status' => 'active',
        ]);

        return ConnectClass::query()->create(array_merge([
            'connect_course_id' => $course->id,
            'connect_teacher_id' => $teacher->id,
            'code' => 'TURMA-TST-01',
            'name' => 'Turma Teste',
            'shift' => 'noite',
            'semester' => '2025.1',
            'start_date' => '2025-02-01',
            'end_date' => '2025-03-31',
            'capacity' => 30,
            'status' => 'active',
        ], $overrides));
    }

    public function test_duplicate_semester_same_course_is_blocked(): void
    {
        $class = $this->createClassFixture();

        $this->expectException(ValidationException::class);

        $duplicate = new ConnectClass([
            'connect_course_id' => $class->connect_course_id,
            'connect_teacher_id' => $class->connect_teacher_id,
            'code' => 'TURMA-TST-02',
            'name' => 'Turma Teste Duplicada',
            'shift' => 'tarde',
            'semester' => '2025.1',
            'start_date' => '2025-02-15',
            'end_date' => '2025-04-30',
            'capacity' => 25,
            'status' => 'active',
        ]);

        app(ConnectScheduleService::class)->validateClassAssignment($duplicate);
    }

    public function test_generate_from_patterns_creates_lessons_in_period(): void
    {
        $class = $this->createClassFixture();
        $service = app(ConnectScheduleService::class);

        $service->syncWeeklyPatterns($class, [
            [
                'day_of_week' => 2,
                'start_time' => '19:00',
                'end_time' => '22:00',
                'lessons_count' => 4,
                'subject' => 'Aula regular',
            ],
        ]);

        $result = $service->generateFromPatterns($class);

        $this->assertGreaterThan(0, $result['created']);
        $this->assertDatabaseHas('connect_lesson_schedules', [
            'connect_class_id' => $class->id,
            'status' => 'scheduled',
        ]);

        $lessonCount = ConnectLessonSchedule::query()
            ->where('connect_class_id', $class->id)
            ->count();

        $this->assertGreaterThan(0, $lessonCount);
        $this->assertLessThanOrEqual(40, $lessonCount);
    }

    public function test_generate_provisions_attendance_sessions_for_students(): void
    {
        $class = $this->createClassFixture();
        $service = app(ConnectScheduleService::class);

        ConnectStudent::query()->create([
            'connect_class_id' => $class->id,
            'full_name' => 'Aluno Teste',
            'cpf' => '999.888.777-66',
            'email' => 'aluno.teste@senai.local',
            'registration_number' => '2025TST0001',
            'status' => 'active',
        ]);

        $service->syncWeeklyPatterns($class, [
            [
                'day_of_week' => 2,
                'start_time' => '19:00',
                'end_time' => '22:00',
                'lessons_count' => 4,
                'subject' => 'Aula regular',
            ],
        ]);

        $service->generateFromPatterns($class);

        $sessions = ConnectAttendanceSession::query()
            ->where('connect_class_id', $class->id)
            ->whereNotNull('connect_lesson_schedule_id')
            ->withCount('marks')
            ->get();

        $this->assertNotEmpty($sessions);
        $this->assertTrue($sessions->every(fn ($session) => $session->marks_count === 1));
        $this->assertTrue($sessions->every(fn ($session) => $session->status === 'open'));
    }
}
