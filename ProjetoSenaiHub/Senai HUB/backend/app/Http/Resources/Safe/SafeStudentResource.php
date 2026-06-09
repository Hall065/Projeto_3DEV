<?php

namespace App\Http\Resources\Safe;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Safe\SafeStudent */
class SafeStudentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'registration' => $this->registration,
            'name' => $this->name,
            'class_name' => $this->class_name,
            'active' => $this->active,
            'authorizations_count' => $this->whenCounted('authorizations'),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
