<?php

namespace Database\Seeders;

use App\Models\Grid\GridInventoryItem;
use App\Models\Grid\GridInventoryReservation;
use App\Models\Grid\GridTask;
use App\Models\Grid\GridTicket;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * 2 chamados por etapa do fluxo + tarefas e materiais de estoque vinculados.
 */
class GridSampleTicketsSeeder extends Seeder
{
    public function run(): void
    {
        $inventoryBySku = GridInventoryItem::query()
            ->whereIn('sku', [
                'INF-MOU-001', 'ELE-LMP-018', 'CLI-FIL-HVAC', 'INF-HDM-2M', 'HID-SEL-280',
                'ELE-DIS-20A', 'CLI-VEN-120', 'HID-TIN-18L', 'HID-PAR-6MM', 'ELE-TOM-10A',
            ])
            ->get()
            ->keyBy('sku');

        $requesters = ['Ana Costa', 'Carlos Mendes', 'Paula Ribeiro', 'João Lima', 'Fernanda Dias'];
        $technicians = ['Pedro Tecnico', 'Julia Tecnica'];

        $samples = [
            [
                'code' => '#CH-2026-S01',
                'status' => 'aberto',
                'title' => 'Projetor sem imagem na sala 101',
                'priority' => 'alta',
                'assignee' => null,
                'months_ago' => 0,
                'day' => 2,
                'task_column' => 'a_fazer',
                'materials' => [['sku' => 'INF-HDM-2M', 'qty' => 1]],
            ],
            [
                'code' => '#CH-2026-S02',
                'status' => 'aberto',
                'title' => 'Janela não fecha no laboratório',
                'priority' => 'baixa',
                'assignee' => null,
                'months_ago' => 0,
                'day' => 5,
                'task_column' => 'a_fazer',
                'materials' => [['sku' => 'INF-MOU-001', 'qty' => 1]],
            ],
            [
                'code' => '#CH-2026-S03',
                'status' => 'pendente',
                'title' => 'Tomada sem energia — corredor B',
                'priority' => 'media',
                'assignee' => $technicians[0],
                'months_ago' => 0,
                'day' => 8,
                'task_column' => 'a_fazer',
                'materials' => [['sku' => 'ELE-TOM-10A', 'qty' => 2]],
            ],
            [
                'code' => '#CH-2026-S04',
                'status' => 'pendente',
                'title' => 'Lâmpada queimada auditório',
                'priority' => 'alta',
                'assignee' => $technicians[1],
                'months_ago' => 1,
                'day' => 12,
                'task_column' => 'a_fazer',
                'materials' => [['sku' => 'ELE-LMP-018', 'qty' => 4]],
            ],
            [
                'code' => '#CH-2026-S05',
                'status' => 'em_atendimento',
                'title' => 'Ar-condicionado com ruído',
                'priority' => 'media',
                'assignee' => $technicians[1],
                'months_ago' => 1,
                'day' => 18,
                'task_column' => 'em_andamento',
                'materials' => [['sku' => 'CLI-FIL-HVAC', 'qty' => 2]],
                'reservation_status' => 'reserved',
            ],
            [
                'code' => '#CH-2026-S06',
                'status' => 'em_atendimento',
                'title' => 'Vazamento no banheiro masculino',
                'priority' => 'alta',
                'assignee' => $technicians[0],
                'months_ago' => 0,
                'day' => 14,
                'task_column' => 'em_andamento',
                'materials' => [['sku' => 'HID-SEL-280', 'qty' => 3]],
                'reservation_status' => 'reserved',
            ],
            [
                'code' => '#CH-2026-S07',
                'status' => 'aguardando_aprovacao',
                'title' => 'Troca de fechadura digital',
                'priority' => 'media',
                'assignee' => $technicians[1],
                'months_ago' => 2,
                'day' => 6,
                'task_column' => 'concluidas',
                'materials' => [['sku' => 'HID-PAR-6MM', 'qty' => 1]],
                'reservation_status' => 'consumed',
            ],
            [
                'code' => '#CH-2026-S08',
                'status' => 'aguardando_aprovacao',
                'title' => 'Reparo em portão automático',
                'priority' => 'baixa',
                'assignee' => $technicians[0],
                'months_ago' => 1,
                'day' => 22,
                'task_column' => 'concluidas',
                'materials' => [['sku' => 'ELE-DIS-20A', 'qty' => 1]],
                'reservation_status' => 'consumed',
            ],
            [
                'code' => '#CH-2026-S09',
                'status' => 'avaliacao_pendente',
                'title' => 'Instalação de ventilador de teto',
                'priority' => 'media',
                'assignee' => $technicians[0],
                'months_ago' => 3,
                'day' => 10,
                'approved' => true,
                'task_column' => 'concluidas',
                'materials' => [['sku' => 'CLI-VEN-120', 'qty' => 1]],
                'reservation_status' => 'consumed',
            ],
            [
                'code' => '#CH-2026-S10',
                'status' => 'avaliacao_pendente',
                'title' => 'Pintura de parede danificada',
                'priority' => 'baixa',
                'assignee' => $technicians[1],
                'months_ago' => 2,
                'day' => 15,
                'approved' => true,
                'task_column' => 'concluidas',
                'materials' => [['sku' => 'HID-TIN-18L', 'qty' => 1]],
                'reservation_status' => 'consumed',
            ],
            [
                'code' => '#CH-2026-S11',
                'status' => 'concluido',
                'title' => 'Conserto de bebedouro',
                'priority' => 'media',
                'assignee' => $technicians[1],
                'months_ago' => 4,
                'day' => 8,
                'approved' => true,
                'evaluated' => true,
                'task_column' => 'concluidas',
                'materials' => [['sku' => 'HID-SEL-280', 'qty' => 1]],
                'reservation_status' => 'consumed',
            ],
            [
                'code' => '#CH-2026-S12',
                'status' => 'concluido',
                'title' => 'Manutenção quadro elétrico',
                'priority' => 'alta',
                'assignee' => $technicians[0],
                'months_ago' => 5,
                'day' => 20,
                'approved' => true,
                'evaluated' => true,
                'task_column' => 'concluidas',
                'materials' => [['sku' => 'ELE-DIS-20A', 'qty' => 2], ['sku' => 'ELE-TOM-10A', 'qty' => 3]],
                'reservation_status' => 'consumed',
            ],
        ];

        foreach ($samples as $index => $sample) {
            $openedAt = Carbon::now()
                ->subMonths($sample['months_ago'])
                ->startOfMonth()
                ->addDays($sample['day'])
                ->setHour(9 + ($index % 5));

            $room = (string) (101 + ($index % 15));
            $block = ['A', 'B', 'C'][$index % 3];

            $payload = [
                'requester' => $requesters[$index % count($requesters)],
                'title' => $sample['title'],
                'summary' => 'Chamado de demonstração vinculado ao estoque e fluxo de manutenção.',
                'room' => $room,
                'block' => $block,
                'priority' => $sample['priority'],
                'status' => $sample['status'],
                'assignee' => $sample['assignee'],
                'opened_at' => $openedAt,
                'created_at' => $openedAt,
                'updated_at' => $openedAt->copy()->addHours(6),
            ];

            if (in_array($sample['status'], ['em_atendimento', 'aguardando_aprovacao', 'avaliacao_pendente', 'concluido'], true)) {
                $payload['started_at'] = $openedAt->copy()->addHours(4);
            }

            if (in_array($sample['status'], ['aguardando_aprovacao', 'avaliacao_pendente', 'concluido'], true)) {
                $payload['completed_at'] = $openedAt->copy()->addDays(2);
                $payload['fixed_description'] = 'Serviço executado conforme solicitado.';
                $payload['resolution_summary'] = 'Reparo verificado em campo.';
            }

            if (! empty($sample['approved'])) {
                $payload['approved_by'] = 'Carlos Mendes';
                $payload['approved_at'] = $openedAt->copy()->addDays(3);
                $payload['approval_notes'] = 'Serviço conferido pelo chefe de manutenção.';
            }

            if (! empty($sample['evaluated'])) {
                $payload['evaluation_rating'] = 4 + ($index % 2);
                $payload['evaluation_notes'] = 'Atendimento satisfatório.';
                $payload['evaluated_by'] = $payload['requester'];
                $payload['evaluated_at'] = $openedAt->copy()->addDays(5);
            }

            $ticket = GridTicket::query()->updateOrCreate(
                ['code' => $sample['code']],
                $payload,
            );

            if (empty($sample['task_column'])) {
                continue;
            }

            $inventoryLines = $this->buildInventoryLines($sample['materials'] ?? [], $inventoryBySku);

            $task = GridTask::query()->updateOrCreate(
                ['code' => $sample['code'].'-T1'],
                [
                    'grid_ticket_id' => $ticket->id,
                    'opened_by' => $payload['requester'],
                    'title' => $sample['title'],
                    'description' => $payload['summary'],
                    'room' => $room,
                    'block' => $block,
                    'assignee' => $sample['assignee'],
                    'items' => [],
                    'inventory_items' => $inventoryLines,
                    'priority' => $sample['priority'],
                    'column' => $sample['task_column'],
                    'status_label' => match ($sample['task_column']) {
                        'concluidas' => 'Concluída',
                        'em_andamento' => 'Em atendimento',
                        default => 'A fazer',
                    },
                    'opened_at' => $payload['started_at'] ?? $openedAt,
                    'completed_at' => $sample['task_column'] === 'concluidas' ? ($payload['completed_at'] ?? null) : null,
                ],
            );

            GridInventoryReservation::query()->where('grid_task_id', $task->id)->delete();

            foreach ($inventoryLines as $line) {
                if (empty($sample['reservation_status'])) {
                    continue;
                }

                GridInventoryReservation::query()->create([
                    'grid_task_id' => $task->id,
                    'grid_ticket_id' => $ticket->id,
                    'grid_inventory_item_id' => $line['inventory_item_id'],
                    'quantity' => $line['quantity'],
                    'status' => $sample['reservation_status'],
                ]);
            }
        }

        $this->seedRoleScopedTickets();

        $this->recalculateInventoryReserved($inventoryBySku->pluck('id')->all());

        $this->command?->info('12 chamados (2 por etapa), tarefas e vínculos de estoque criados/atualizados.');
    }

    private function seedRoleScopedTickets(): void
    {
        $scoped = [
            [
                'code' => '#CH-2026-ROLE-P1',
                'requester' => 'Marcos Professor Grid',
                'assignee' => 'Pedro Tecnico',
                'title' => 'Ar-condicionado com ruido na sala 204',
                'status' => 'em_atendimento',
                'priority' => 'media',
            ],
            [
                'code' => '#CH-2026-ROLE-S1',
                'requester' => 'Sandra Secretaria Grid',
                'assignee' => 'Julia Tecnica',
                'title' => 'Impressora da secretaria sem toner',
                'status' => 'pendente',
                'priority' => 'baixa',
            ],
            [
                'code' => '#CH-2026-ROLE-T1',
                'requester' => 'Ana Costa',
                'assignee' => 'Pedro Tecnico',
                'title' => 'Tomada sem energia no corredor B',
                'status' => 'em_atendimento',
                'priority' => 'alta',
            ],
        ];

        foreach ($scoped as $index => $sample) {
            $openedAt = Carbon::now()->subDays(3 - $index)->setHour(10);

            $ticket = GridTicket::query()->updateOrCreate(
                ['code' => $sample['code']],
                [
                    'requester' => $sample['requester'],
                    'title' => $sample['title'],
                    'summary' => 'Chamado de demonstracao para teste de escopo por perfil.',
                    'room' => (string) (204 + $index),
                    'block' => 'B',
                    'priority' => $sample['priority'],
                    'status' => $sample['status'],
                    'assignee' => $sample['assignee'],
                    'opened_at' => $openedAt,
                    'started_at' => $sample['status'] === 'em_atendimento' ? $openedAt->copy()->addHours(2) : null,
                ],
            );

            GridTask::query()->updateOrCreate(
                ['code' => $sample['code'].'-T1'],
                [
                    'grid_ticket_id' => $ticket->id,
                    'opened_by' => $sample['requester'],
                    'title' => $sample['title'],
                    'description' => $ticket->summary,
                    'room' => $ticket->room,
                    'block' => $ticket->block,
                    'assignee' => $sample['assignee'],
                    'items' => [],
                    'inventory_items' => [],
                    'priority' => $sample['priority'],
                    'column' => $sample['status'] === 'em_atendimento' ? 'em_andamento' : 'a_fazer',
                    'status_label' => $sample['status'] === 'em_atendimento' ? 'Em atendimento' : 'A fazer',
                    'opened_at' => $openedAt,
                ],
            );
        }
    }

    /**
     * @param  list<array{sku: string, qty: int}>  $materials
     * @param  \Illuminate\Support\Collection<string, GridInventoryItem>  $inventoryBySku
     * @return list<array{inventory_item_id: int, quantity: int, title: string}>
     */
    private function buildInventoryLines(array $materials, $inventoryBySku): array
    {
        $lines = [];

        foreach ($materials as $material) {
            $item = $inventoryBySku->get($material['sku']);
            if (! $item) {
                continue;
            }

            $lines[] = [
                'inventory_item_id' => $item->id,
                'quantity' => $material['qty'],
                'title' => $item->title,
            ];
        }

        return $lines;
    }

    /** @param  list<int>  $inventoryIds */
    private function recalculateInventoryReserved(array $inventoryIds): void
    {
        foreach ($inventoryIds as $inventoryId) {
            $item = GridInventoryItem::query()->find($inventoryId);
            if (! $item) {
                continue;
            }

            $reserved = (int) GridInventoryReservation::query()
                ->where('grid_inventory_item_id', $inventoryId)
                ->where('status', 'reserved')
                ->sum('quantity');

            $item->qty_reserved = $reserved;
            $item->refreshStockStatus();
            $item->save();
        }
    }
}
