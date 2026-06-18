<?php

namespace App\Support;

use App\Models\User;

class NotificationI18n
{
    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public static function localize(User $user, array $payload): array
    {
        $type = (string) ($payload['type'] ?? '');
        if ($type === '') {
            return $payload;
        }

        $locale = self::localeFor($user);
        $params = is_array($payload['metadata']['i18n'] ?? null) ? $payload['metadata']['i18n'] : [];

        $titleKey = "notifications.{$type}.title";
        $messageKey = "notifications.{$type}.message";

        if (trans()->has($titleKey, $locale)) {
            $payload['title'] = trans($titleKey, $params, $locale);
        }

        if (trans()->has($messageKey, $locale)) {
            $payload['message'] = trans($messageKey, $params, $locale);
        }

        if (trans()->has("notifications.{$type}.email_message", $locale)) {
            $payload['email_message'] = trans("notifications.{$type}.email_message", $params, $locale);
        }

        if (trans()->has('notifications.action.open', $locale)) {
            $payload['action_label'] = trans('notifications.action.open', [], $locale);
        }

        return $payload;
    }

    public static function localeFor(User $user): string
    {
        $prefs = NotificationPreferences::forUser($user);
        $locale = (string) ($prefs['locale'] ?? 'pt');

        return match ($locale) {
            'en' => 'en',
            'es' => 'es',
            default => 'pt_BR',
        };
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  array<string, mixed>  $params
     * @return array<string, mixed>
     */
    public static function withParams(array $payload, array $params = []): array
    {
        if ($params === []) {
            return $payload;
        }

        $metadata = is_array($payload['metadata'] ?? null) ? $payload['metadata'] : [];
        $metadata['i18n'] = array_merge(is_array($metadata['i18n'] ?? null) ? $metadata['i18n'] : [], $params);
        $payload['metadata'] = $metadata;

        return $payload;
    }
}
