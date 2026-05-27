<?php

namespace App\Http\Resources\Grid;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Grid\GridTask */
class GridTaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'grid_ticket_id' => $this->grid_ticket_id,
            'code' => $this->code,
            'opened_by' => $this->opened_by,
            'title' => $this->title,
            'description' => $this->description ?? '',
            'room' => $this->room ?? '',
            'block' => $this->block ?? '',
            'opened_at' => $this->opened_at?->format('d/m/Y H:i') ?? '',
            'assignee' => $this->assignee,
            'items' => $this->items ?? [],
            'inventory_items' => $this->inventory_items ?? [],
            'ticket_code' => $this->whenLoaded('ticket', fn () => $this->ticket?->code),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'priority' => $this->priority,
            'column' => $this->column,
            'status_label' => $this->status_label ?? $this->columnLabel(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }

    private function columnLabel(): string
    {
        return match ($this->column) {
            'em_andamento' => 'Em andamento',
            'concluidas' => 'Concluída',
            default => 'A fazer',
        };
    }
}
