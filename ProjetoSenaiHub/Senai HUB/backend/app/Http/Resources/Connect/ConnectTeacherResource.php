<?php

namespace App\Http\Resources\Connect;

use App\Http\Resources\HubPersonResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Connect\ConnectTeacher */
class ConnectTeacherResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'hub_person_id' => $this->hub_person_id,
            'hub_person' => new HubPersonResource($this->whenLoaded('hubPerson')),
            'user_id' => $this->user_id,
            'full_name' => $this->full_name,
            'cpf' => $this->cpf,
            'email' => $this->email,
            'phone' => $this->phone,
            'specialty' => $this->specialty,
            'status' => $this->status,
            'classes_count' => $this->whenCounted('classes'),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
