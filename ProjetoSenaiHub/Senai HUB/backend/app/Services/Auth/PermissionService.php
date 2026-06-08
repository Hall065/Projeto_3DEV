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

        $custom = $user->custom_permissions;
        if (is_array($custom) && $custom !== []) {
            return array_values(array_unique($custom));
        }

        return config("permissions.role_permissions.{$role}", []);
    }

    /** @return list<string> */
    public function defaultPermissionsForRole(string $role): array
    {
        if (HubRole::isAdmin($role)) {
            return ['*'];
        }

        $permissions = config("permissions.role_permissions.{$role}", []);
        $module = HubRole::moduleFor($role);

        if ($module === 'connect' && ! in_array('connect.access', $permissions, true)) {
            $permissions[] = 'connect.access';
        }

        if ($module === 'grid' && ! in_array('grid.access', $permissions, true)) {
            $permissions[] = 'grid.access';
        }

        return $this->buildCustomPermissions($role, $permissions);
    }

    /**
     * @param  list<string>  $selected
     * @return list<string>
     */
    public function buildCustomPermissions(string $role, array $selected): array
    {
        $module = HubRole::moduleFor($role);
        $permissions = array_values(array_unique($selected));

        if ($module === 'connect' && ! in_array('connect.access', $permissions, true)) {
            array_unshift($permissions, 'connect.access');
        }

        if ($module === 'grid' && ! in_array('grid.access', $permissions, true)) {
            array_unshift($permissions, 'grid.access');
        }

        if ($module === 'connect') {
            if (in_array('connect.students.manage', $permissions, true) && ! in_array('connect.students.view', $permissions, true)) {
                $permissions[] = 'connect.students.view';
            }
            if (in_array('connect.teachers.manage', $permissions, true) && ! in_array('connect.teachers.view', $permissions, true)) {
                $permissions[] = 'connect.teachers.view';
            }
            if (in_array('connect.classes.manage', $permissions, true) && ! in_array('connect.classes.view', $permissions, true)) {
                $permissions[] = 'connect.classes.view';
            }
            if (in_array('connect.courses.manage', $permissions, true) && ! in_array('connect.courses.view', $permissions, true)) {
                $permissions[] = 'connect.courses.view';
            }
            if (in_array('connect.attendance.manage', $permissions, true) && ! in_array('connect.attendance.view', $permissions, true)) {
                $permissions[] = 'connect.attendance.view';
            }
            if (in_array('connect.contracts.manage', $permissions, true) && ! in_array('connect.contracts.view', $permissions, true)) {
                $permissions[] = 'connect.contracts.view';
            }
        }

        if ($module === 'grid') {
            if (in_array('grid.tickets.manage', $permissions, true) && ! in_array('grid.tickets.view', $permissions, true)) {
                $permissions[] = 'grid.tickets.view';
            }
            if (in_array('grid.inventory.manage', $permissions, true) && ! in_array('grid.inventory.view', $permissions, true)) {
                $permissions[] = 'grid.inventory.view';
            }
        }

        return array_values(array_unique($permissions));
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
