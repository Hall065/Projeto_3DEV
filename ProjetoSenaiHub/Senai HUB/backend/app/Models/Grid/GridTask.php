<?php

namespace App\Models\Grid;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'grid_ticket_id',
    'code',
    'opened_by',
    'opened_by_user_id',
    'title',
    'description',
    'room',
    'block',
    'opened_at',
    'assignee',
    'assignee_user_id',
    'items',
    'inventory_items',
    'priority',
    'column',
    'status_label',
    'completed_at',
])]
class GridTask extends Model
{
    protected function casts(): array
    {
        return [
            'opened_at' => 'datetime',
            'completed_at' => 'datetime',
            'items' => 'array',
            'inventory_items' => 'array',
        ];
    }

    /** @return BelongsTo<GridTicket, $this> */
    public function ticket(): BelongsTo
    {
        return $this->belongsTo(GridTicket::class, 'grid_ticket_id');
    }

    /** @return HasMany<GridInventoryReservation, $this> */
    public function reservations(): HasMany
    {
        return $this->hasMany(GridInventoryReservation::class, 'grid_task_id');
    }
}
