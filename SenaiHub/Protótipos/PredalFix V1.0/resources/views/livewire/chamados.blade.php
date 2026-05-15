<div>
    @if (session('message'))
        <div class="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {{ session('message') }}
        </div>
    @endif

    @php
        $statusClasses = [
            'Aberto' => 'pf-badge-red',
            'Em Análise' => 'pf-badge-gold',
            'Fechado' => 'pf-badge-green',
        ];
        $prioridadeClasses = [
            'Baixa' => 'pf-badge-green',
            'Média' => 'pf-badge-gold',
            'Alta' => 'pf-badge-red',
            'Urgente' => 'pf-badge-red',
        ];
    @endphp

    <div class="pf-grid" style="grid-template-columns: minmax(0, 1fr) 220px;">
        <section class="pf-panel p-4 sm:p-6">
            <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div class="flex flex-wrap items-center gap-3">
                    <input wire:model.live="search" class="pf-input min-w-[220px]" placeholder="Buscar por título, local ou solicitante..." />
                    <button type="button" class="pf-btn pf-btn-primary" wire:click="create">Novo Chamado</button>
                </div>
            </div>

            <div class="pf-table-wrap">
                <table class="pf-table">
                    <thead>
                        <tr>
                            <th>Nº</th>
                            <th>Título</th>
                            <th>Local</th>
                            <th>Status</th>
                            <th>Prioridade</th>
                            <th>Data Abertura</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($chamados as $chamado)
                            <tr wire:key="chamado-{{ $chamado->id }}">
                                <td>#{{ str_pad((string) $chamado->id, 3, '0', STR_PAD_LEFT) }}</td>
                                <td>
                                    <div class="font-semibold text-white">{{ $chamado->titulo }}</div>
                                    <div class="text-xs text-white/45">{{ $chamado->usuario?->nome ?? '-' }}</div>
                                </td>
                                <td>{{ $chamado->local }}</td>
                                <td><span class="pf-badge {{ $statusClasses[$chamado->status] ?? 'pf-badge-gray' }}">{{ $chamado->status }}</span></td>
                                <td><span class="pf-badge {{ $prioridadeClasses[$chamado->prioridade] ?? 'pf-badge-gray' }}">{{ $chamado->prioridade }}</span></td>
                                <td>{{ optional($chamado->created_at)->format('d \d\e F') }}</td>
                                <td>
                                    <div class="flex flex-wrap gap-2">
                                        <button class="pf-btn pf-btn-secondary !min-h-9 !px-4" wire:click="show({{ $chamado->id }})">Ver</button>
                                        <button class="pf-btn pf-btn-secondary !min-h-9 !px-4" wire:click="edit({{ $chamado->id }})">Editar</button>
                                        <button class="pf-btn !min-h-9 !px-4 bg-red-900/80 text-white" wire:click="delete({{ $chamado->id }})" wire:confirm="Tem certeza que deseja excluir este chamado?">Excluir</button>
                                    </div>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="7" class="text-center text-white/55">Nenhum chamado encontrado.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>

            <div class="mt-4">{{ $chamados->links() }}</div>
        </section>

        <aside class="pf-panel pf-filter-card">
            <div class="pf-filter-title">Filtros Avançados</div>
            <div class="grid gap-4">
                <div>
                    <label class="pf-label">Local</label>
                    <input wire:model.live="search" class="pf-input" placeholder="Bloco ou sala" />
                </div>
                <div>
                    <label class="pf-label">Tipo Manutenção</label>
                    <select class="pf-select" disabled>
                        <option>Todos</option>
                    </select>
                </div>
                <div>
                    <label class="pf-label">Prioridade</label>
                    <select wire:model.live="prioridade" class="pf-select">
                        <option value="">Todas</option>
                        <option value="Baixa">Baixa</option>
                        <option value="Média">Média</option>
                        <option value="Alta">Alta</option>
                        <option value="Urgente">Urgente</option>
                    </select>
                </div>
                <div>
                    <label class="pf-label">Status</label>
                    <select wire:model.live="status" class="pf-select">
                        <option value="">Todos</option>
                        <option value="Aberto">Aberto</option>
                        <option value="Em Análise">Em Análise</option>
                        <option value="Fechado">Fechado</option>
                    </select>
                </div>
            </div>
            <button class="pf-btn pf-btn-primary mt-auto self-end">Aplicar Filtros</button>
        </aside>
    </div>

    @if ($showModal)
        <div class="pf-modal-backdrop" wire:click.self="$set('showModal', false)">
            <div class="pf-modal">
                <div class="mb-5 flex items-center justify-between">
                    <h3 class="font-heading text-2xl font-bold text-white">{{ $isEdit ? 'Editar Chamado' : 'Novo Chamado' }}</h3>
                    <button class="pf-btn pf-btn-secondary !min-h-9 !px-4" type="button" wire:click="$set('showModal', false)">Fechar</button>
                </div>

                <form wire:submit="save" class="grid gap-4">
                    <div>
                        <label class="pf-label">Título</label>
                        <input class="pf-input" wire:model="titulo" required />
                    </div>
                    <div>
                        <label class="pf-label">Atendente</label>
                        <select class="pf-select" wire:model="id_atendente">
                            <option value="">Sem atendente</option>
                            @foreach ($atendentes as $atendente)
                                <option value="{{ $atendente->id }}">{{ $atendente->nome }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div>
                        <label class="pf-label">Local</label>
                        <input class="pf-input" wire:model="local" required />
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
                                <option value="Aberto">Aberto</option>
                                <option value="Em Análise">Em Análise</option>
                                <option value="Fechado">Fechado</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label class="pf-label">Descrição</label>
                        <textarea class="pf-textarea" rows="4" wire:model="descricao"></textarea>
                    </div>
                    <div class="flex justify-end gap-2">
                        <button type="button" class="pf-btn pf-btn-secondary" wire:click="$set('showModal', false)">Cancelar</button>
                        <button type="submit" class="pf-btn pf-btn-primary">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    @endif

    @if ($showDetailModal && $selectedChamado)
        <div class="pf-modal-backdrop" wire:click.self="$set('showDetailModal', false)">
            <div class="pf-modal">
                <div class="mb-5 flex items-center justify-between">
                    <h3 class="font-heading text-2xl font-bold text-white">Detalhes do Chamado</h3>
                    <button class="pf-btn pf-btn-secondary !min-h-9 !px-4" type="button" wire:click="$set('showDetailModal', false)">Fechar</button>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                    <div>
                        <div class="pf-helper">Título</div>
                        <div class="mt-2 text-lg font-semibold text-white">{{ $selectedChamado->titulo }}</div>
                    </div>
                    <div>
                        <div class="pf-helper">Solicitante</div>
                        <div class="mt-2 text-white">{{ $selectedChamado->usuario?->nome ?? '-' }}</div>
                    </div>
                    <div>
                        <div class="pf-helper">Atendente</div>
                        <div class="mt-2 text-white">{{ $selectedChamado->atendente?->nome ?? '-' }}</div>
                    </div>
                    <div>
                        <div class="pf-helper">Local</div>
                        <div class="mt-2 text-white">{{ $selectedChamado->local }}</div>
                    </div>
                    <div>
                        <div class="pf-helper">Prioridade</div>
                        <div class="mt-2"><span class="pf-badge {{ $prioridadeClasses[$selectedChamado->prioridade] ?? 'pf-badge-gray' }}">{{ $selectedChamado->prioridade }}</span></div>
                    </div>
                    <div>
                        <div class="pf-helper">Status</div>
                        <div class="mt-2"><span class="pf-badge {{ $statusClasses[$selectedChamado->status] ?? 'pf-badge-gray' }}">{{ $selectedChamado->status }}</span></div>
                    </div>
                </div>
                @if ($selectedChamado->descricao)
                    <div class="mt-5">
                        <div class="pf-helper">Descrição</div>
                        <p class="mt-2 leading-7 text-white/75">{{ $selectedChamado->descricao }}</p>
                    </div>
                @endif
            </div>
        </div>
    @endif
</div>
