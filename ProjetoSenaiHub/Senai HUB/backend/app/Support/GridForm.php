<?php

namespace App\Support;

use Illuminate\Http\Request;

class GridForm
{
    public static function nullableForeignId(Request $request, string $key): ?int
    {
        if (! $request->has($key)) {
            return null;
        }

        $value = $request->input($key);

        if ($value === '' || $value === null || $value === 0 || $value === '0') {
            return null;
        }

        return (int) $value;
    }

    /**
     * @param  list<string>  $keys
     */
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
