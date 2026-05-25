<?php

namespace App\Http\Resources\Connect;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Connect\ConnectStudentLocation */
class ConnectStudentLocationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'connect_student_id' => $this->connect_student_id,
            'latitude' => $this->latitude !== null ? (float) $this->latitude : null,
            'longitude' => $this->longitude !== null ? (float) $this->longitude : null,
            'address' => $this->address,
            'city' => $this->city,
            'state' => $this->state,
            'last_seen_at' => $this->last_seen_at?->toIso8601String(),
            'status' => $this->status,
            'student' => new ConnectStudentResource($this->whenLoaded('student')),
        ];
    }
}
