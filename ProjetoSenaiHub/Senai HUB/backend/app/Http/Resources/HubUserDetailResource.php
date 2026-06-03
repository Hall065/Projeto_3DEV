<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class HubUserDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $roleMeta = config('permissions.roles.'.$this->role, []);

        $this->loadMissing('applications');

        return [
            ...(new UserResource($this))->toArray($request),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'email_verified_at' => $this->email_verified_at?->toIso8601String(),
            'role_description' => $roleMeta['description'] ?? null,
            'role_module' => $roleMeta['module'] ?? null,
            'applications_detail' => $this->applications
                ->sortBy('sort_order')
                ->values()
                ->map(fn ($app) => [
                    'slug' => $app->slug,
                    'name' => $app->name,
                    'description' => $app->description,
                ])
                ->all(),
        ];
    }
}
