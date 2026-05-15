<div>
    @if (session('message'))
        <div class="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {{ session('message') }}
        </div>
    @endif

    @php
        $columns = [
            'Pendente' => ['titulo' => 'A Fazer', 'classe' => 'bg-[rgba(108,108,112,.94)]'],
            'Em Andamento' => ['titulo' => 'Em Andamento', 'classe' => 'bg-[rgba(128,118,37,.94)]'],
            'Concluído' => ['titulo' => 'Concluído', 'classe' => 'bg-[rgba(44,104,41,.94)]'],
        ];
        $prioridadeClasses = [
            'Baixa' => 'pf-badge-green',
            'Média' => 'pf-badge-gold',
            'Alta' => 'pf-badge-red',
            'Urgente' => 'pf-badge-red',
        ];
    @endphp

    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div class="pf-chip-tabs">
            <div class="pf-chip">Todas as tarefas ({{ $tarefas->total() }})</div>
            <div class="pf-chip">Tarefas de hoje ({{ $tarefas->where('data_inicio', now()->toDateString())->count() }})</div>
            <div class="pf-chip">Tarefas da semana ({{ $tarefas->count() }})</div>
        </div>
        <div class="flex flex-wrap gap-3">
            <input wire:model.live="search" class="pf-input min-w-[240px]" placeholder="Buscar tarefa ou responsável..." />
            <button type="button" class="pf-btn pf-btn-primary" wire:click="create">Nova Tarefa</button>
        </div>
    </div>

    <div class="pf-kanban">
        @foreach ($columns as $statusKey => $column)
            <section class="pf-panel pf-kanban-column">
                <div class="pf-kanban-header {{ $column['classe'] }}">{{ $column['titulo'] }}</div>
                <div class="pf-kanban-body">
                    @forelse ($tarefas->where('status', $statusKey) as $tarefa)
                        <article class="pf-task-card" wire:key="tarefa-{{ $tarefa->id }}">
                            <div class="text-xs text-white/35">#{{ $tarefa->id }}</div>
                            <div class="mt-2 font-heading text-2xl font-semibold text-white">{{ $tarefa->titulo }}</div>
                            <div class="text-lg text-white/72">{{ $tarefa->localizacao }}</div>
                            <div class="mt-3 text-sm text-white/45">Responsável: {{ $tarefa->responsavel?->nome ?? '-' }}</div>
                            <div class="mt-3 flex items-center gap-2 text-sm">
                                <span class="text-white/50">Prioridade</span>
                                <span class="pf-badge {{ $prioridadeClasses[$tarefa->prioridade] ?? 'pf-badge-gray' }}">{{ $tarefa->prioridade }}</span>
                            </div>
                            <div class="mt-3 text-sm text-white/45">{{ $tarefa->data_final->format('d \d\e F Y') }}</div>
                            <div class="mt-4 flex flex-wrap gap-2">
                                <button class="pf-btn pf-btn-secondary !min-h-9 !px-4" wire:click="edit({{ $tarefa->id }})">Editar</button>
                                <button class="pf-btn !min-h-9 !px-4 bg-red-900/80 text-white" wire:click="delete({{ $tarefa->id }})" wire:confirm="Tem certeza que deseja excluir esta tarefa?">Excluir</button>
                            </div>
                        </article>
                    @empty
                        <div class="rounded-2xl border border-dashed border-white/8 px-4 py-5 text-center text-white/45">
                            Nenhuma tarefa neste estágio.
                        </div>
                    @endforelse
                </div>
            </section>
        @endforeach
    </div>

    @if ($showModal)
        <div class="pf-modal-backdrop" wire:click.self="$set('showModal', false)">
            <div class="pf-modal">
                <div class="mb-5 flex items-center justify-between">
                    <h3 class="font-heading text-2xl font-bold text-white">{{ $isEdit ? 'Editar Tarefa' : 'Nova Tarefa' }}</h3>
                    <button class="pf-btn pf-btn-secondary !min-h-9 !px-4" type="button" wire:click="$set('showModal', false)">Fechar</button>
                </div>

                <form wire:submit="save" class="grid gap-4">
                    <div>
                        <label class="pf-label">Título</label>
                        <input class="pf-input" wire:model="titulo" required />
                    </div>
                    <div>
                        <label class="pf-label">Responsável</label>
                        <select class="pf-select" wire:model="id_responsavel" required>
                            <option value="">Selecione</option>
                            @foreach ($responsaveis as $resp)
                                <option value="{{ $resp->id }}">{{ $resp->nome }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div>
                        <label class="pf-label">Localização</label>
                        <input class="pf-input" wire:model="localizacao" required />
                    </div>
                    <div class="grid gap-4 md:grid-cols-2">
                        <div>
                            <label class="pf-label">Prioridade</label>
                            <select class="pf-select" wire:model="prioridade_item" required>
                                <option value="">Selecione</option>
                                <option value="Baixa">Baixa</option>
                                <option value="Média">Média</option>
                                <option value="Alta">Alta</option>
                                <option value="Urgente">Urgente</option>
                            </select>
                        </div>
                        <div>
                            <label class="pf-label">Status</label>
                            <select class="pf-select" wire:model="status_item" required>
                                <option value="">Selecione</option>
                                <option value="Pendente">Pendente</option>
                                <option value="Em Andamento">Em Andamento</option>
                                <option value="Concluído">Concluído</option>
                            </select>
                        </div>
                    </div>
                    <div class="grid gap-4 md:grid-cols-2">
                        <div>
                            <label class="pf-label">Data Início</label>
                            <input class="pf-input" type="date" wire:model="data_inicio" required />
                        </div>
                        <div>
                            <label class="pf-label">Data Final</label>
                            <input class="pf-input" type="date" wire:model="data_final" required />
                        </div>
                    </div>
                    <div class="flex justify-end gap-2">
                        <button type="button" class="pf-btn pf-btn-secondary" wire:click="$set('showModal', false)">Cancelar</button>
                        <button type="submit" class="pf-btn pf-btn-primary">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    @endif
</div>
