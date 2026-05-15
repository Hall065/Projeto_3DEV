<div>
    @if (session('message'))
        <div class="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {{ session('message') }}
        </div>
    @endif

    @php
        $statusClasses = [
            'Disponível' => 'pf-badge-green',
            'Estoque Baixo' => 'pf-badge-gold',
            'Esgotado' => 'pf-badge-red',
        ];
        $totalItens = $estoques->sum('quantidade');
    @endphp

    <div class="pf-grid" style="grid-template-columns: minmax(0, 1fr) 220px;">
        <section class="pf-grid">
            <div class="pf-grid pf-grid-3">
                <article class="pf-panel pf-stat-card">
                    <div class="pf-stat-label">Total Itens</div>
                    <div class="pf-stat-value">{{ number_format($totalItens, 0, ',', '.') }}</div>
                </article>
                <article class="pf-panel pf-stat-card">
                    <div class="pf-stat-label">Produtos Pendentes</div>
                    <div class="pf-stat-value">{{ $estoques->where('status', '!=', 'Disponível')->count() }} itens</div>
                </article>
                <article class="pf-panel pf-stat-card">
                    <div class="pf-stat-label">Valor Total</div>
                    <div class="pf-stat-value">R$ {{ number_format($totalItens * 8.35, 0, ',', '.') }}</div>
                </article>
            </div>

            <section class="pf-panel p-4 sm:p-6">
                <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div class="flex flex-wrap gap-3">
                        <input wire:model.live="search" class="pf-input min-w-[220px]" placeholder="Buscar item ou localização..." />
                        <button type="button" class="pf-btn pf-btn-primary" wire:click="create">Novo Item</button>
                    </div>
                </div>

                <div class="pf-table-wrap">
                    <table class="pf-table">
                        <thead>
                            <tr>
                                <th>Nº</th>
                                <th>Nome Item</th>
                                <th>Categoria</th>
                                <th>Localização</th>
                                <th>Qtd.</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse ($estoques as $estoque)
                                <tr wire:key="estoque-{{ $estoque->id }}">
                                    <td>#{{ str_pad((string) $estoque->id, 3, '0', STR_PAD_LEFT) }}</td>
                                    <td>{{ $estoque->nome }}</td>
                                    <td>{{ $estoque->categoria }}</td>
                                    <td>{{ $estoque->localizacao }}</td>
                                    <td>{{ $estoque->quantidade }}</td>
                                    <td><span class="pf-badge {{ $statusClasses[$estoque->status] ?? 'pf-badge-gray' }}">{{ $estoque->status === 'Estoque Baixo' ? 'Baixo' : $estoque->status }}</span></td>
                                    <td>
                                        <div class="flex flex-wrap gap-2">
                                            <button class="pf-btn pf-btn-secondary !min-h-9 !px-4" wire:click="edit({{ $estoque->id }})">Editar</button>
                                            <button class="pf-btn !min-h-9 !px-4 bg-red-900/80 text-white" wire:click="delete({{ $estoque->id }})" wire:confirm="Tem certeza que deseja excluir este item?">Excluir</button>
                                        </div>
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="7" class="text-center text-white/55">Nenhum item encontrado.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>

                <div class="mt-4">{{ $estoques->links() }}</div>
            </section>
        </section>

        <aside class="pf-panel pf-filter-card">
            <div class="pf-filter-title">Filtros Avançados</div>
            <div class="grid gap-4">
                <div>
                    <label class="pf-label">Categoria</label>
                    <select wire:model.live="categoria" class="pf-select">
                        <option value="">Todas</option>
                        @foreach ($categorias as $cat)
                            <option value="{{ $cat }}">{{ $cat }}</option>
                        @endforeach
                    </select>
                </div>
                <div>
                    <label class="pf-label">Localização</label>
                    <input wire:model.live="search" class="pf-input" placeholder="Almoxarifado" />
                </div>
                <div>
                    <label class="pf-label">Status</label>
                    <select wire:model.live="status" class="pf-select">
                        <option value="">Todos</option>
                        <option value="Disponível">Disponível</option>
                        <option value="Estoque Baixo">Estoque Baixo</option>
                        <option value="Esgotado">Esgotado</option>
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
                    <h3 class="font-heading text-2xl font-bold text-white">{{ $isEdit ? 'Editar Item' : 'Novo Item' }}</h3>
                    <button class="pf-btn pf-btn-secondary !min-h-9 !px-4" type="button" wire:click="$set('showModal', false)">Fechar</button>
                </div>
                <form wire:submit="save" class="grid gap-4">
                    <div>
                        <label class="pf-label">Nome</label>
                        <input class="pf-input" wire:model="nome" required />
                    </div>
                    <div>
                        <label class="pf-label">Categoria</label>
                        <input class="pf-input" wire:model="categoria_item" required />
                    </div>
                    <div>
                        <label class="pf-label">Localização</label>
                        <input class="pf-input" wire:model="localizacao" required />
                    </div>
                    <div>
                        <label class="pf-label">Quantidade</label>
                        <input class="pf-input" type="number" min="0" wire:model="quantidade" required />
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
