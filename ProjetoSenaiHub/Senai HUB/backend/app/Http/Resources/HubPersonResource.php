<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\HubPerson */
class HubPersonResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'kind' => $this->kind,
            'user_id' => $this->user_id,
            'full_name' => $this->full_name,
            'cpf' => $this->cpf,
            'registration_number' => $this->registration_number,
            'email' => $this->email,
            'phone' => $this->phone,
            'birth_date' => $this->birth_date?->format('Y-m-d'),
            'specialty' => $this->specialty,
            'status' => $this->status,
            'pivot' => $this->when($this->pivot !== null, fn () => [
                'role' => $this->pivot->role,
                'status' => $this->pivot->status,
                'enrolled_at' => $this->pivot->enrolled_at ?? null,
                'joined_at' => $this->pivot->joined_at ?? null,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
