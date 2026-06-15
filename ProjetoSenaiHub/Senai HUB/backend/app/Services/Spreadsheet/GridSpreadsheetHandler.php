<?php

namespace App\Services\Spreadsheet;

use App\Models\Grid\GridInventoryItem;
use App\Models\Grid\GridTask;
use App\Models\Grid\GridTicket;
use App\Models\Grid\GridUser;
use App\Support\GridCode;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class GridSpreadsheetHandler
{
    /**
     * @return \Generator<int, array<string, string|null>>
     */
    public function export(string $key, Request $request): \Generator
    {
        return match ($key) {
            'users' => $this->exportUsers(),
            'inventory' => $this->exportInventory($request),
            'tickets' => $this->exportTickets($request),
            'tasks' => $this->exportTasks($request),
            default => throw ValidationException::withMessages(['key' => 'Planilha Grid nao encontrada.']),
        };
    }

    /**
     * @param  list<array<string, string>>  $rows
     * @return array{created: int, updated: int, errors: list<array{row: int, message: string}>}
     */
    public function import(string $key, array $rows): array
    {
        return match ($key) {
            'users' => $this->importUsers($rows),
            'inventory' => $this->importInventory($rows),
            'tickets' => $this->importTickets($rows),
            'tasks' => $this->importTasks($rows),
            default => throw ValidationException::withMessages(['key' => 'Importacao nao disponivel para esta planilha.']),
        };
    }

    private function exportUsers(): \Generator
    {
        foreach (GridUser::query()->orderBy('name')->cursor() as $user) {
            yield [
                'nome' => $user->name,
                'email' => $user->email,
                'telefone' => $user->phone,
                'perfil' => $user->role,
                'cpf' => $user->cpf,
                'status' => $user->status,
            ];
        }
    }

    private function exportInventory(Request $request): \Generator
    {
        $query = GridInventoryItem::query()->orderBy('title');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        foreach ($query->cursor() as $item) {
            yield [
                'titulo' => $item->title,
                'categoria' => $item->category,
                'qtd_disponivel' => (string) $item->qty_available,
                'qtd_minima' => (string) $item->qty_min,
                'local' => $item->location,
                'fornecedor' => $item->supplier,
                'custo' => (string) $item->cost,
                'status' => $item->status,
            ];
        }
    }

    private function exportTickets(Request $request): \Generator
    {
        $query = GridTicket::query()->orderByDesc('opened_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        foreach ($query->cursor() as $ticket) {
            yield [
                'codigo' => $ticket->code,
                'titulo' => $ticket->title,
                'solicitante' => $ticket->requester,
                'resumo' => $ticket->summary,
                'sala' => $ticket->room,
                'bloco' => $ticket->block,
                'prioridade' => $ticket->priority,
                'status' => $ticket->status,
                'responsavel' => $ticket->assignee,
                'aberto_em' => $ticket->opened_at?->format('Y-m-d H:i'),
            ];
        }
    }

    private function exportTasks(Request $request): \Generator
    {
        $query = GridTask::query()->with('ticket')->orderByDesc('opened_at');

        if ($request->filled('column')) {
            $query->where('column', $request->string('column')->toString());
        }

        foreach ($query->cursor() as $task) {
            yield [
                'codigo' => $task->code,
                'codigo_chamado' => $task->ticket?->code,
                'titulo' => $task->title,
                'responsavel' => $task->assignee,
                'coluna' => $task->column,
                'prioridade' => $task->priority,
                'status' => $task->status_label,
                'sala' => $task->room,
                'bloco' => $task->block,
                'aberto_em' => $task->opened_at?->format('Y-m-d H:i'),
            ];
        }
    }

    /**
     * @param  list<array<string, string>>  $rows
     */
    private function importUsers(array $rows): array
    {
        $stats = ['created' => 0, 'updated' => 0, 'errors' => []];

        foreach ($rows as $index => $row) {
            $line = $index + 2;
            try {
                $validated = validator($row, [
                    'nome' => ['required', 'string', 'max:255'],
                    'email' => ['required', 'email', 'max:255'],
                    'telefone' => ['nullable', 'string', 'max:20'],
                    'perfil' => ['required', 'string', 'max:100'],
                    'cpf' => ['nullable', 'string', 'max:14'],
                    'status' => ['nullable', Rule::in(['active', 'inactive'])],
                ])->validate();

                $user = GridUser::query()->updateOrCreate(
                    ['email' => $validated['email']],
                    [
                        'name' => $validated['nome'],
                        'phone' => $validated['telefone'] ?? null,
                        'role' => $validated['perfil'],
                        'cpf' => $validated['cpf'] ?? null,
                        'status' => $validated['status'] ?? 'active',
                    ],
                );

                $user->wasRecentlyCreated ? $stats['created']++ : $stats['updated']++;
            } catch (ValidationException $e) {
                $stats['errors'][] = ['row' => $line, 'message' => collect($e->errors())->flatten()->first() ?? 'Dados invalidos.'];
            } catch (\Throwable $e) {
                $stats['errors'][] = ['row' => $line, 'message' => $e->getMessage()];
            }
        }

        return $stats;
    }

    /**
     * @param  list<array<string, string>>  $rows
     */
    private function importInventory(array $rows): array
    {
        $stats = ['created' => 0, 'updated' => 0, 'errors' => []];

        foreach ($rows as $index => $row) {
            $line = $index + 2;
            try {
                $validated = validator($row, [
                    'titulo' => ['required', 'string', 'max:255'],
                    'categoria' => ['nullable', 'string', 'max:100'],
                    'qtd_disponivel' => ['nullable', 'integer', 'min:0'],
                    'qtd_minima' => ['nullable', 'integer', 'min:0'],
                    'local' => ['nullable', 'string', 'max:255'],
                    'fornecedor' => ['nullable', 'string', 'max:255'],
                    'custo' => ['nullable', 'numeric', 'min:0'],
                    'status' => ['nullable', Rule::in(['disponivel', 'baixo', 'reservado'])],
                ])->validate();

                $item = GridInventoryItem::query()->updateOrCreate(
                    ['title' => $validated['titulo']],
                    [
                        'category' => $validated['categoria'] ?? null,
                        'qty_available' => $validated['qtd_disponivel'] ?? 0,
                        'qty_min' => $validated['qtd_minima'] ?? 0,
                        'location' => $validated['local'] ?? null,
                        'supplier' => $validated['fornecedor'] ?? null,
                        'cost' => $validated['custo'] ?? 0,
                        'status' => $validated['status'] ?? 'disponivel',
                    ],
                );

                $item->refreshStockStatus();
                $item->save();

                $item->wasRecentlyCreated ? $stats['created']++ : $stats['updated']++;
            } catch (ValidationException $e) {
                $stats['errors'][] = ['row' => $line, 'message' => collect($e->errors())->flatten()->first() ?? 'Dados invalidos.'];
            } catch (\Throwable $e) {
                $stats['errors'][] = ['row' => $line, 'message' => $e->getMessage()];
            }
        }

        return $stats;
    }

    /**
     * @param  list<array<string, string>>  $rows
     */
    private function importTickets(array $rows): array
    {
        $stats = ['created' => 0, 'updated' => 0, 'errors' => []];

        foreach ($rows as $index => $row) {
            $line = $index + 2;
            try {
                $validated = validator($row, [
                    'titulo' => ['required', 'string', 'max:255'],
                    'solicitante' => ['required', 'string', 'max:255'],
                    'resumo' => ['nullable', 'string'],
                    'sala' => ['nullable', 'string', 'max:50'],
                    'bloco' => ['nullable', 'string', 'max:50'],
                    'prioridade' => ['nullable', Rule::in(['baixa', 'media', 'alta', 'critica'])],
                ])->validate();

                GridTicket::query()->create([
                    'code' => GridCode::nextTicketCode(),
                    'title' => $validated['titulo'],
                    'requester' => $validated['solicitante'],
                    'summary' => $validated['resumo'] ?? null,
                    'room' => $validated['sala'] ?? null,
                    'block' => $validated['bloco'] ?? null,
                    'priority' => $validated['prioridade'] ?? 'media',
                    'status' => 'aberto',
                    'opened_at' => now(),
                ]);

                $stats['created']++;
            } catch (ValidationException $e) {
                $stats['errors'][] = ['row' => $line, 'message' => collect($e->errors())->flatten()->first() ?? 'Dados invalidos.'];
            } catch (\Throwable $e) {
                $stats['errors'][] = ['row' => $line, 'message' => $e->getMessage()];
            }
        }

        return $stats;
    }

    /**
     * @param  list<array<string, string>>  $rows
     */
    private function importTasks(array $rows): array
    {
        $stats = ['created' => 0, 'updated' => 0, 'errors' => []];

        foreach ($rows as $index => $row) {
            $line = $index + 2;
            try {
                $validated = validator($row, [
                    'codigo_chamado' => ['nullable', 'string', 'max:50'],
                    'titulo' => ['required', 'string', 'max:255'],
                    'responsavel' => ['nullable', 'string', 'max:255'],
                    'coluna' => ['nullable', Rule::in(['a_fazer', 'em_andamento', 'concluidas'])],
                    'prioridade' => ['nullable', Rule::in(['baixa', 'media', 'alta', 'critica'])],
                    'sala' => ['nullable', 'string', 'max:50'],
                    'bloco' => ['nullable', 'string', 'max:50'],
                ])->validate();

                $ticketId = null;
                if (! empty($validated['codigo_chamado'])) {
                    $ticket = GridTicket::query()->where('code', $validated['codigo_chamado'])->first();
                    if (! $ticket) {
                        throw ValidationException::withMessages(['codigo_chamado' => 'Chamado nao encontrado.']);
                    }
                    $ticketId = $ticket->id;
                }

                GridTask::query()->create([
                    'grid_ticket_id' => $ticketId,
                    'code' => GridCode::nextTaskCode(),
                    'opened_by' => 'Importacao',
                    'title' => $validated['titulo'],
                    'assignee' => $validated['responsavel'] ?? null,
                    'column' => $validated['coluna'] ?? 'a_fazer',
                    'priority' => $validated['prioridade'] ?? 'media',
                    'room' => $validated['sala'] ?? null,
                    'block' => $validated['bloco'] ?? null,
                    'opened_at' => now(),
                    'status_label' => 'Em aberto',
                ]);

                $stats['created']++;
            } catch (ValidationException $e) {
                $stats['errors'][] = ['row' => $line, 'message' => collect($e->errors())->flatten()->first() ?? 'Dados invalidos.'];
            } catch (\Throwable $e) {
                $stats['errors'][] = ['row' => $line, 'message' => $e->getMessage()];
            }
        }

        return $stats;
    }
}
