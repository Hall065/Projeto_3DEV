<?php

namespace App\Models\Connect;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'connect_student_id',
    'latitude',
    'longitude',
    'address',
    'city',
    'state',
    'last_seen_at',
    'status',
])]
class ConnectStudentLocation extends Model
{
    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'last_seen_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<ConnectStudent, $this> */
    public function student(): BelongsTo
    {
        return $this->belongsTo(ConnectStudent::class, 'connect_student_id');
    }
}
