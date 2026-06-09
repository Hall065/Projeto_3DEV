<?php

namespace App\Models\Safe;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
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

    /** @return HasMany<SafeAuthorization, $this> */
    public function authorizations(): HasMany
    {
        return $this->hasMany(SafeAuthorization::class);
    }
}
