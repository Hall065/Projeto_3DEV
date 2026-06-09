<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GridAccessScopeTest extends TestCase
{
    use RefreshDatabase;

    public function test_grid_professor_sees_only_own_tickets(): void
    {
        $this->seed();

        $professor = User::query()->where('email', 'marcos.professor@grid.senai.local')->firstOrFail();
        Sanctum::actingAs($professor);

        $response = $this->getJson('/api/grid/tickets?per_page=100');

        $response->assertOk();

        $codes = collect($response->json('data'))->pluck('code')->all();

        $this->assertContains('#CH-2026-ROLE-P1', $codes);
        $this->assertNotContains('#CH-2026-ROLE-S1', $codes);
        $this->assertNotContains('#CH-2026-ROLE-T1', $codes);
    }

    public function test_grid_technician_sees_assigned_tickets_only(): void
    {
        $this->seed();

        $technician = User::query()->where('email', 'pedro.tecnico@grid.senai.local')->firstOrFail();
        Sanctum::actingAs($technician);

        $response = $this->getJson('/api/grid/tickets?per_page=100');

        $response->assertOk();

        $codes = collect($response->json('data'))->pluck('code')->all();

        $this->assertContains('#CH-2026-ROLE-T1', $codes);
        $this->assertContains('#CH-2026-ROLE-P1', $codes);
        $this->assertNotContains('#CH-2026-ROLE-S1', $codes);
    }
}
