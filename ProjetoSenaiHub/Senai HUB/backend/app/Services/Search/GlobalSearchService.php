<?php

namespace App\Services\Search;

use App\Models\Connect\ConnectClass;
use App\Models\Connect\ConnectStudent;
use App\Models\Grid\GridInventoryItem;
use App\Models\Grid\GridTicket;
use App\Models\User;
use App\Services\Auth\PermissionService;
use App\Support\UserAccessScope;
use Illuminate\Support\Str;

class GlobalSearchService
{
    public function __construct(
        private readonly PermissionService $permissions,
    ) {}

    /**
     * @return array{groups: list<array{module: string, label: string, items: list<array{id: string, title: string, subtitle: string, url: string, meta?: string}>}>}
     */
    public function search(User $user, string $query, int $limitPerGroup = 8): array
    {
        $query = trim($query);
        if (mb_strlen($query) < 2) {
            return ['groups' => []];
        }

        $groups = [];

        if ($this->permissions->can($user, 'connect.students.view')
            || $this->permissions->can($user, 'connect.students.manage')) {
            $groups[] = $this->searchStudents($user, $query, $limitPerGroup);
        }

        if ($this->permissions->can($user, 'connect.classes.view')
            || $this->permissions->can($user, 'connect.classes.manage')) {
            $groups[] = $this->searchClasses($user, $query, $limitPerGroup);
        }

        if ($this->permissions->can($user, 'grid.tickets.view')
            || $this->permissions->can($user, 'grid.tickets.manage')) {
            $groups[] = $this->searchTickets($query, $limitPerGroup);
        }

        if ($this->permissions->can($user, 'grid.inventory.view')
            || $this->permissions->can($user, 'grid.inventory.manage')) {
            $groups[] = $this->searchInventory($query, $limitPerGroup);
        }

        return [
            'groups' => array_values(array_filter($groups, fn (array $group) => $group['items'] !== [])),
        ];
    }

    /**
     * @return array{module: string, label: string, items: list<array{id: string, title: string, subtitle: string, url: string, meta?: string}>}
     */
    private function searchStudents(User $user, string $query, int $limit): array
    {
        $like = '%'.$query.'%';
        $items = UserAccessScope::connectStudentQuery($user)
            ->where(function ($q) use ($like, $query) {
                $q->where('full_name', 'like', $like)
                    ->orWhere('registration_number', 'like', $like)
                    ->orWhere('email', 'like', $like)
                    ->orWhere('cpf', 'like', $like);
            })
            ->orderBy('full_name')
            ->limit($limit)
            ->get(['id', 'full_name', 'registration_number', 'email']);

        return [
            'module' => 'connect',
            'label' => 'Alunos',
            'items' => $items->map(fn (ConnectStudent $student) => [
                'id' => 'student-'.$student->id,
                'title' => $student->full_name,
                'subtitle' => $student->registration_number
                    ? 'Matricula '.$student->registration_number
                    : ($student->email ?? 'Aluno'),
                'url' => '/connect/alunos?highlight='.$student->id,
                'meta' => 'Connect',
            ])->all(),
        ];
    }

    /**
     * @return array{module: string, label: string, items: list<array{id: string, title: string, subtitle: string, url: string, meta?: string}>}
     */
    private function searchClasses(User $user, string $query, int $limit): array
    {
        $like = '%'.$query.'%';
        $items = UserAccessScope::connectClassQuery($user)
            ->where(function ($q) use ($like) {
                $q->where('name', 'like', $like)->orWhere('code', 'like', $like);
            })
            ->orderBy('name')
            ->limit($limit)
            ->get(['id', 'name', 'code']);

        return [
            'module' => 'connect',
            'label' => 'Turmas',
            'items' => $items->map(fn (ConnectClass $class) => [
                'id' => 'class-'.$class->id,
                'title' => $class->name,
                'subtitle' => $class->code ? 'Codigo '.$class->code : 'Turma',
                'url' => '/connect/turmas?highlight='.$class->id,
                'meta' => 'Connect',
            ])->all(),
        ];
    }

    /**
     * @return array{module: string, label: string, items: list<array{id: string, title: string, subtitle: string, url: string, meta?: string}>}
     */
    private function searchTickets(string $query, int $limit): array
    {
        $normalized = Str::upper(trim($query));
        $codeQuery = $normalized;
        if (str_starts_with($codeQuery, '#')) {
            $codeQuery = substr($codeQuery, 1);
        }
        if (! str_starts_with($codeQuery, 'CH-')) {
            $codeQuery = 'CH-'.$codeQuery;
        }

        $like = '%'.$query.'%';
        $items = GridTicket::query()
            ->where(function ($q) use ($like, $codeQuery) {
                $q->where('title', 'like', $like)
                    ->orWhere('code', 'like', $like)
                    ->orWhere('code', 'like', '%'.$codeQuery.'%')
                    ->orWhere('requester', 'like', $like)
                    ->orWhere('summary', 'like', $like);
            })
            ->orderByDesc('opened_at')
            ->limit($limit)
            ->get(['id', 'code', 'title', 'status', 'requester']);

        return [
            'module' => 'grid',
            'label' => 'Chamados',
            'items' => $items->map(fn (GridTicket $ticket) => [
                'id' => 'ticket-'.$ticket->id,
                'title' => $ticket->code.' — '.$ticket->title,
                'subtitle' => $ticket->requester.' · '.str_replace('_', ' ', $ticket->status),
                'url' => '/grid/chamados?highlight='.$ticket->id,
                'meta' => 'Grid',
            ])->all(),
        ];
    }

    /**
     * @return array{module: string, label: string, items: list<array{id: string, title: string, subtitle: string, url: string, meta?: string}>}
     */
    private function searchInventory(string $query, int $limit): array
    {
        $like = '%'.$query.'%';
        $items = GridInventoryItem::query()
            ->where(function ($q) use ($like) {
                $q->where('title', 'like', $like)
                    ->orWhere('category', 'like', $like)
                    ->orWhere('location', 'like', $like);
            })
            ->orderBy('title')
            ->limit($limit)
            ->get(['id', 'title', 'category', 'qty_available', 'status']);

        return [
            'module' => 'grid',
            'label' => 'Estoque',
            'items' => $items->map(fn (GridInventoryItem $item) => [
                'id' => 'inventory-'.$item->id,
                'title' => $item->title,
                'subtitle' => ($item->category ?? 'Item').' · Qtd '.$item->qty_available,
                'url' => '/grid/estoque?highlight='.$item->id,
                'meta' => 'Grid',
            ])->all(),
        ];
    }
}
