<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CampusMapTest extends TestCase
{
    use RefreshDatabase;

    public function test_campus_people_endpoint_returns_scoped_data(): void
    {
        $this->seed();

        $secretaria = User::query()->where('email', 'fernanda.secretaria@senai.local')->firstOrFail();
        Sanctum::actingAs($secretaria);

        $response = $this->getJson('/api/connect/campus-people');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'role', 'block_id', 'room', 'detail', 'position'],
                ],
                'meta' => ['simulation', 'source'],
            ]);

        $this->assertNotEmpty($response->json('data'));
    }

    public function test_campus_people_without_demo_when_simulation_disabled(): void
    {
        $this->seed();
        config(['hub.campus_map_simulation' => false]);

        $secretaria = User::query()->where('email', 'fernanda.secretaria@senai.local')->firstOrFail();
        Sanctum::actingAs($secretaria);

        $response = $this->getJson('/api/connect/campus-people');

        $response->assertOk()
            ->assertJsonPath('meta.simulation', false);

        $roles = collect($response->json('data'))->pluck('role')->all();
        $this->assertNotContains('funcionario', $roles);
    }
}
