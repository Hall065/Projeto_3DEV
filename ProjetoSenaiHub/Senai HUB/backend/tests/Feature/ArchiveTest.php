<?php

namespace Tests\Feature;

use App\Models\Connect\ConnectClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class ArchiveTest extends TestCase
{
    use RefreshDatabase;

    public function test_auto_archive_marks_expired_active_classes_as_finished(): void
    {
        $this->seed();

        $class = ConnectClass::query()->where('status', 'active')->firstOrFail();
        $class->update(['end_date' => Carbon::yesterday()]);

        $this->artisan('connect:archive-expired-classes')->assertSuccessful();

        $this->assertSame('finished', $class->fresh()->status);
    }

    public function test_archive_summary_returns_modules_for_admin(): void
    {
        $this->seed();

        $admin = User::query()->where('email', 'admin@senaihub.local')->firstOrFail();

        $this->actingAs($admin)
            ->getJson('/api/archive/summary')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'modules' => ['connect', 'grid', 'safe'],
                    'auto_archive' => ['pending_classes', 'can_run'],
                ],
            ])
            ->assertJsonPath('data.auto_archive.can_run', true);
    }

    public function test_admin_can_run_auto_archive_via_api(): void
    {
        $this->seed();

        $admin = User::query()->where('email', 'admin@senaihub.local')->firstOrFail();
        $class = ConnectClass::query()->where('status', 'active')->firstOrFail();
        $class->update(['end_date' => Carbon::yesterday()]);

        $response = $this->actingAs($admin)->postJson('/api/archive/run-auto-archive');

        $response->assertOk();
        $this->assertGreaterThanOrEqual(1, (int) $response->json('data.archived'));

        $this->assertSame('finished', $class->fresh()->status);
    }

    public function test_archive_connect_classes_lists_finished_only(): void
    {
        $this->seed();

        $admin = User::query()->where('email', 'admin@senaihub.local')->firstOrFail();
        $class = ConnectClass::query()->firstOrFail();
        $class->update(['status' => 'finished']);

        $this->actingAs($admin)
            ->getJson('/api/archive/connect/classes')
            ->assertOk()
            ->assertJsonFragment(['id' => $class->id, 'status' => 'finished']);
    }
}
