<?php

namespace App\Models\Connect;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'connect_class_id',
    'day_of_week',
    'start_time',
    'end_time',
    'lessons_count',
    'subject',
])]
class ConnectClassWeeklyPattern extends Model
{
    /** @return BelongsTo<ConnectClass, $this> */
    public function connectClass(): BelongsTo
    {
        return $this->belongsTo(ConnectClass::class, 'connect_class_id');
    }

    /** @return HasMany<ConnectLessonSchedule, $this> */
    public function lessonSchedules(): HasMany
    {
        return $this->hasMany(ConnectLessonSchedule::class, 'connect_class_weekly_pattern_id');
    }
}
