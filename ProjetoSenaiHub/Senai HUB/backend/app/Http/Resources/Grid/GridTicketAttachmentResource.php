<?php

namespace App\Http\Resources\Grid;

use App\Services\Grid\GridTicketAttachmentService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Grid\GridTicketAttachment */
class GridTicketAttachmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $service = app(GridTicketAttachmentService::class);

        return [
            'id' => $this->id,
            'grid_ticket_id' => $this->grid_ticket_id,
            'original_name' => $this->original_name,
            'mime_type' => $this->mime_type,
            'size_bytes' => $this->size_bytes,
            'url' => $service->publicUrl($this->resource),
            'is_image' => str_starts_with($this->mime_type, 'image/'),
            'uploaded_by_user_id' => $this->uploaded_by_user_id,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
