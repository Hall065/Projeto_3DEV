<?php

namespace App\Support;

class HubRole
{
    public const ADMIN = 'admin';

    public const CONNECT_PROFESSOR = 'connect_professor';

    public const CONNECT_SECRETARIA = 'connect_secretaria';

    public const CONNECT_AQV = 'connect_aqv';

    public const CONNECT_EMPRESA = 'connect_empresa';

    public const CONNECT_ALUNO = 'connect_aluno';

    public const GRID_CHEFE = 'grid_chefe';

    public const GRID_FUNCIONARIO = 'grid_funcionario';

    /** @return list<string> */
    public static function all(): array
    {
        return array_keys(config('permissions.roles', []));
    }

    /** @return list<string> */
    public static function assignable(): array
    {
        return array_values(array_filter(self::all(), fn (string $role) => $role !== self::ADMIN));
    }

    public static function isAdmin(?string $role): bool
    {
        return $role === self::ADMIN;
    }

    public static function moduleFor(?string $role): ?string
    {
        if ($role === null) {
            return null;
        }

        return config("permissions.roles.{$role}.module");
    }
}
