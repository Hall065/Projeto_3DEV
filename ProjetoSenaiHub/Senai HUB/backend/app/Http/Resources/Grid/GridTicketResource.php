<?php

namespace App\Http\Resources\Grid;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Grid\GridTicket */
class GridTicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'requester' => $this->requester,
            'title' => $this->title,
            'summary' => $this->summary ?? '',
            'room' => $this->room ?? '',
            'block' => $this->block ?? '',
            'priority' => $this->priority,
            'opened_at' => $this->opened_at?->toIso8601String(),
            'started_at' => $this->started_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'status' => $this->status,
            'assignee' => $this->assignee ?? '',
            'resolution_summary' => $this->resolution_summary ?? '',
            'fixed_description' => $this->fixed_description ?? '',
            'considerations' => $this->considerations ?? '',
            'evaluation_rating' => $this->evaluation_rating,
            'evaluation_notes' => $this->evaluation_notes ?? '',
            'evaluated_by' => $this->evaluated_by ?? '',
            'evaluated_at' => $this->evaluated_at?->toIso8601String(),
            'approved_by' => $this->approved_by ?? '',
            'approved_at' => $this->approved_at?->toIso8601String(),
            'approval_notes' => $this->approval_notes ?? '',
            'workflow_locked' => $this->status === \App\Services\Grid\GridWorkflowService::LOCKED_TICKET_STATUS,
            'primary_task_id' => $this->whenLoaded('tasks', fn () => $this->tasks->sortBy('id')->first()?->id),
            'tasks_count' => $this->whenCounted('tasks'),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
