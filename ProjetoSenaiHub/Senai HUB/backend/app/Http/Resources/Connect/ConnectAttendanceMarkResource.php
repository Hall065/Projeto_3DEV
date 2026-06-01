<?php

namespace App\Http\Resources\Connect;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Connect\ConnectAttendanceMark */
class ConnectAttendanceMarkResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'connect_attendance_session_id' => $this->connect_attendance_session_id,
            'connect_student_id' => $this->connect_student_id,
            'status' => $this->status,
            'missed_lessons' => $this->missed_lessons ?? 0,
            'notes' => $this->notes,
            'student' => new ConnectStudentResource($this->whenLoaded('student')),
        ];
    }
}
