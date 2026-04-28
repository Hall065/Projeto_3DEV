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
                placeholder="Buscar por título, solicitante ou local..."
                icon="magnifying-glass"
            />
            <flux:select wire:model.live="status" placeholder="Status">
                <option value="">Todos</option>
                <option value="Aberto">Aberto</option>
                <option value="Em Análise">Em Análise</option>
                <option value="Fechado">Fechado</option>
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
            Novo Chamado
        </flux:button>
    </div>

    <div class="overflow-x-auto">
        <flux:table>
            <flux:table.columns>
                <flux:table.column>#</flux:table.column>
                <flux:table.column>Título</flux:table.column>
                <flux:table.column>Solicitante</flux:table.column>
                <flux:table.column>Atendente</flux:table.column>
                <flux:table.column>Local</flux:table.column>
                <flux:table.column>Prioridade</flux:table.column>
                <flux:table.column>Status</flux:table.column>
                <flux:table.column>Criado em</flux:table.column>
                <flux:table.column>Ações</flux:table.column>
            </flux:table.columns>
            <flux:table.rows>
                @foreach ($chamados as $chamado)
                    <flux:table.row :key="$chamado->id">
                        <flux:table.cell>{{ $chamado->id }}</flux:table.cell>
                        <flux:table.cell>{{ $chamado->titulo }}</flux:table.cell>
                        <flux:table.cell>{{ $chamado->usuario?->nome ?? '-' }}</flux:table.cell>
                        <flux:table.cell>{{ $chamado->atendente?->nome ?? '-' }}</flux:table.cell>
                        <flux:table.cell>{{ $chamado->local }}</flux:table.cell>
                        <flux:table.cell>
                            @php
                                $prioridadeColors = [
                                    'Baixa' => 'green',
                                    'Média' => 'yellow',
                                    'Alta' => 'orange',
                                    'Urgente' => 'red',
                                ];
                            @endphp
                            <flux:badge variant="solid" :color="$prioridadeColors[$chamado->prioridade] ?? 'gray'">
                                {{ $chamado->prioridade }}
                            </flux:badge>
                        </flux:table.cell>
                        <flux:table.cell>
                            @php
                                $statusColors = [
                                    'Aberto' => 'blue',
                                    'Em Análise' => 'yellow',
                                    'Fechado' => 'green',
                                ];
                            @endphp
                            <flux:badge variant="solid" :color="$statusColors[$chamado->status] ?? 'gray'">
                                {{ $chamado->status }}
                            </flux:badge>
                        </flux:table.cell>
                        <flux:table.cell>{{ $chamado->created_at->format('d/m/Y H:i') }}</flux:table.cell>
                        <flux:table.cell>
                            <div class="flex items-center gap-2">
                                <flux:button size="sm" wire:click="show({{ $chamado->id }})">Ver</flux:button>
                                <flux:button size="sm" wire:click="edit({{ $chamado->id }})">Editar</flux:button>
                                <flux:button size="sm" variant="danger" wire:click="delete({{ $chamado->id }})" wire:confirm="Tem certeza que deseja excluir este chamado?">Excluir</flux:button>
                            </div>
                        </flux:table.cell>
                    </flux:table.row>
                @endforeach
            </flux:table.rows>
        </flux:table>
    </div>

    <div class="mt-4">
        {{ $chamados->links() }}
    </div>

    <flux:modal wire:model="showModal" :title="$isEdit ? 'Editar Chamado' : 'Novo Chamado'">
        <form wire:submit="save" class="space-y-4">
            <flux:input label="Título" wire:model="titulo" required />
            <flux:select label="Atendente" wire:model="id_atendente">
                <option value="">Sem atendente</option>
                @foreach ($atendentes as $atendente)
                    <option value="{{ $atendente->id }}">{{ $atendente->nome }}</option>
                @endforeach
            </flux:select>
            <flux:input label="Local" wire:model="local" required />
            <flux:select label="Prioridade" wire:model="prioridade_item" required>
                <option value="">Selecione</option>
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
            </flux:select>
            @if ($isEdit)
                <flux:select label="Status" wire:model="status_item" required>
                    <option value="">Selecione</option>
                    <option value="Aberto">Aberto</option>
                    <option value="Em Análise">Em Análise</option>
                    <option value="Fechado">Fechado</option>
                </flux:select>
            @endif
            <flux:textarea label="Descrição" wire:model="descricao" rows="4" />
            <div class="flex justify-end gap-2">
                <flux:button type="button" wire:click="$set('showModal', false)">Cancelar</flux:button>
                <flux:button type="submit" variant="primary">Salvar</flux:button>
            </div>
        </form>
    </flux:modal>

    <flux:modal wire:model="showDetailModal" title="Detalhes do Chamado" class="max-w-2xl">
        @if ($selectedChamado)
            <div class="space-y-4">
                <div>
                    <flux:heading size="md">{{ $selectedChamado->titulo }}</flux:heading>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <flux:text class="text-sm text-gray-500">Solicitante</flux:text>
                        <flux:text>{{ $selectedChamado->usuario?->nome ?? '-' }}</flux:text>
                    </div>
                    <div>
                        <flux:text class="text-sm text-gray-500">Atendente</flux:text>
                        <flux:text>{{ $selectedChamado->atendente?->nome ?? '-' }}</flux:text>
                    </div>
                    <div>
                        <flux:text class="text-sm text-gray-500">Local</flux:text>
                        <flux:text>{{ $selectedChamado->local }}</flux:text>
                    </div>
                    <div>
                        <flux:text class="text-sm text-gray-500">Criado em</flux:text>
                        <flux:text>{{ $selectedChamado->created_at->format('d/m/Y H:i') }}</flux:text>
                    </div>
                    <div>
                        <flux:text class="text-sm text-gray-500">Prioridade</flux:text>
                        <flux:badge variant="solid" :color="$prioridadeColors[$selectedChamado->prioridade] ?? 'gray'">
                            {{ $selectedChamado->prioridade }}
                        </flux:badge>
                    </div>
                    <div>
                        <flux:text class="text-sm text-gray-500">Status</flux:text>
                        <flux:badge variant="solid" :color="$statusColors[$selectedChamado->status] ?? 'gray'">
                            {{ $selectedChamado->status }}
                        </flux:badge>
                    </div>
                </div>
                @if ($selectedChamado->descricao)
                    <div>
                        <flux:text class="text-sm text-gray-500">Descrição</flux:text>
                        <flux:text class="mt-1">{{ $selectedChamado->descricao }}</flux:text>
                    </div>
                @endif
            </div>
        @endif
    </flux:modal>
</div>
