<?php

namespace App\Support;

use App\Models\User;

final class GridParticipantSync
{
    /**
     * @param  array<string, mixed>  $data
     */
    public static function syncTicket(array &$data): void
    {
        if (isset($data['requester'])) {
            $data['requester_user_id'] = User::query()->where('name', $data['requester'])->value('id');
        }

        if (array_key_exists('assignee', $data)) {
            $data['assignee_user_id'] = filled($data['assignee'])
                ? User::query()->where('name', $data['assignee'])->value('id')
                : null;
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public static function syncTask(array &$data): void
    {
        if (isset($data['opened_by'])) {
            $data['opened_by_user_id'] = User::query()->where('name', $data['opened_by'])->value('id');
        }

        if (array_key_exists('assignee', $data)) {
            $data['assignee_user_id'] = filled($data['assignee'])
                ? User::query()->where('name', $data['assignee'])->value('id')
                : null;
        }
    }
}
