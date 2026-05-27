<?php

namespace App\Http\Resources\Grid;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Grid\GridInventoryItem */
class GridInventoryItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description ?? '',
            'category' => $this->category ?? '',
            'image_url' => $this->image_url,
            'qty_available' => $this->qty_available,
            'qty_reserved' => $this->qty_reserved ?? 0,
            'qty_min' => $this->qty_min,
            'location' => $this->location ?? '',
            'supplier' => $this->supplier ?? '',
            'cost' => (float) $this->cost,
            'status' => $this->status,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
