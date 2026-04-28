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
                placeholder="Buscar por nome ou localização..."
                icon="magnifying-glass"
            />
            <flux:select wire:model.live="categoria" placeholder="Categoria">
                <option value="">Todas</option>
                @foreach ($categorias as $cat)
                    <option value="{{ $cat }}">{{ $cat }}</option>
                @endforeach
            </flux:select>
            <flux:select wire:model.live="status" placeholder="Status">
                <option value="">Todos</option>
                <option value="Disponível">Disponível</option>
                <option value="Estoque Baixo">Estoque Baixo</option>
                <option value="Esgotado">Esgotado</option>
            </flux:select>
        </div>
        <flux:button variant="primary" wire:click="create">
            Novo Item
        </flux:button>
    </div>

    <div class="overflow-x-auto">
        <flux:table>
            <flux:table.columns>
                <flux:table.column>#</flux:table.column>
                <flux:table.column>Nome</flux:table.column>
                <flux:table.column>Categoria</flux:table.column>
                <flux:table.column>Localização</flux:table.column>
                <flux:table.column>Quantidade</flux:table.column>
                <flux:table.column>Status</flux:table.column>
                <flux:table.column>Atualizado em</flux:table.column>
                <flux:table.column>Ações</flux:table.column>
            </flux:table.columns>
            <flux:table.rows>
                @foreach ($estoques as $estoque)
                    <flux:table.row :key="$estoque->id">
                        <flux:table.cell>{{ $estoque->id }}</flux:table.cell>
                        <flux:table.cell>{{ $estoque->nome }}</flux:table.cell>
                        <flux:table.cell>{{ $estoque->categoria }}</flux:table.cell>
                        <flux:table.cell>{{ $estoque->localizacao }}</flux:table.cell>
                        <flux:table.cell>{{ $estoque->quantidade }}</flux:table.cell>
                        <flux:table.cell>
                            @php
                                $statusColors = [
                                    'Disponível' => 'green',
                                    'Estoque Baixo' => 'yellow',
                                    'Esgotado' => 'red',
                                ];
                            @endphp
                            <flux:badge variant="solid" :color="$statusColors[$estoque->status] ?? 'gray'">
                                {{ $estoque->status }}
                            </flux:badge>
                        </flux:table.cell>
                        <flux:table.cell>{{ $estoque->updated_at->format('d/m/Y H:i') }}</flux:table.cell>
                        <flux:table.cell>
                            <div class="flex items-center gap-2">
                                <flux:button size="sm" wire:click="edit({{ $estoque->id }})">Editar</flux:button>
                                <flux:button size="sm" variant="danger" wire:click="delete({{ $estoque->id }})" wire:confirm="Tem certeza que deseja excluir este item?">Excluir</flux:button>
                            </div>
                        </flux:table.cell>
                    </flux:table.row>
                @endforeach
            </flux:table.rows>
        </flux:table>
    </div>

    <div class="mt-4">
        {{ $estoques->links() }}
    </div>

    <flux:modal wire:model="showModal" :title="$isEdit ? 'Editar Item' : 'Novo Item'">
        <form wire:submit="save" class="space-y-4">
            <flux:input label="Nome" wire:model="nome" required />
            <flux:input label="Categoria" wire:model="categoria_item" required />
            <flux:input label="Localização" wire:model="localizacao" required />
            <flux:input label="Quantidade" type="number" min="0" wire:model="quantidade" required />
            <div class="flex justify-end gap-2">
                <flux:button type="button" wire:click="$set('showModal', false)">Cancelar</flux:button>
                <flux:button type="submit" variant="primary">Salvar</flux:button>
            </div>
        </form>
    </flux:modal>
</div>
