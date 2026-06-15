<?php

namespace App\Models\Safe;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'connect_student_id',
    'registration',
    'name',
    'class_name',
    'active',
])]
class SafeStudent extends Model
{
    protected $table = 'safe_students';

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
        ];
    }

    /** @return \Illuminate\Database\Eloquent\Relations\BelongsTo<\App\Models\Connect\ConnectStudent, $this> */
    public function connectStudent()
    {
        return $this->belongsTo(\App\Models\Connect\ConnectStudent::class, 'connect_student_id');
    }

    /** @return HasMany<SafeAuthorization, $this> */
    public function authorizations(): HasMany
    {
        return $this->hasMany(SafeAuthorization::class);
    }
}
