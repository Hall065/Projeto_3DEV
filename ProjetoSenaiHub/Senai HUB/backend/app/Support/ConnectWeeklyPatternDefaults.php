<?php

namespace App\Support;

class ConnectWeeklyPatternDefaults
{
    /**
     * @return list<array{day_of_week: int, start_time: string, end_time: string, lessons_count: int, subject: string}>
     */
    public static function forShift(string $shift, string $subject = 'Aula regular'): array
    {
        return match ($shift) {
            'manha' => [
                ['day_of_week' => 1, 'start_time' => '08:00', 'end_time' => '11:30', 'lessons_count' => 4, 'subject' => $subject],
                ['day_of_week' => 3, 'start_time' => '08:00', 'end_time' => '11:30', 'lessons_count' => 4, 'subject' => $subject],
            ],
            'tarde' => [
                ['day_of_week' => 2, 'start_time' => '14:00', 'end_time' => '17:30', 'lessons_count' => 4, 'subject' => $subject],
                ['day_of_week' => 4, 'start_time' => '14:00', 'end_time' => '17:30', 'lessons_count' => 4, 'subject' => $subject],
            ],
            default => [
                ['day_of_week' => 2, 'start_time' => '19:00', 'end_time' => '22:30', 'lessons_count' => 4, 'subject' => $subject],
                ['day_of_week' => 4, 'start_time' => '19:00', 'end_time' => '22:30', 'lessons_count' => 4, 'subject' => $subject],
            ],
        };
    }
}
