<?php

namespace App\Support;

use App\Models\User;

class NotificationPreferences
{
    /** @return list<string> */
    public static function moduleKeys(): array
    {
        return ['hub', 'connect', 'grid', 'safe'];
    }

    /**
     * @return array{in_app: bool, email: bool, locale: string, modules: array<string, bool>}
     */
    public static function defaults(): array
    {
        return [
            'in_app' => true,
            'email' => true,
            'locale' => 'pt',
            'modules' => [
                'hub' => true,
                'connect' => true,
                'grid' => true,
                'safe' => true,
            ],
        ];
    }

    /**
     * @return array{in_app: bool, email: bool, locale: string, modules: array<string, bool>}
     */
    public static function forUser(User $user): array
    {
        $stored = $user->notification_preferences;
        if (! is_array($stored)) {
            return self::defaults();
        }

        $defaults = self::defaults();

        return [
            'in_app' => (bool) ($stored['in_app'] ?? $defaults['in_app']),
            'email' => (bool) ($stored['email'] ?? $defaults['email']),
            'locale' => (string) ($stored['locale'] ?? $defaults['locale']),
            'modules' => array_merge($defaults['modules'], is_array($stored['modules'] ?? null) ? $stored['modules'] : []),
        ];
    }

    public static function allowsInApp(User $user, string $module): bool
    {
        $prefs = self::forUser($user);

        if (! $prefs['in_app']) {
            return false;
        }

        return (bool) ($prefs['modules'][$module] ?? true);
    }

    public static function allowsEmail(User $user, string $module): bool
    {
        $prefs = self::forUser($user);

        if (! $prefs['email']) {
            return false;
        }

        return (bool) ($prefs['modules'][$module] ?? true);
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array{in_app: bool, email: bool, locale: string, modules: array<string, bool>}
     */
    public static function merge(array $input): array
    {
        $current = self::defaults();

        if (array_key_exists('in_app', $input)) {
            $current['in_app'] = (bool) $input['in_app'];
        }

        if (array_key_exists('email', $input)) {
            $current['email'] = (bool) $input['email'];
        }

        if (array_key_exists('locale', $input)) {
            $locale = (string) $input['locale'];
            $current['locale'] = in_array($locale, ['pt', 'en', 'es'], true) ? $locale : 'pt';
        }

        if (isset($input['modules']) && is_array($input['modules'])) {
            foreach (self::moduleKeys() as $module) {
                if (array_key_exists($module, $input['modules'])) {
                    $current['modules'][$module] = (bool) $input['modules'][$module];
                }
            }
        }

        return $current;
    }
}
