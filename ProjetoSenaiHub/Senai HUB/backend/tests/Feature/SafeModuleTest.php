<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SafeModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_safe_aqv_can_access_dashboard(): void
    {
        $this->seed();

        $user = User::query()->where('email', 'ana.aqv@safe.senai.local')->firstOrFail();
        Sanctum::actingAs($user);

        $this->getJson('/api/safe/dashboard')
            ->assertOk()
            ->assertJsonStructure(['data' => ['view', 'kpis']]);
    }

    public function test_safe_professor_cannot_manage_students(): void
    {
        $this->seed();

        $user = User::query()->where('email', 'marcos.professor@safe.senai.local')->firstOrFail();
        Sanctum::actingAs($user);

        $this->getJson('/api/safe/students')
            ->assertForbidden();
    }

    public function test_connect_user_cannot_access_safe_api(): void
    {
        $this->seed();

        $user = User::query()->where('email', 'carlos.professor@senai.local')->firstOrFail();
        Sanctum::actingAs($user);

        $this->getJson('/api/safe/dashboard')
            ->assertForbidden();
    }
}
