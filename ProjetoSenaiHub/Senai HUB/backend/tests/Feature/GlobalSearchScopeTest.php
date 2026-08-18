<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GlobalSearchScopeTest extends TestCase
{
    use RefreshDatabase;

    public function test_grid_professor_search_does_not_return_other_users_tickets(): void
    {
        $this->seed();

        $professor = User::query()->where('email', 'marcos.professor@grid.senai.local')->firstOrFail();
        Sanctum::actingAs($professor);

        $response = $this->getJson('/api/search?q=CH-2026-ROLE');

        $response->assertOk();

        $titles = collect($response->json('data.groups'))
            ->flatMap(fn (array $group) => $group['items'] ?? [])
            ->pluck('title')
            ->implode(' ');

        $this->assertStringContainsString('#CH-2026-ROLE-P1', $titles);
        $this->assertStringNotContainsString('#CH-2026-ROLE-S1', $titles);
        $this->assertStringNotContainsString('#CH-2026-ROLE-T1', $titles);
    }

    public function test_connect_user_search_does_not_include_grid_groups(): void
    {
        $this->seed();

        $professor = User::query()->where('email', 'carlos.professor@senai.local')->firstOrFail();
        Sanctum::actingAs($professor);

        $response = $this->getJson('/api/search?q=CH-2026');

        $response->assertOk();

        $modules = collect($response->json('data.groups'))->pluck('module')->all();

        $this->assertNotContains('grid', $modules);
    }
}
