<?php

namespace Tests\Feature;

use App\Models\Connect\ConnectAttendanceSession;
use App\Models\Connect\ConnectClass;
use App\Models\Connect\ConnectCourse;
use App\Models\Connect\ConnectTeacher;
use App\Services\Connect\ConnectAttendanceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConnectAttendanceSessionTest extends TestCase
{
    use RefreshDatabase;

    private function createClassFixture(): ConnectClass
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

        return ConnectClass::query()->create([
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
        ]);
    }

    public function test_find_or_create_session_reuses_existing_row_on_sqlite_date_format(): void
    {
        $class = $this->createClassFixture();
        $service = app(ConnectAttendanceService::class);

        ConnectAttendanceSession::query()->create([
            'connect_class_id' => $class->id,
            'connect_teacher_id' => $class->connect_teacher_id,
            'session_date' => '2026-06-14',
            'subject' => 'Aula regular',
            'lessons_count' => 4,
            'status' => 'open',
        ]);

        $session = $service->findOrCreateSession($class, '2026-06-14', 'Aula regular');

        $this->assertSame(1, ConnectAttendanceSession::query()->count());
        $this->assertSame('2026-06-14', $session->session_date?->format('Y-m-d'));
    }
}
