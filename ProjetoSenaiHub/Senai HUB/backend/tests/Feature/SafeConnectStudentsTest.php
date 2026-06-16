<?php

namespace Tests\Feature;

use App\Models\Connect\ConnectStudent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SafeConnectStudentsTest extends TestCase
{
    use RefreshDatabase;

    public function test_safe_students_list_comes_from_connect(): void
    {
        $this->seed();

        $aqv = User::query()->where('email', 'ana.aqv@safe.senai.local')->firstOrFail();
        $connectCount = ConnectStudent::query()->count();

        Sanctum::actingAs($aqv);

        $response = $this->getJson('/api/safe/students?per_page=100')
            ->assertOk();

        $this->assertGreaterThan(0, $connectCount);
        $this->assertSame($connectCount, count($response->json('data')));
        $this->assertNotNull($response->json('data.0.connect_student_id'));
    }

    public function test_safe_cannot_create_duplicate_student_registry(): void
    {
        $this->seed();

        $aqv = User::query()->where('email', 'ana.aqv@safe.senai.local')->firstOrFail();
        Sanctum::actingAs($aqv);

        $this->postJson('/api/safe/students', [
            'registration' => 'TEST-001',
            'name' => 'Aluno Teste',
            'class_name' => 'Turma X',
        ])->assertStatus(422);
    }
}
