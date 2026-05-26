<?php

namespace App\Support;

use Illuminate\Http\Request;

class ConnectForm
{
    /** Converte "", 0 ou ausente em null para FKs opcionais. */
    public static function nullableForeignId(Request $request, string $key): ?int
    {
        if (! $request->has($key)) {
            return null;
        }

        $raw = $request->input($key);
        if ($raw === '' || $raw === null) {
            return null;
        }

        $id = (int) $raw;

        return $id > 0 ? $id : null;
    }

    /** @param  list<string>  $keys */
    public static function mergeNullableForeignIds(Request $request, array $keys): void
    {
        $merged = [];
        foreach ($keys as $key) {
            if ($request->has($key)) {
                $merged[$key] = self::nullableForeignId($request, $key);
            }
        }
        if ($merged !== []) {
            $request->merge($merged);
        }
    }
}
