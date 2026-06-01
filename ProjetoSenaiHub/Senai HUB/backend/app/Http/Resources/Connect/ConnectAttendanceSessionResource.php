<?php

namespace App\Http\Resources\Connect;

use App\Support\ConnectAttendanceStats;
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
        $lessonsCount = $this->lessons_count ?? $this->connectClass?->default_lessons_per_day ?? 4;
        $missedLessonsTotal = (int) $marks->sum('missed_lessons');

        return [
            'id' => $this->id,
            'connect_class_id' => $this->connect_class_id,
            'connect_teacher_id' => $this->connect_teacher_id,
            'session_date' => $this->session_date?->format('Y-m-d'),
            'subject' => $this->subject,
            'lessons_count' => $lessonsCount,
            'status' => $this->status,
            'class' => new ConnectClassResource($this->whenLoaded('connectClass')),
            'teacher' => new ConnectTeacherResource($this->whenLoaded('teacher')),
            'marks' => $this->when($this->relationLoaded('marks'), function () {
                $class = $this->connectClass;

                return $this->marks->map(function ($mark) use ($class) {
                    $base = (new ConnectAttendanceMarkResource($mark))->resolve(request());

                    if ($class && $mark->relationLoaded('student') && $mark->student) {
                        $base['absence_summary'] = ConnectAttendanceStats::studentSummary($mark->student, $class);
                    }

                    return $base;
                })->values();
            }),
            'marks_count' => $this->whenCounted('marks'),
            'attendance_settings' => $this->when($this->relationLoaded('connectClass'), fn () => [
                'default_lessons_per_day' => $this->connectClass?->default_lessons_per_day ?? 4,
                'max_absences_allowed' => $this->connectClass?->max_absences_allowed,
            ]),
            'stats' => $this->when($this->relationLoaded('marks'), fn () => [
                'total' => $total,
                'present' => $present,
                'justified' => $justified,
                'absent' => $absent,
                'presence_rate' => $presenceRate,
                'lessons_count' => $lessonsCount,
                'missed_lessons_total' => $missedLessonsTotal,
            ]),
        ];
    }
}
