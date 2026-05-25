<?php

namespace App\Models\Connect;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'title',
    'message',
    'type',
    'category',
    'entity_type',
    'entity_id',
    'is_read',
])]
class ConnectAlert extends Model
{
    protected function casts(): array
    {
        return [
            'is_read' => 'boolean',
        ];
    }
}
