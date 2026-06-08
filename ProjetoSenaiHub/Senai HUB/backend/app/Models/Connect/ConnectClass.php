<?php

namespace App\Models\Connect;

use App\Models\HubPerson;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'connect_course_id',
    'connect_teacher_id',
    'code',
    'name',
    'shift',
    'semester',
    'start_date',
    'end_date',
    'capacity',
    'default_lessons_per_day',
    'max_absences_allowed',
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

    /** @return HasMany<ConnectClassWeeklyPattern, $this> */
    public function weeklyPatterns(): HasMany
    {
        return $this->hasMany(ConnectClassWeeklyPattern::class, 'connect_class_id');
    }

    /** @return HasMany<ConnectLessonSchedule, $this> */
    public function lessonSchedules(): HasMany
    {
        return $this->hasMany(ConnectLessonSchedule::class, 'connect_class_id');
    }

    /** Matrículas na turma (via cadastro global hub_people). */
    /** @return BelongsToMany<HubPerson, $this> */
    public function enrolledPeople(): BelongsToMany
    {
        return $this->belongsToMany(HubPerson::class, 'connect_class_hub_person', 'connect_class_id', 'hub_person_id')
            ->withPivot(['role', 'status', 'joined_at'])
            ->withTimestamps();
    }
}
