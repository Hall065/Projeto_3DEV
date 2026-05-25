<?php

namespace App\Http\Resources\Connect;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Connect\ConnectStudent */
class ConnectStudentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'connect_class_id' => $this->connect_class_id,
            'full_name' => $this->full_name,
            'cpf' => $this->cpf,
            'registration_number' => $this->registration_number,
            'email' => $this->email,
            'phone' => $this->phone,
            'birth_date' => $this->birth_date?->format('Y-m-d'),
            'status' => $this->status,
            'class' => new ConnectClassResource($this->whenLoaded('connectClass')),
            'location' => new ConnectStudentLocationResource($this->whenLoaded('location')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
