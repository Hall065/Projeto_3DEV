<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\HubNotificationResource;
use App\Models\HubNotification;
use App\Services\Notification\NotificationService;
use App\Support\NotificationPreferences;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class NotificationController extends Controller
{
    public function __construct(
        private readonly NotificationService $notifications,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = HubNotification::query()
            ->where('user_id', $request->user()->id)
            ->with('actor:id,name')
            ->orderByDesc('created_at');

        if ($request->boolean('unread_only')) {
            $query->where('is_read', false);
        }

        if ($module = $request->string('module')->trim()->toString()) {
            $query->where('module', $module);
        }

        $notifications = $query->paginate($request->integer('per_page', 20));

        return HubNotificationResource::collection($notifications)->additional([
            'unread_count' => $this->notifications->unreadCount($request->user()),
        ])->response();
    }

    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json([
            'data' => [
                'unread_count' => $this->notifications->unreadCount($request->user()),
            ],
        ]);
    }

    public function markRead(Request $request, HubNotification $notification): JsonResponse
    {
        $this->notifications->markRead($notification, $request->user());

        return response()->json([
            'data' => new HubNotificationResource($notification->fresh('actor')),
            'unread_count' => $this->notifications->unreadCount($request->user()),
        ]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $updated = $this->notifications->markAllRead($request->user());

        return response()->json([
            'message' => 'Todas as notificacoes foram marcadas como lidas.',
            'updated' => $updated,
            'unread_count' => 0,
        ]);
    }

    public function destroy(Request $request, HubNotification $notification): JsonResponse
    {
        abort_unless($notification->user_id === $request->user()->id, 403);
        $notification->delete();

        return response()->json([
            'message' => 'Notificacao removida.',
            'unread_count' => $this->notifications->unreadCount($request->user()),
        ]);
    }

    public function preferences(Request $request): JsonResponse
    {
        return response()->json([
            'data' => NotificationPreferences::forUser($request->user()),
        ]);
    }

    public function updatePreferences(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'in_app' => ['sometimes', 'boolean'],
            'email' => ['sometimes', 'boolean'],
            'locale' => ['sometimes', 'string', Rule::in(['pt', 'en', 'es'])],
            'modules' => ['sometimes', 'array'],
            'modules.hub' => ['sometimes', 'boolean'],
            'modules.connect' => ['sometimes', 'boolean'],
            'modules.grid' => ['sometimes', 'boolean'],
            'modules.safe' => ['sometimes', 'boolean'],
        ]);

        $user = $request->user();
        $user->update([
            'notification_preferences' => NotificationPreferences::merge(
                array_merge(NotificationPreferences::forUser($user), $validated),
            ),
        ]);

        return response()->json([
            'data' => NotificationPreferences::forUser($user->fresh()),
            'message' => 'Preferencias de notificacao atualizadas.',
        ]);
    }
}
