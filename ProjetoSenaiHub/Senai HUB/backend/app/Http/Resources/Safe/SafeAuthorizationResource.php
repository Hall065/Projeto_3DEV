<?php

namespace App\Http\Resources\Safe;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Safe\SafeAuthorization */
class SafeAuthorizationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'protocol' => $this->protocol,
            'safe_student_id' => $this->safe_student_id,
            'student_name' => $this->student_name,
            'class_name' => $this->class_name,
            'type' => $this->type?->value,
            'type_label' => $this->typeLabel(),
            'reason' => $this->reason,
            'absence_count' => $this->absence_count,
            'scheduled_at' => $this->scheduled_at?->toIso8601String(),
            'notes' => $this->notes ?? '',
            'status' => $this->status?->value,
            'status_label' => $this->statusLabel(),
            'requested_by' => $this->requested_by,
            'requester_name' => $this->whenLoaded('requester', fn () => $this->requester?->name),
            'approved_by_teacher' => $this->approved_by_teacher,
            'teacher_approver_name' => $this->whenLoaded('teacherApprover', fn () => $this->teacherApprover?->name),
            'approved_by_portaria' => $this->approved_by_portaria,
            'portaria_approver_name' => $this->whenLoaded('portariaApprover', fn () => $this->portariaApprover?->name),
            'teacher_approved_at' => $this->teacher_approved_at?->toIso8601String(),
            'portaria_confirmed_at' => $this->portaria_confirmed_at?->toIso8601String(),
            'finalized_at' => $this->finalized_at?->toIso8601String(),
            'student' => $this->whenLoaded('student', fn () => new SafeStudentResource($this->student)),
            'logs' => $this->whenLoaded('logs', fn () => SafeAuthorizationLogResource::collection($this->logs)),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
