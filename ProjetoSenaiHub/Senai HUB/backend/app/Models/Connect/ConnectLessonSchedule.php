<?php

namespace App\Models\Connect;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'connect_class_id',
    'connect_teacher_id',
    'connect_class_weekly_pattern_id',
    'scheduled_date',
    'start_time',
    'end_time',
    'subject',
    'lessons_count',
    'status',
    'notes',
])]
class ConnectLessonSchedule extends Model
{
    protected function casts(): array
    {
        return [
            'scheduled_date' => 'date',
        ];
    }

    /** @return BelongsTo<ConnectClass, $this> */
    public function connectClass(): BelongsTo
    {
        return $this->belongsTo(ConnectClass::class, 'connect_class_id');
    }

    /** @return BelongsTo<ConnectTeacher, $this> */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(ConnectTeacher::class, 'connect_teacher_id');
    }

    /** @return BelongsTo<ConnectClassWeeklyPattern, $this> */
    public function weeklyPattern(): BelongsTo
    {
        return $this->belongsTo(ConnectClassWeeklyPattern::class, 'connect_class_weekly_pattern_id');
    }

    /** @return HasOne<ConnectAttendanceSession, $this> */
    public function attendanceSession(): HasOne
    {
        return $this->hasOne(ConnectAttendanceSession::class, 'connect_lesson_schedule_id');
    }
}
