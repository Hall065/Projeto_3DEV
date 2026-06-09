<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ConnectAccessScopeTest extends TestCase
{
    use RefreshDatabase;

    public function test_connect_student_dashboard_is_scoped_to_self(): void
    {
        $this->seed();

        $student = User::query()->where('email', 'maria.aluno@senai.local')->firstOrFail();
        Sanctum::actingAs($student);

        $response = $this->getJson('/api/connect/dashboard');

        $response->assertOk()
            ->assertJsonPath('data.kpis.total_students', 1);
    }

    public function test_connect_secretaria_sees_all_students(): void
    {
        $this->seed();

        $secretaria = User::query()->where('email', 'fernanda.secretaria@senai.local')->firstOrFail();
        Sanctum::actingAs($secretaria);

        $response = $this->getJson('/api/connect/dashboard');

        $response->assertOk();

        $total = (int) $response->json('data.kpis.total_students');

        $this->assertGreaterThan(1, $total);
    }

    public function test_connect_professor_dashboard_has_no_global_activities(): void
    {
        $this->seed();

        $professor = User::query()->where('email', 'carlos.professor@senai.local')->firstOrFail();
        Sanctum::actingAs($professor);

        $response = $this->getJson('/api/connect/dashboard');

        $response->assertOk()
            ->assertJsonPath('data.kpis.pending_alerts', 0)
            ->assertJsonPath('data.recent_activities', []);
    }

    public function test_connect_secretaria_dashboard_includes_activities(): void
    {
        $this->seed();

        $secretaria = User::query()->where('email', 'fernanda.secretaria@senai.local')->firstOrFail();
        Sanctum::actingAs($secretaria);

        $response = $this->getJson('/api/connect/dashboard');

        $response->assertOk();

        $activities = $response->json('data.recent_activities');

        $this->assertIsArray($activities);
        $this->assertNotEmpty($activities);
    }

    public function test_connect_student_calendar_is_scoped_to_enrolled_classes(): void
    {
        $this->seed();

        $student = User::query()->where('email', 'maria.aluno@senai.local')->firstOrFail();
        Sanctum::actingAs($student);

        $response = $this->getJson('/api/connect/calendar?from=2025-01-01&to=2026-12-31');

        $response->assertOk();

        $lessons = $response->json('data');
        $this->assertIsArray($lessons);
        $this->assertNotEmpty($lessons);

        $secretaria = User::query()->where('email', 'fernanda.secretaria@senai.local')->firstOrFail();
        Sanctum::actingAs($secretaria);

        $allResponse = $this->getJson('/api/connect/calendar?from=2025-01-01&to=2026-12-31');
        $allLessons = $allResponse->json('data');

        $this->assertGreaterThan(count($lessons), count($allLessons));
    }

    public function test_connect_professor_calendar_is_scoped_to_own_classes(): void
    {
        $this->seed();

        $professor = User::query()->where('email', 'carlos.professor@senai.local')->firstOrFail();
        Sanctum::actingAs($professor);

        $response = $this->getJson('/api/connect/calendar?from=2025-01-01&to=2026-12-31');

        $response->assertOk();

        $lessons = $response->json('data');
        $this->assertIsArray($lessons);
        $this->assertNotEmpty($lessons);

        $secretaria = User::query()->where('email', 'fernanda.secretaria@senai.local')->firstOrFail();
        Sanctum::actingAs($secretaria);

        $allResponse = $this->getJson('/api/connect/calendar?from=2025-01-01&to=2026-12-31');
        $allLessons = $allResponse->json('data');

        $this->assertGreaterThan(count($lessons), count($allLessons));
    }
}
