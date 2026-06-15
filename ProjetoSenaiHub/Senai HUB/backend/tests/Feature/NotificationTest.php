<?php

namespace Tests\Feature;

use App\Models\HubNotification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_list_and_filter_notifications(): void
    {
        $this->seed();

        $user = User::query()->where('email', 'admin@senaihub.local')->firstOrFail();

        HubNotification::query()->create([
            'user_id' => $user->id,
            'module' => 'hub',
            'type' => 'hub.test',
            'title' => 'Teste Hub',
            'message' => 'Mensagem hub',
            'severity' => 'info',
        ]);

        HubNotification::query()->create([
            'user_id' => $user->id,
            'module' => 'safe',
            'type' => 'safe.test',
            'title' => 'Teste SAFE',
            'message' => 'Mensagem safe',
            'severity' => 'warning',
            'is_read' => true,
            'read_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonStructure(['unread_count']);

        $this->getJson('/api/notifications?unread_only=1')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);

        $this->getJson('/api/notifications?module=safe')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.module', 'safe');
    }

    public function test_user_can_mark_notification_read_and_remove(): void
    {
        $this->seed();

        $user = User::query()->where('email', 'admin@senaihub.local')->firstOrFail();

        $notification = HubNotification::query()->create([
            'user_id' => $user->id,
            'module' => 'grid',
            'type' => 'grid.test',
            'title' => 'Chamado atribuido',
            'message' => 'Voce recebeu um chamado.',
            'severity' => 'info',
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/notifications/unread-count')
            ->assertOk()
            ->assertJsonPath('data.unread_count', 1);

        $this->patchJson("/api/notifications/{$notification->id}/read")
            ->assertOk()
            ->assertJsonPath('data.is_read', true)
            ->assertJsonPath('unread_count', 0);

        $this->deleteJson("/api/notifications/{$notification->id}")
            ->assertOk()
            ->assertJsonPath('unread_count', 0);

        $this->assertDatabaseMissing('hub_notifications', ['id' => $notification->id]);
    }

    public function test_user_can_update_notification_preferences_including_safe(): void
    {
        $this->seed();

        $user = User::query()->where('email', 'admin@senaihub.local')->firstOrFail();
        Sanctum::actingAs($user);

        $this->getJson('/api/auth/notification-preferences')
            ->assertOk()
            ->assertJsonPath('data.modules.safe', true);

        $this->putJson('/api/auth/notification-preferences', [
            'email' => false,
            'modules' => [
                'hub' => true,
                'connect' => false,
                'grid' => true,
                'safe' => false,
            ],
        ])
            ->assertOk()
            ->assertJsonPath('data.email', false)
            ->assertJsonPath('data.modules.connect', false)
            ->assertJsonPath('data.modules.safe', false);

        $user->refresh();
        $this->assertFalse($user->notification_preferences['modules']['safe']);
    }
}
