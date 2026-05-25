<?php

namespace App\Models\Connect;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'connect_course_id',
    'connect_teacher_id',
    'code',
    'name',
    'shift',
    'start_date',
    'end_date',
    'capacity',
    'status',
])]
class ConnectClass extends Model
{
    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    /** @return BelongsTo<ConnectCourse, $this> */
    public function course(): BelongsTo
    {
        return $this->belongsTo(ConnectCourse::class, 'connect_course_id');
    }

    /** @return BelongsTo<ConnectTeacher, $this> */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(ConnectTeacher::class, 'connect_teacher_id');
    }

    /** @return HasMany<ConnectStudent, $this> */
    public function students(): HasMany
    {
        return $this->hasMany(ConnectStudent::class, 'connect_class_id');
    }

    /** @return HasMany<ConnectAttendanceSession, $this> */
    public function attendanceSessions(): HasMany
    {
        return $this->hasMany(ConnectAttendanceSession::class, 'connect_class_id');
    }
}
