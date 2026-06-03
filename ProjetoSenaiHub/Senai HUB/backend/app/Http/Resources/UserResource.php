<?php

namespace App\Http\Resources;

use App\Services\Auth\PermissionService;
use App\Support\HubRole;
use App\Support\RoleLabels;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\User */
class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $permissions = app(PermissionService::class);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'role_label' => RoleLabels::for($this->role),
            'company_name' => $this->company_name,
            'is_admin' => HubRole::isAdmin($this->role),
            'permissions' => $permissions->permissionsFor($this->resource),
            'application_slugs' => $permissions->applicationSlugsFor($this->resource),
            'avatar_url' => $this->avatar_url,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
