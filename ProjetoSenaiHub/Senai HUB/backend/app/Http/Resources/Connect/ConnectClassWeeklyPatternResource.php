<?php

namespace App\Http\Resources\Connect;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Connect\ConnectClassWeeklyPattern */
class ConnectClassWeeklyPatternResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'connect_class_id' => $this->connect_class_id,
            'day_of_week' => $this->day_of_week,
            'start_time' => substr((string) $this->start_time, 0, 5),
            'end_time' => substr((string) $this->end_time, 0, 5),
            'lessons_count' => $this->lessons_count,
            'subject' => $this->subject,
        ];
    }
}
