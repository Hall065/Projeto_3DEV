<?php

namespace App\Support;

use App\Models\Grid\GridTask;
use App\Models\Grid\GridTicket;

class GridCode
{
    public static function nextTicketCode(): string
    {
        $year = now()->year;
        $next = GridTicket::query()->max('id') + 1;

        return sprintf('#CH-%d-%04d', $year, $next);
    }

    public static function nextTaskCode(): string
    {
        $year = now()->year;
        $next = GridTask::query()->max('id') + 1;

        return sprintf('#CH-%d-%04d', $year, $next);
    }
}
