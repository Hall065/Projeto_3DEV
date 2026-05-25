<?php

namespace App\Models\Connect;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['key', 'value'])]
class ConnectDashboardMetric extends Model
{
    protected function casts(): array
    {
        return [
            'value' => 'array',
        ];
    }
}
