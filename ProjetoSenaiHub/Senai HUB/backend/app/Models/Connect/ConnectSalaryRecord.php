<?php

namespace App\Models\Connect;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'connect_student_id',
    'reference_month',
    'base_amount',
    'deductions',
    'bonuses',
    'net_amount',
    'status',
    'calculated_at',
])]
class ConnectSalaryRecord extends Model
{
    protected function casts(): array
    {
        return [
            'reference_month' => 'date',
            'base_amount' => 'decimal:2',
            'deductions' => 'decimal:2',
            'bonuses' => 'decimal:2',
            'net_amount' => 'decimal:2',
            'calculated_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<ConnectStudent, $this> */
    public function student(): BelongsTo
    {
        return $this->belongsTo(ConnectStudent::class, 'connect_student_id');
    }
}
