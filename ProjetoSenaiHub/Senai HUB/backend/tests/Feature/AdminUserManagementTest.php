<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_user_detail_without_type_error(): void
    {
        $this->seed();

        $admin = User::query()->where('email', 'admin@senaihub.local')->first();
        $target = User::query()->where('email', 'pedro.tecnico@grid.senai.local')->first();

        $this->assertNotNull($admin);
        $this->assertNotNull($target);

        $this->actingAs($admin)
            ->getJson("/api/admin/users/{$target->id}")
            ->assertOk()
            ->assertJsonPath('data.email', $target->email)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'email',
                    'permissions',
                    'application_slugs',
                    'default_permissions',
                    'applications_detail',
                    'role_module',
                ],
            ]);
    }

    public function test_admin_nav_permissions_includes_safe_module(): void
    {
        $this->seed();

        $admin = User::query()->where('email', 'admin@senaihub.local')->first();
        $this->assertNotNull($admin);

        $this->actingAs($admin)
            ->getJson('/api/admin/nav-permissions')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'connect',
                    'grid',
                    'safe',
                ],
            ]);
    }
}
