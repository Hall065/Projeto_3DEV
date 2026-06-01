<?php

namespace App\Models\Connect;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'connect_attendance_session_id',
    'connect_student_id',
    'status',
    'missed_lessons',
    'notes',
])]
class ConnectAttendanceMark extends Model
{
    /** @return BelongsTo<ConnectAttendanceSession, $this> */
    public function session(): BelongsTo
    {
        return $this->belongsTo(ConnectAttendanceSession::class, 'connect_attendance_session_id');
    }

    /** @return BelongsTo<ConnectStudent, $this> */
    public function student(): BelongsTo
    {
        return $this->belongsTo(ConnectStudent::class, 'connect_student_id');
    }
}
