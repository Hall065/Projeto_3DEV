<?php

namespace App\Http\Resources\Grid;

use App\Models\Grid\GridTask;
use App\Models\Grid\GridTicket;
use App\Models\Grid\GridUser;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin GridUser */
class GridUserDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $name = $this->name;

        $tasksTotal = (int) GridTask::query()->where('assignee', $name)->count();
        $tasksInProgress = (int) GridTask::query()
            ->where('assignee', $name)
            ->where('column', 'em_andamento')
            ->count();
        $tasksCompleted = (int) GridTask::query()
            ->where('assignee', $name)
            ->where('column', 'concluidas')
            ->count();
        $ticketsAssigned = (int) GridTicket::query()->where('assignee', $name)->count();

        $recentTasks = GridTask::query()
            ->where('assignee', $name)
            ->orderByDesc('updated_at')
            ->limit(8)
            ->get(['id', 'code', 'title', 'column', 'status_label', 'updated_at'])
            ->map(fn (GridTask $t) => [
                'type' => 'task',
                'id' => $t->id,
                'code' => $t->code,
                'title' => $t->title,
                'status' => $t->status_label,
                'column' => $t->column,
                'updated_at' => $t->updated_at?->toIso8601String(),
            ]);

        $recentTickets = GridTicket::query()
            ->where('assignee', $name)
            ->orderByDesc('updated_at')
            ->limit(8)
            ->get(['id', 'code', 'title', 'status', 'updated_at'])
            ->map(fn (GridTicket $t) => [
                'type' => 'ticket',
                'id' => $t->id,
                'code' => $t->code,
                'title' => $t->title,
                'status' => $t->status,
                'updated_at' => $t->updated_at?->toIso8601String(),
            ]);

        $activity = $recentTasks
            ->concat($recentTickets)
            ->sortByDesc('updated_at')
            ->take(12)
            ->values()
            ->all();

        return [
            ...(new GridUserResource($this))->toArray($request),
            'stats' => [
                'tasks_total' => $tasksTotal,
                'tasks_in_progress' => $tasksInProgress,
                'tasks_completed' => $tasksCompleted,
                'tickets_assigned' => $ticketsAssigned,
            ],
            'activity' => $activity,
        ];
    }
}
