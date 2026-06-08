<?php

namespace App\Http\Resources\Connect;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Connect\ConnectContract */
class ConnectContractResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'connect_student_id' => $this->connect_student_id,
            'contract_type' => $this->contract_type,
            'weekly_hours' => $this->weekly_hours,
            'start_date' => $this->start_date?->format('Y-m-d'),
            'end_date' => $this->end_date?->format('Y-m-d'),
            'monthly_value' => (float) $this->monthly_value,
            'company_name' => $this->company_name,
            'company_email' => $this->company_email,
            'status' => $this->status,
            'student' => new ConnectStudentResource($this->whenLoaded('student')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
