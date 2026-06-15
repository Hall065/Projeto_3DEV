<?php

namespace App\Support;

use App\Models\Grid\GridUser;
use App\Models\User;

final class GridParticipantSync
{
    /**
     * @param  array<string, mixed>  $data
     */
    public static function syncTicket(array &$data): void
    {
        if (isset($data['requester'])) {
            $data['requester_user_id'] = self::resolveUserId($data['requester']);
        }

        if (array_key_exists('assignee', $data)) {
            $data['assignee_user_id'] = filled($data['assignee'])
                ? self::resolveUserId($data['assignee'])
                : null;
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public static function syncTask(array &$data): void
    {
        if (isset($data['opened_by'])) {
            $data['opened_by_user_id'] = self::resolveUserId($data['opened_by']);
        }

        if (array_key_exists('assignee', $data)) {
            $data['assignee_user_id'] = filled($data['assignee'])
                ? self::resolveUserId($data['assignee'])
                : null;
        }
    }

    private static function resolveUserId(string $label): ?int
    {
        $userId = User::query()->where('name', $label)->value('id');
        if ($userId) {
            return (int) $userId;
        }

        $gridUserId = GridUser::query()->where('name', $label)->value('user_id');

        return $gridUserId ? (int) $gridUserId : null;
    }
}
