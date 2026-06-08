<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\HubNotification */
class HubNotificationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'module' => $this->module,
            'type' => $this->type,
            'title' => $this->title,
            'message' => $this->message,
            'action_url' => $this->action_url,
            'entity_type' => $this->entity_type,
            'entity_id' => $this->entity_id,
            'severity' => $this->severity,
            'is_read' => $this->is_read,
            'read_at' => $this->read_at?->toIso8601String(),
            'actor_name' => $this->whenLoaded('actor', fn () => $this->actor?->name),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
