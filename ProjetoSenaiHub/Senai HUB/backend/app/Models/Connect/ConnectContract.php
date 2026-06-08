<?php

namespace App\Models\Connect;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'connect_student_id',
    'contract_type',
    'weekly_hours',
    'start_date',
    'end_date',
    'monthly_value',
    'company_name',
    'company_email',
    'status',
])]
class ConnectContract extends Model
{
    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'monthly_value' => 'decimal:2',
        ];
    }

    /** @return BelongsTo<ConnectStudent, $this> */
    public function student(): BelongsTo
    {
        return $this->belongsTo(ConnectStudent::class, 'connect_student_id');
    }
}
