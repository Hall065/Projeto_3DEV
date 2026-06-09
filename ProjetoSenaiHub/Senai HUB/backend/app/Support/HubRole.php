<?php

namespace App\Support;

class HubRole
{
    public const ADMIN = 'admin';

    public const CONNECT_PROFESSOR = 'connect_professor';

    public const CONNECT_SECRETARIA = 'connect_secretaria';

    public const CONNECT_DIRETOR = 'connect_diretor';

    public const CONNECT_AQV = 'connect_aqv';

    public const CONNECT_EMPRESA = 'connect_empresa';

    public const CONNECT_ALUNO = 'connect_aluno';

    public const GRID_CHEFE = 'grid_chefe';

    public const GRID_FUNCIONARIO = 'grid_funcionario';

    public const GRID_PROFESSOR = 'grid_professor';

    public const GRID_SECRETARIA = 'grid_secretaria';

    public const SAFE_AQV = 'safe_aqv';

    public const SAFE_PROFESSOR = 'safe_professor';

    public const SAFE_PORTARIA = 'safe_portaria';

    public const UNASSIGNED = 'unassigned';

    /** @return list<string> */
    public static function all(): array
    {
        return array_keys(config('permissions.roles', []));
    }

    /** @return list<string> */
    public static function assignable(): array
    {
        return array_values(array_filter(
            self::all(),
            fn (string $role) => $role !== self::ADMIN
                && $role !== self::UNASSIGNED
                && (config("permissions.roles.{$role}.assignable") ?? true),
        ));
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
