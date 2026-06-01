<?php

namespace App\Models\Connect;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'connect_class_id',
    'connect_teacher_id',
    'session_date',
    'subject',
    'lessons_count',
    'status',
])]
class ConnectAttendanceSession extends Model
{
    protected function casts(): array
    {
        return [
            'session_date' => 'date',
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

    /** @return HasMany<ConnectAttendanceMark, $this> */
    public function marks(): HasMany
    {
        return $this->hasMany(ConnectAttendanceMark::class, 'connect_attendance_session_id');
    }
}
