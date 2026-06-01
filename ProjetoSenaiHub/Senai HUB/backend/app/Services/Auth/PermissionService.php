<?php

namespace App\Services\Auth;

use App\Models\User;
use App\Support\HubRole;

class PermissionService
{
    /** @return list<string> */
    public function permissionsFor(User $user): array
    {
        $role = $user->role;

        if (HubRole::isAdmin($role)) {
            return ['*'];
        }

        return config("permissions.role_permissions.{$role}", []);
    }

    public function can(User $user, string $permission): bool
    {
        $permissions = $this->permissionsFor($user);

        if (in_array('*', $permissions, true)) {
            return true;
        }

        if (in_array($permission, $permissions, true)) {
            return true;
        }

        $segments = explode('.', $permission);
        while (count($segments) > 1) {
            array_pop($segments);
            $wildcard = implode('.', $segments).'.*';
            if (in_array($wildcard, $permissions, true)) {
                return true;
            }
        }

        return false;
    }

    /** @return list<string> */
    public function applicationSlugsFor(User $user): array
    {
        if (HubRole::isAdmin($user->role)) {
            return ['connect', 'grid'];
        }

        return config("permissions.application_slugs_by_role.{$user->role}", []);
    }

    public function canAccessConnect(User $user): bool
    {
        return $this->can($user, 'connect.access');
    }

    public function canAccessGrid(User $user): bool
    {
        return $this->can($user, 'grid.access');
    }
}
