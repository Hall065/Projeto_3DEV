<?php

namespace App\Models;

use App\Models\Connect\ConnectClass;
use App\Models\User;
use App\Models\Connect\ConnectCourse;
use App\Models\Connect\ConnectStudent;
use App\Models\Connect\ConnectTeacher;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'kind',
    'user_id',
    'full_name',
    'cpf',
    'registration_number',
    'email',
    'phone',
    'birth_date',
    'specialty',
    'metadata',
    'status',
])]
class HubPerson extends Model
{
    protected $table = 'hub_people';

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'metadata' => 'array',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasOne<ConnectStudent, $this> */
    public function connectStudent(): HasOne
    {
        return $this->hasOne(ConnectStudent::class, 'hub_person_id');
    }

    /** @return HasOne<ConnectTeacher, $this> */
    public function connectTeacher(): HasOne
    {
        return $this->hasOne(ConnectTeacher::class, 'hub_person_id');
    }

    /** @return BelongsToMany<ConnectCourse, $this> */
    public function courses(): BelongsToMany
    {
        return $this->belongsToMany(ConnectCourse::class, 'connect_course_hub_person', 'hub_person_id', 'connect_course_id')
            ->withPivot(['role', 'status', 'enrolled_at'])
            ->withTimestamps();
    }

    /** @return BelongsToMany<ConnectClass, $this> */
    public function connectClasses(): BelongsToMany
    {
        return $this->belongsToMany(ConnectClass::class, 'connect_class_hub_person', 'hub_person_id', 'connect_class_id')
            ->withPivot(['role', 'status', 'joined_at'])
            ->withTimestamps();
    }

    public function isStudent(): bool
    {
        return $this->kind === 'student';
    }

    public function isTeacher(): bool
    {
        return $this->kind === 'teacher';
    }
}
