<?php

namespace App\Http\Resources\Connect;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Connect\ConnectLessonSchedule */
class ConnectLessonScheduleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'connect_class_id' => $this->connect_class_id,
            'connect_teacher_id' => $this->connect_teacher_id,
            'connect_class_weekly_pattern_id' => $this->connect_class_weekly_pattern_id,
            'scheduled_date' => $this->scheduled_date?->format('Y-m-d'),
            'start_time' => substr((string) $this->start_time, 0, 5),
            'end_time' => substr((string) $this->end_time, 0, 5),
            'subject' => $this->subject,
            'lessons_count' => $this->lessons_count,
            'status' => $this->status,
            'notes' => $this->notes,
            'class' => new ConnectClassResource($this->whenLoaded('connectClass')),
            'teacher' => new ConnectTeacherResource($this->whenLoaded('teacher')),
            'attendance_session_id' => $this->whenLoaded('attendanceSession', fn () => $this->attendanceSession?->id),
            'has_attendance' => $this->whenLoaded('attendanceSession', fn () => $this->attendanceSession !== null),
        ];
    }
}
