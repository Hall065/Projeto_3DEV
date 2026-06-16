<?php

namespace App\Http\Resources\Connect;

use App\Services\Connect\ConnectContractAttachmentService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Connect\ConnectContractAttachment */
class ConnectContractAttachmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $service = app(ConnectContractAttachmentService::class);

        return [
            'id' => $this->id,
            'connect_contract_id' => $this->connect_contract_id,
            'original_name' => $this->original_name,
            'mime_type' => $this->mime_type,
            'size_bytes' => $this->size_bytes,
            'url' => $service->publicUrl($this->resource),
            'is_image' => str_starts_with($this->mime_type, 'image/'),
            'is_generated' => (bool) $this->is_generated,
            'uploaded_by_user_id' => $this->uploaded_by_user_id,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
