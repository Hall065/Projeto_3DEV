<?php

namespace App\Http\Resources\Connect;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Connect\ConnectSalaryRecord */
class ConnectSalaryRecordResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'connect_student_id' => $this->connect_student_id,
            'reference_month' => $this->reference_month?->format('Y-m'),
            'base_amount' => (float) $this->base_amount,
            'deductions' => (float) $this->deductions,
            'bonuses' => (float) $this->bonuses,
            'net_amount' => (float) $this->net_amount,
            'status' => $this->status,
            'status_label' => match ($this->status) {
                'calculated' => 'Calculado',
                'pending' => 'Pendente',
                'paid' => 'Pago',
                default => ucfirst((string) $this->status),
            },
            'calculated_at' => $this->calculated_at?->toIso8601String(),
            'student' => new ConnectStudentResource($this->whenLoaded('student')),
        ];
    }
}
