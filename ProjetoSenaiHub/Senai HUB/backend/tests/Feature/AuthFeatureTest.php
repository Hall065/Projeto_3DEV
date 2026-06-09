<?php

namespace Tests\Feature;

use App\Mail\HubResetPasswordMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_returns_token_and_user(): void
    {
        $this->seed();

        $response = $this->postJson('/api/auth/login', [
            'email' => 'admin@senaihub.local',
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['data' => ['token', 'user' => ['id', 'email', 'permissions']]]);
    }

    public function test_register_route_is_not_available(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Test',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertNotFound();
    }

    public function test_authenticated_user_can_fetch_permissions_catalog(): void
    {
        $this->seed();

        $user = User::query()->where('email', 'admin@senaihub.local')->firstOrFail();
        Sanctum::actingAs($user);

        $this->getJson('/api/auth/permissions-catalog')
            ->assertOk()
            ->assertJsonStructure([
                'data' => ['roles', 'role_permissions', 'nav_permissions', 'application_slugs_by_role'],
            ]);
    }

    public function test_forgot_password_sends_reset_mail(): void
    {
        Mail::fake();
        $this->seed();

        $this->postJson('/api/auth/forgot-password', [
            'email' => 'admin@senaihub.local',
        ])->assertOk();

        Mail::assertSent(HubResetPasswordMail::class);
    }

    public function test_logout_revokes_current_token(): void
    {
        $this->seed();

        $user = User::query()->where('email', 'admin@senaihub.local')->firstOrFail();
        $issued = $user->createToken('senai-hub-api');
        $tokenId = $issued->accessToken->id;

        $this->withHeader('Authorization', 'Bearer '.$issued->plainTextToken)
            ->postJson('/api/auth/logout')
            ->assertOk();

        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $tokenId]);
    }
}
