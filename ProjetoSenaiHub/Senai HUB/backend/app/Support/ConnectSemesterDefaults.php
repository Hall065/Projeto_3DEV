<?php

namespace App\Support;

use App\Models\Connect\ConnectCourse;
use Illuminate\Support\Carbon;

class ConnectSemesterDefaults
{
    public static function currentLabel(?Carbon $at = null): string
    {
        $at ??= now();
        $year = $at->year;

        return $at->month <= 6 ? "{$year}.1" : "{$year}.2";
    }

    /**
     * @return array{start: string, end: string}
     */
    public static function periodForDate(?Carbon $at = null): array
    {
        $at ??= now();
        $year = $at->year;

        if ($at->month <= 6) {
            return ['start' => "{$year}-01-15", 'end' => "{$year}-06-30"];
        }

        return ['start' => "{$year}-07-01", 'end' => "{$year}-12-20"];
    }

    public static function ensureCoursePeriod(ConnectCourse $course, ?Carbon $at = null): ConnectCourse
    {
        $period = self::periodForDate($at);
        $updates = [];

        if (! $course->start_date) {
            $updates['start_date'] = $period['start'];
        }

        if (! $course->end_date) {
            $updates['end_date'] = $period['end'];
        }

        if ($updates !== []) {
            $course->update($updates);
            $course->refresh();
        }

        return $course;
    }
}
