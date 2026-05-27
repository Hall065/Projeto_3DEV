<?php

namespace App\Models\Grid;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GridInventoryReservation extends Model
{
    protected $fillable = [
        'grid_task_id',
        'grid_ticket_id',
        'grid_inventory_item_id',
        'quantity',
        'status',
    ];

    /** @return BelongsTo<GridTask, $this> */
    public function task(): BelongsTo
    {
        return $this->belongsTo(GridTask::class, 'grid_task_id');
    }

    /** @return BelongsTo<GridTicket, $this> */
    public function ticket(): BelongsTo
    {
        return $this->belongsTo(GridTicket::class, 'grid_ticket_id');
    }

    /** @return BelongsTo<GridInventoryItem, $this> */
    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(GridInventoryItem::class, 'grid_inventory_item_id');
    }
}
