<?php

namespace App\Models\Grid;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'code',
    'requester',
    'requester_user_id',
    'title',
    'summary',
    'room',
    'block',
    'priority',
    'status',
    'assignee',
    'assignee_user_id',
    'opened_at',
    'started_at',
    'completed_at',
    'resolution_summary',
    'fixed_description',
    'considerations',
    'evaluation_rating',
    'evaluation_notes',
    'evaluated_by',
    'evaluated_at',
    'approved_by',
    'approved_at',
    'approval_notes',
])]
class GridTicket extends Model
{
    protected function casts(): array
    {
        return [
            'opened_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'evaluated_at' => 'datetime',
            'approved_at' => 'datetime',
            'evaluation_rating' => 'integer',
        ];
    }

    /** @return HasMany<GridTask, $this> */
    public function tasks(): HasMany
    {
        return $this->hasMany(GridTask::class);
    }

    /** @return HasMany<GridTicketAttachment, $this> */
    public function attachments(): HasMany
    {
        return $this->hasMany(GridTicketAttachment::class);
    }

    public function scopeSearch($query, ?string $search)
    {
        if (! $search) {
            return $query;
        }

        $like = '%'.$search.'%';

        return $query->where(function ($q) use ($like) {
            $q->where('title', 'like', $like)
                ->orWhere('code', 'like', $like)
                ->orWhere('requester', 'like', $like)
                ->orWhere('summary', 'like', $like);
        });
    }
}
