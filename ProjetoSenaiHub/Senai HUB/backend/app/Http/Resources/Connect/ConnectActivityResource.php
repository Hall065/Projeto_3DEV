<?php

namespace App\Http\Resources\Connect;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Connect\ConnectActivity */
class ConnectActivityResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'type' => $this->type,
            'entity_type' => $this->entity_type,
            'entity_id' => $this->entity_id,
            'performed_by' => $this->performed_by,
            'occurred_at' => $this->occurred_at?->toIso8601String(),
        ];
    }
}
