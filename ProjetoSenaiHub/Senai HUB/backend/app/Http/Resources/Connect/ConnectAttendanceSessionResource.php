<?php

namespace App\Http\Resources\Connect;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Connect\ConnectAttendanceSession */
class ConnectAttendanceSessionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $marks = $this->relationLoaded('marks') ? $this->marks : collect();
        $total = $marks->count();
        $present = $marks->whereIn('status', ['present', 'late'])->count();
        $justified = $marks->where('status', 'justified')->count();
        $absent = $marks->where('status', 'absent')->count();
        $presenceRate = $total > 0 ? round(($present / $total) * 100, 1) : 0;

        return [
            'id' => $this->id,
            'connect_class_id' => $this->connect_class_id,
            'connect_teacher_id' => $this->connect_teacher_id,
            'session_date' => $this->session_date?->format('Y-m-d'),
            'subject' => $this->subject,
            'status' => $this->status,
            'class' => new ConnectClassResource($this->whenLoaded('connectClass')),
            'teacher' => new ConnectTeacherResource($this->whenLoaded('teacher')),
            'marks' => ConnectAttendanceMarkResource::collection($this->whenLoaded('marks')),
            'marks_count' => $this->whenCounted('marks'),
            'stats' => $this->when($this->relationLoaded('marks'), fn () => [
                'total' => $total,
                'present' => $present,
                'justified' => $justified,
                'absent' => $absent,
                'presence_rate' => $presenceRate,
                'lessons_count' => 2,
            ]),
        ];
    }
}
