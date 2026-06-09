<?php

namespace App\Models\Grid;

use App\Models\User;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'grid_ticket_id',
    'uploaded_by_user_id',
    'original_name',
    'mime_type',
    'size_bytes',
    'disk_path',
])]
class GridTicketAttachment extends Model
{
    /** @return BelongsTo<GridTicket, $this> */
    public function ticket(): BelongsTo
    {
        return $this->belongsTo(GridTicket::class, 'grid_ticket_id');
    }

    /** @return BelongsTo<User, $this> */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_user_id');
    }
}
