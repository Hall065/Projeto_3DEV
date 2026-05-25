<?php

namespace App\Http\Resources\Connect;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Connect\ConnectClass */
class ConnectClassResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'connect_course_id' => $this->connect_course_id,
            'connect_teacher_id' => $this->connect_teacher_id,
            'code' => $this->code,
            'name' => $this->name,
            'shift' => $this->shift,
            'start_date' => $this->start_date?->format('Y-m-d'),
            'end_date' => $this->end_date?->format('Y-m-d'),
            'capacity' => $this->capacity,
            'status' => $this->status,
            'course' => new ConnectCourseResource($this->whenLoaded('course')),
            'teacher' => new ConnectTeacherResource($this->whenLoaded('teacher')),
            'students_count' => $this->whenCounted('students'),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
