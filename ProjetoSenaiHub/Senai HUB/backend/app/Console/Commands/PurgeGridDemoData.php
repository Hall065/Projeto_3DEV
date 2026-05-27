<?php

namespace App\Console\Commands;

use App\Models\Grid\GridInventoryItem;
use App\Models\Grid\GridInventoryReservation;
use App\Models\Grid\GridTask;
use App\Models\Grid\GridTicket;
use App\Services\Grid\GridWorkflowService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PurgeGridDemoData extends Command
{
    protected $signature = 'grid:purge-demo-data
                            {--dry-run : Apenas lista o que seria removido}
                            {--all-tickets : Remove todos os chamados e tarefas}
                            {--force : Não pedir confirmação}';

    protected $description = 'Remove chamados e tarefas de demonstração do seeder, mantendo registros criados pelo fluxo atual.';

    private const DEMO_TASK_CODES = [
        '#TSK-2026-0101',
        '#TSK-2026-0102',
        '#TSK-2026-0103',
        '#TSK-2026-0098',
    ];

    public function handle(GridWorkflowService $workflow): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $allTickets = (bool) $this->option('all-tickets');
        $force = (bool) $this->option('force');

        $tickets = $allTickets
            ? GridTicket::query()->orderBy('id')->get()
            : GridTicket::query()->orderBy('id')->get()->filter(fn (GridTicket $t) => $this->isDemoTicket($t));

        $ticketIds = $tickets->pluck('id')->all();

        $tasks = $allTickets
            ? GridTask::query()->orderBy('id')->get()
            : GridTask::query()->orderBy('id')->get()->filter(
                fn (GridTask $t) => $this->isDemoTask($t, $ticketIds),
            );

        $this->info(sprintf(
            'Encontrados: %d chamado(s) e %d tarefa(s) para remover.',
            $tickets->count(),
            $tasks->count(),
        ));

        if ($tickets->isEmpty() && $tasks->isEmpty()) {
            $this->comment('Nada a remover.');

            return self::SUCCESS;
        }

        foreach ($tickets as $ticket) {
            $this->line("  Chamado {$ticket->code} — {$ticket->status} — {$ticket->title}");
        }
        foreach ($tasks as $task) {
            $this->line("  Tarefa {$task->code} — {$task->column} — {$task->title}");
        }

        if ($dryRun) {
            $this->comment('Dry-run: nenhum registro foi apagado.');

            return self::SUCCESS;
        }

        if (! $force && ! $this->confirm('Remover os registros acima?', true)) {
            $this->warn('Operação cancelada.');

            return self::FAILURE;
        }

        DB::transaction(function () use ($workflow, $tasks, $tickets) {
            foreach ($tasks as $task) {
                $workflow->releaseReservations($task);
                GridInventoryReservation::query()->where('grid_task_id', $task->id)->delete();
                $task->delete();
            }

            foreach ($tickets as $ticket) {
                GridTask::query()->where('grid_ticket_id', $ticket->id)->each(function (GridTask $task) use ($workflow) {
                    $workflow->releaseReservations($task);
                    GridInventoryReservation::query()->where('grid_task_id', $task->id)->delete();
                    $task->delete();
                });
                $ticket->delete();
            }

            GridInventoryItem::query()->each(function (GridInventoryItem $item) {
                $item->qty_reserved = 0;
                $item->refreshStockStatus();
                if ($item->status === 'reservado') {
                    $item->status = 'disponivel';
                }
                $item->save();
            });
        });

        $remaining = GridTicket::query()->count();
        $this->info("Limpeza concluída. Chamados restantes no sistema: {$remaining}.");

        return self::SUCCESS;
    }

    private function isDemoTicket(GridTicket $ticket): bool
    {
        $summary = $ticket->summary ?? '';

        if (str_contains($summary, 'via seed') || str_contains($summary, 'demonstração de relatórios')) {
            return true;
        }

        if ($ticket->status === 'em_andamento') {
            return true;
        }

        if (preg_match('/#CH-\d{4}-(\d+)$/', $ticket->code, $matches)) {
            return (int) $matches[1] >= 1200;
        }

        return false;
    }

    /**
     * @param  list<int>  $demoTicketIds
     */
    private function isDemoTask(GridTask $task, array $demoTicketIds): bool
    {
        if (in_array($task->code, self::DEMO_TASK_CODES, true)) {
            return true;
        }

        if (str_starts_with($task->code, '#TSK-')) {
            return true;
        }

        if ($task->grid_ticket_id && in_array($task->grid_ticket_id, $demoTicketIds, true)) {
            return true;
        }

        if (preg_match('/#CH-\d{4}-(\d+)$/', $task->code, $matches)) {
            return (int) $matches[1] >= 1200;
        }

        return false;
    }
}
