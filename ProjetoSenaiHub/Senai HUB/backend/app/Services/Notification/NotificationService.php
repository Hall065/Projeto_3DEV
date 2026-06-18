<?php

namespace App\Services\Notification;

use App\Models\HubNotification;
use App\Models\User;
use App\Services\Auth\PermissionService;
use App\Support\HubRole;
use App\Support\NotificationI18n;
use App\Support\NotificationPreferences;
use Illuminate\Support\Collection;

class NotificationService
{
    public function __construct(
        private readonly PermissionService $permissions,
        private readonly HubMailDispatcher $mail,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public function notify(int|User $user, array $payload): ?HubNotification
    {
        $user = $user instanceof User ? $user : User::query()->find($user);
        if (! $user) {
            return null;
        }

        $module = (string) ($payload['module'] ?? 'hub');
        $inApp = NotificationPreferences::allowsInApp($user, $module);
        $email = NotificationPreferences::allowsEmail($user, $module);

        if (! $inApp && ! $email) {
            return null;
        }

        if ($email) {
            $this->mail->sendForUser($user, NotificationI18n::localize($user, $payload));
        }

        if (! $inApp) {
            return null;
        }

        return HubNotification::query()->create([
            'user_id' => $user->id,
            'module' => $module,
            'type' => (string) ($payload['type'] ?? 'system.generic'),
            'title' => (string) ($payload['title'] ?? 'Notificacao'),
            'message' => (string) ($payload['message'] ?? ''),
            'action_url' => $payload['action_url'] ?? null,
            'entity_type' => $payload['entity_type'] ?? null,
            'entity_id' => $payload['entity_id'] ?? null,
            'actor_user_id' => $payload['actor_user_id'] ?? null,
            'severity' => (string) ($payload['severity'] ?? 'info'),
            'metadata' => $payload['metadata'] ?? null,
        ]);
    }

    /**
     * @param  iterable<int|User>  $users
     * @param  array<string, mixed>  $payload
     */
    public function notifyMany(iterable $users, array $payload): void
    {
        $ids = [];
        foreach ($users as $user) {
            $ids[] = $user instanceof User ? $user->id : (int) $user;
        }

        foreach (array_unique(array_filter($ids)) as $userId) {
            $except = $payload['except_user_id'] ?? null;
            if ($except && (int) $except === (int) $userId) {
                continue;
            }
            $this->notify((int) $userId, $payload);
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function notifyRole(string $role, array $payload): void
    {
        $userIds = User::query()->where('role', $role)->pluck('id');
        $this->notifyMany($userIds, $payload);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function notifyPermission(string $permission, array $payload): void
    {
        $users = User::query()->get()->filter(
            fn (User $user) => $this->permissions->can($user, $permission),
        );

        $this->notifyMany($users->pluck('id'), $payload);
    }

    /**
     * @return list<int>
     */
    public function userIdsByName(?string $name): array
    {
        if (! filled($name)) {
            return [];
        }

        $trimmed = trim($name);

        return User::query()
            ->where('name', $trimmed)
            ->orWhere('name', 'like', $trimmed.'%')
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    public function unreadCount(User $user): int
    {
        return HubNotification::query()
            ->where('user_id', $user->id)
            ->where('is_read', false)
            ->count();
    }

    public function markRead(HubNotification $notification, User $user): void
    {
        abort_unless($notification->user_id === $user->id, 403);
        $notification->markRead();
    }

    public function markAllRead(User $user): int
    {
        return HubNotification::query()
            ->where('user_id', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
    }

    /** @return Collection<int, User> */
    public function admins(): Collection
    {
        return User::query()->where('role', HubRole::ADMIN)->get();
    }
}
