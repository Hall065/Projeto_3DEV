<?php

namespace App\Models\Grid;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'title',
    'description',
    'category',
    'sku',
    'image_url',
    'qty_available',
    'qty_reserved',
    'qty_min',
    'location',
    'supplier',
    'purchased_at',
    'cost',
    'status',
])]
class GridInventoryItem extends Model
{
    protected function casts(): array
    {
        return [
            'qty_available' => 'integer',
            'qty_reserved' => 'integer',
            'qty_min' => 'integer',
            'cost' => 'float',
            'purchased_at' => 'date',
        ];
    }

    public function refreshStockStatus(): void
    {
        if ($this->qty_reserved > 0) {
            return;
        }

        if ($this->qty_available <= $this->qty_min) {
            $this->status = 'baixo';
        } elseif (in_array($this->status, ['baixo', 'reservado'], true)) {
            $this->status = 'disponivel';
        }
    }

    public function scopeSearch($query, ?string $search)
    {
        if (! $search) {
            return $query;
        }

        $like = '%'.$search.'%';

        return $query->where(function ($q) use ($like) {
            $q->where('title', 'like', $like)
                ->orWhere('category', 'like', $like)
                ->orWhere('description', 'like', $like);
        });
    }
}
