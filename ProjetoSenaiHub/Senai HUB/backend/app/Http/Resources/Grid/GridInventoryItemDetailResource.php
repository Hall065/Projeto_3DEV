<?php

namespace App\Http\Resources\Grid;

use App\Models\Grid\GridInventoryItem;
use App\Models\Grid\GridInventoryReservation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin GridInventoryItem */
class GridInventoryItemDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $qtyReserved = (int) ($this->qty_reserved ?? 0);
        $qtyAvailable = (int) $this->qty_available;

        $inUse = (int) GridInventoryReservation::query()
            ->where('grid_inventory_item_id', $this->id)
            ->where('status', 'reserved')
            ->whereHas('task', fn ($q) => $q->where('column', 'em_andamento'))
            ->sum('quantity');

        $consumed = (int) GridInventoryReservation::query()
            ->where('grid_inventory_item_id', $this->id)
            ->where('status', 'consumed')
            ->sum('quantity');

        $reservations = GridInventoryReservation::query()
            ->with(['task:id,code,title,column,status_label', 'ticket:id,code,title'])
            ->where('grid_inventory_item_id', $this->id)
            ->whereIn('status', ['reserved', 'consumed'])
            ->orderByDesc('created_at')
            ->limit(25)
            ->get()
            ->map(fn (GridInventoryReservation $r) => [
                'id' => $r->id,
                'quantity' => $r->quantity,
                'status' => $r->status,
                'task_code' => $r->task?->code,
                'task_title' => $r->task?->title,
                'task_column' => $r->task?->column,
                'ticket_code' => $r->ticket?->code,
                'created_at' => $r->created_at?->toIso8601String(),
            ])
            ->values()
            ->all();

        return [
            ...(new GridInventoryItemResource($this))->toArray($request),
            'sku' => $this->sku,
            'purchased_at' => $this->purchased_at?->toDateString(),
            'qty_in_use' => $inUse,
            'qty_committed' => $qtyReserved,
            'qty_consumed' => $consumed,
            'qty_total' => $qtyAvailable + $qtyReserved + $consumed,
            'stock_value' => round((float) $this->cost * $qtyAvailable, 2),
            'reservations' => $reservations,
        ];
    }
}
