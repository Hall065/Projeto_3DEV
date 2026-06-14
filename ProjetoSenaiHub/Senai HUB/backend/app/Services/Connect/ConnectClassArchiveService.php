<?php

namespace App\Services\Connect;

use App\Models\Connect\ConnectActivity;
use App\Models\Connect\ConnectClass;
use App\Models\User;
use Illuminate\Support\Carbon;

class ConnectClassArchiveService
{
    /**
     * Marca turmas ativas com end_date no passado como encerradas (arquivo).
     */
    public function archiveExpiredClasses(?User $actor = null): int
    {
        $today = Carbon::today();
        $archived = 0;

        ConnectClass::query()
            ->where('status', 'active')
            ->whereNotNull('end_date')
            ->whereDate('end_date', '<', $today)
            ->orderBy('id')
            ->each(function (ConnectClass $class) use ($actor, &$archived): void {
                $class->update(['status' => 'finished']);

                ConnectActivity::query()->create([
                    'title' => 'Turma encerrada automaticamente',
                    'description' => "Turma {$class->name} arquivada após término em {$class->end_date?->format('d/m/Y')}.",
                    'type' => 'archive',
                    'entity_type' => 'class',
                    'entity_id' => $class->id,
                    'performed_by' => $actor?->name ?? 'Sistema',
                    'occurred_at' => now(),
                ]);

                $archived++;
            });

        return $archived;
    }

    public function countPendingAutoArchive(): int
    {
        return ConnectClass::query()
            ->where('status', 'active')
            ->whereNotNull('end_date')
            ->whereDate('end_date', '<', Carbon::today())
            ->count();
    }
}
