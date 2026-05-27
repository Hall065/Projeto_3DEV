<?php

namespace Database\Seeders;

use App\Models\Grid\GridTask;
use App\Models\Grid\GridTicket;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Amostra leve de chamados para gráficos e relatórios (não é removida pelo grid:purge-demo-data).
 * Executar: php artisan db:seed --class=GridSampleTicketsSeeder
 */
class GridSampleTicketsSeeder extends Seeder
{
    public function run(): void
    {
        $requesters = ['Ana Costa', 'Carlos Mendes', 'Paula Ribeiro', 'João Lima', 'Fernanda Dias'];

        $samples = [
            [
                'code' => '#CH-2026-S01',
                'status' => 'aberto',
                'title' => 'Projetor sem imagem na sala 101',
                'priority' => 'alta',
                'assignee' => null,
                'months_ago' => 0,
                'day' => 2,
            ],
            [
                'code' => '#CH-2026-S02',
                'status' => 'aberto',
                'title' => 'Janela não fecha no laboratório',
                'priority' => 'baixa',
                'assignee' => null,
                'months_ago' => 0,
                'day' => 5,
            ],
            [
                'code' => '#CH-2026-S03',
                'status' => 'pendente',
                'title' => 'Tomada sem energia — corredor B',
                'priority' => 'media',
                'assignee' => 'Júlio Oliveira',
                'months_ago' => 0,
                'day' => 8,
            ],
            [
                'code' => '#CH-2026-S04',
                'status' => 'pendente',
                'title' => 'Lâmpada queimada auditório',
                'priority' => 'alta',
                'assignee' => 'Maria Santos',
                'months_ago' => 1,
                'day' => 12,
            ],
            [
                'code' => '#CH-2026-S05',
                'status' => 'em_atendimento',
                'title' => 'Ar-condicionado com ruído',
                'priority' => 'media',
                'assignee' => 'Paulo Ferreira',
                'months_ago' => 1,
                'day' => 18,
                'task_column' => 'em_andamento',
            ],
            [
                'code' => '#CH-2026-S06',
                'status' => 'em_atendimento',
                'title' => 'Vazamento no banheiro masculino',
                'priority' => 'alta',
                'assignee' => 'Júlio Oliveira',
                'months_ago' => 0,
                'day' => 14,
                'task_column' => 'em_andamento',
            ],
            [
                'code' => '#CH-2026-S07',
                'status' => 'aguardando_aprovacao',
                'title' => 'Troca de fechadura digital',
                'priority' => 'media',
                'assignee' => 'Maria Santos',
                'months_ago' => 2,
                'day' => 6,
                'task_column' => 'concluidas',
            ],
            [
                'code' => '#CH-2026-S08',
                'status' => 'aguardando_aprovacao',
                'title' => 'Reparo em portão automático',
                'priority' => 'baixa',
                'assignee' => 'Paulo Ferreira',
                'months_ago' => 1,
                'day' => 22,
                'task_column' => 'concluidas',
            ],
            [
                'code' => '#CH-2026-S09',
                'status' => 'avaliacao_pendente',
                'title' => 'Instalação de ventilador de teto',
                'priority' => 'media',
                'assignee' => 'Júlio Oliveira',
                'months_ago' => 3,
                'day' => 10,
                'approved' => true,
            ],
            [
                'code' => '#CH-2026-S10',
                'status' => 'avaliacao_pendente',
                'title' => 'Pintura de parede danificada',
                'priority' => 'baixa',
                'assignee' => 'Maria Santos',
                'months_ago' => 2,
                'day' => 15,
                'approved' => true,
            ],
            [
                'code' => '#CH-2026-S11',
                'status' => 'concluido',
                'title' => 'Conserto de bebedouro',
                'priority' => 'media',
                'assignee' => 'Paulo Ferreira',
                'months_ago' => 4,
                'day' => 8,
                'approved' => true,
                'evaluated' => true,
            ],
            [
                'code' => '#CH-2026-S12',
                'status' => 'concluido',
                'title' => 'Manutenção quadro elétrico',
                'priority' => 'alta',
                'assignee' => 'Júlio Oliveira',
                'months_ago' => 5,
                'day' => 20,
                'approved' => true,
                'evaluated' => true,
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
                'summary' => 'Chamado de amostra para visualização de gráficos e relatórios.',
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

            if (! empty($sample['task_column'])) {
                GridTask::query()->updateOrCreate(
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
                        'inventory_items' => [],
                        'priority' => $sample['priority'],
                        'column' => $sample['task_column'],
                        'status_label' => $sample['task_column'] === 'concluidas' ? 'Concluída' : 'Em atendimento',
                        'opened_at' => $payload['started_at'] ?? $openedAt,
                        'completed_at' => $sample['task_column'] === 'concluidas' ? $payload['completed_at'] : null,
                    ],
                );
            }
        }

        $this->command?->info('12 chamados de amostra criados/atualizados para gráficos.');
    }
}
