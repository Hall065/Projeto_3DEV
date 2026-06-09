<?php

namespace Tests\Feature;

use App\Models\AccessRequest;
use App\Models\User;
use App\Mail\HubNotificationMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AccessRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_can_submit_access_request(): void
    {
        $response = $this->postJson('/api/access-requests', [
            'name' => 'Novo Colaborador',
            'email' => 'novo.colaborador@example.com',
            'organization' => 'Secretaria',
            'message' => 'Preciso acessar o Connect.',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.id', fn ($id) => is_int($id));

        $this->assertDatabaseHas('access_requests', [
            'email' => 'novo.colaborador@example.com',
            'status' => 'pending',
        ]);
    }

    public function test_access_request_notifies_admin_users(): void
    {
        $this->seed();

        $this->postJson('/api/access-requests', [
            'name' => 'Teste Notificacao',
            'email' => 'teste.notif@example.com',
        ])->assertCreated();

        $admin = User::query()->where('email', 'admin@senaihub.local')->firstOrFail();

        $this->assertDatabaseHas('hub_notifications', [
            'user_id' => $admin->id,
            'type' => 'hub.access_request',
        ]);
    }

    public function test_access_request_sends_email_to_admin_when_enabled(): void
    {
        Mail::fake();
        $this->seed();

        $this->postJson('/api/access-requests', [
            'name' => 'Teste Email',
            'email' => 'teste.email@example.com',
        ])->assertCreated();

        Mail::assertSent(HubNotificationMail::class);
    }
}
