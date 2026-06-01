<?php

namespace App\Support;

class RoleLabels
{
    public static function for(?string $role): string
    {
        if ($role === null) {
            return 'Usuario';
        }

        return config("permissions.roles.{$role}.label")
            ?? match ($role) {
                'student' => 'Aluno',
                'teacher' => 'Professor',
                'staff' => 'Secretaria',
                default => ucfirst(str_replace('_', ' ', $role)),
            };
    }
}
