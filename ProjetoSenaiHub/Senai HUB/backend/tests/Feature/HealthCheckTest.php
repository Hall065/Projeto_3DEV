<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_endpoint_reports_database_status(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertOk()
            ->assertJsonPath('status', 'ok')
            ->assertJsonStructure([
                'status',
                'version',
                'environment',
                'timestamp',
                'checks' => [
                    'database' => ['status', 'connection'],
                    'queue' => ['status', 'driver'],
                ],
            ]);
    }
}
