<div>
    @if (session('message'))
        <div class="mb-4 p-4 bg-green-100 text-green-800 rounded-lg">
            {{ session('message') }}
        </div>
    @endif

    <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div class="flex flex-wrap items-center gap-2">
            <flux:input
                wire:model.live="search"
                placeholder="Buscar por título ou responsável..."
                icon="magnifying-glass"
            />
            <flux:select wire:model.live="status" placeholder="Status">
                <option value="">Todos</option>
                <option value="Pendente">Pendente</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Concluído">Concluído</option>
            </flux:select>
            <flux:select wire:model.live="prioridade" placeholder="Prioridade">
                <option value="">Todas</option>
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
            </flux:select>
        </div>
        <flux:button variant="primary" wire:click="create">
            Nova Tarefa
        </flux:button>
    </div>

    <div class="overflow-x-auto">
        <flux:table>
            <flux:table.columns>
                <flux:table.column>#</flux:table.column>
                <flux:table.column>Título</flux:table.column>
                <flux:table.column>Responsável</flux:table.column>
                <flux:table.column>Localização</flux:table.column>
                <flux:table.column>Prioridade</flux:table.column>
                <flux:table.column>Status</flux:table.column>
                <flux:table.column>Data Início</flux:table.column>
                <flux:table.column>Data Final</flux:table.column>
                <flux:table.column>Ações</flux:table.column>
            </flux:table.columns>
            <flux:table.rows>
                @foreach ($tarefas as $tarefa)
                    <flux:table.row :key="$tarefa->id" class="{{ $tarefa->esta_vencida ? 'bg-red-50 dark:bg-red-900/20' : '' }}">
                        <flux:table.cell>{{ $tarefa->id }}</flux:table.cell>
                        <flux:table.cell>{{ $tarefa->titulo }}</flux:table.cell>
                        <flux:table.cell>{{ $tarefa->responsavel?->nome ?? '-' }}</flux:table.cell>
                        <flux:table.cell>{{ $tarefa->localizacao }}</flux:table.cell>
                        <flux:table.cell>
                            @php
                                $prioridadeColors = [
                                    'Baixa' => 'green',
                                    'Média' => 'yellow',
                                    'Alta' => 'orange',
                                    'Urgente' => 'red',
                                ];
                            @endphp
                            <flux:badge variant="solid" :color="$prioridadeColors[$tarefa->prioridade] ?? 'gray'">
                                {{ $tarefa->prioridade }}
                            </flux:badge>
                        </flux:table.cell>
                        <flux:table.cell>
                            @php
                                $statusColors = [
                                    'Pendente' => 'gray',
                                    'Em Andamento' => 'blue',
                                    'Concluído' => 'green',
                                ];
                            @endphp
                            <flux:badge variant="solid" :color="$statusColors[$tarefa->status] ?? 'gray'">
                                {{ $tarefa->status }}
                            </flux:badge>
                        </flux:table.cell>
                        <flux:table.cell>{{ $tarefa->data_inicio->format('d/m/Y') }}</flux:table.cell>
                        <flux:table.cell>{{ $tarefa->data_final->format('d/m/Y') }}</flux:table.cell>
                        <flux:table.cell>
                            <div class="flex items-center gap-2">
                                <flux:button size="sm" wire:click="edit({{ $tarefa->id }})">Editar</flux:button>
                                <flux:button size="sm" variant="danger" wire:click="delete({{ $tarefa->id }})" wire:confirm="Tem certeza que deseja excluir esta tarefa?">Excluir</flux:button>
                            </div>
                        </flux:table.cell>
                    </flux:table.row>
                @endforeach
            </flux:table.rows>
        </flux:table>
    </div>

    <div class="mt-4">
        {{ $tarefas->links() }}
    </div>

    <flux:modal wire:model="showModal" :title="$isEdit ? 'Editar Tarefa' : 'Nova Tarefa'">
        <form wire:submit="save" class="space-y-4">
            <flux:input label="Título" wire:model="titulo" required />
            <flux:select label="Responsável" wire:model="id_responsavel" required>
                <option value="">Selecione</option>
                @foreach ($responsaveis as $resp)
                    <option value="{{ $resp->id }}">{{ $resp->nome }}</option>
                @endforeach
            </flux:select>
            <flux:input label="Localização" wire:model="localizacao" required />
            <flux:select label="Prioridade" wire:model="prioridade_item" required>
                <option value="">Selecione</option>
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
            </flux:select>
            <flux:select label="Status" wire:model="status_item" required>
                <option value="">Selecione</option>
                <option value="Pendente">Pendente</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Concluído">Concluído</option>
            </flux:select>
            <flux:input label="Data Início" type="date" wire:model="data_inicio" required />
            <flux:input label="Data Final" type="date" wire:model="data_final" required />
            <div class="flex justify-end gap-2">
                <flux:button type="button" wire:click="$set('showModal', false)">Cancelar</flux:button>
                <flux:button type="submit" variant="primary">Salvar</flux:button>
            </div>
        </form>
    </flux:modal>
</div>
