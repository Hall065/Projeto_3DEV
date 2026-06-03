<?php

namespace App\Http\Resources\Grid;

use App\Services\Grid\InventoryImageResolver;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Grid\GridInventoryItem */
class GridInventoryItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $images = app(InventoryImageResolver::class);

        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description ?? '',
            'category' => $this->category ?? '',
            'sku' => $this->sku,
            'image_url' => $images->publicImageUrl($this->image_url),
            'purchased_at' => $this->purchased_at?->toDateString(),
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
