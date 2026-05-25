<?php

namespace App\Support;

class RoleLabels
{
    /** @var array<string, string> */
    private const LABELS = [
        'admin' => 'Administrador',
        'student' => 'Aluno',
        'teacher' => 'Professor',
        'staff' => 'Secretaria',
    ];

    public static function for(?string $role): string
    {
        if ($role === null) {
            return 'Usuario';
        }

        return self::LABELS[$role] ?? ucfirst($role);
    }
}
