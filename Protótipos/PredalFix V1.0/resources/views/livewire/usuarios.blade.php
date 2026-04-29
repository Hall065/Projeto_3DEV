<div>
    @if (session('message'))
        <div class="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {{ session('message') }}
        </div>
    @endif

    @php
        $perfilClasses = [
            'cliente' => 'pf-badge-blue',
            'admin' => 'pf-badge-red',
            'atendente' => 'pf-badge-green',
            'gerente' => 'pf-badge-gold',
            'manutencao' => 'pf-badge-gold',
            'financeiro' => 'pf-badge-gray',
        ];
    @endphp

    <section class="pf-panel p-4 sm:p-6">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap gap-3">
                <input wire:model.live="search" class="pf-input min-w-[220px]" placeholder="Buscar por nome, e-mail ou CPF..." />
                <select wire:model.live="perfilAcesso" class="pf-select min-w-[180px]">
                    <option value="">Todos os perfis</option>
                    <option value="cliente">Cliente</option>
                    <option value="admin">Admin</option>
                    <option value="atendente">Atendente</option>
                    <option value="gerente">Gerente</option>
                    <option value="manutencao">Manutenção</option>
                    <option value="financeiro">Financeiro</option>
                </select>
                <select wire:model.live="status" class="pf-select min-w-[160px]">
                    <option value="">Todos</option>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                </select>
            </div>
            <button type="button" class="pf-btn pf-btn-primary" wire:click="create">Novo Usuário</button>
        </div>

        <div class="pf-table-wrap">
            <table class="pf-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>CPF</th>
                        <th>Perfil</th>
                        <th>Status</th>
                        <th>Criado em</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($usuarios as $usuario)
                        <tr wire:key="usuario-{{ $usuario->id }}">
                            <td>#{{ str_pad((string) $usuario->id, 3, '0', STR_PAD_LEFT) }}</td>
                            <td>{{ $usuario->nome }}</td>
                            <td>{{ $usuario->email }}</td>
                            <td>{{ $usuario->cpf }}</td>
                            <td><span class="pf-badge {{ $perfilClasses[$usuario->perfil_acesso] ?? 'pf-badge-gray' }}">{{ ucfirst($usuario->perfil_acesso) }}</span></td>
                            <td><span class="pf-badge {{ $usuario->ativo ? 'pf-badge-green' : 'pf-badge-red' }}">{{ $usuario->ativo ? 'Ativo' : 'Inativo' }}</span></td>
                            <td>{{ optional($usuario->created_at)->format('d/m/Y') }}</td>
                            <td>
                                <div class="flex flex-wrap gap-2">
                                    <button class="pf-btn pf-btn-secondary !min-h-9 !px-4" wire:click="edit({{ $usuario->id }})">Editar</button>
                                    <button class="pf-btn pf-btn-secondary !min-h-9 !px-4" wire:click="resetPasswordModal({{ $usuario->id }})">Senha</button>
                                    <button class="pf-btn !min-h-9 !px-4 bg-red-900/80 text-white" wire:click="delete({{ $usuario->id }})" wire:confirm="Tem certeza que deseja desativar este usuário?">Desativar</button>
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="8" class="text-center text-white/55">Nenhum usuário encontrado.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <div class="mt-4">{{ $usuarios->links() }}</div>
    </section>

    @if ($showModal)
        <div class="pf-modal-backdrop" wire:click.self="$set('showModal', false)">
            <div class="pf-modal">
                <div class="mb-5 flex items-center justify-between">
                    <h3 class="font-heading text-2xl font-bold text-white">{{ $isEdit ? 'Editar Usuário' : 'Novo Usuário' }}</h3>
                    <button class="pf-btn pf-btn-secondary !min-h-9 !px-4" type="button" wire:click="$set('showModal', false)">Fechar</button>
                </div>
                <form wire:submit="save" class="grid gap-4">
                    <div>
                        <label class="pf-label">Nome</label>
                        <input class="pf-input" wire:model="nome" required />
                    </div>
                    <div>
                        <label class="pf-label">Email</label>
                        <input class="pf-input" type="email" wire:model="email" required />
                    </div>
                    <div>
                        <label class="pf-label">CPF</label>
                        <input class="pf-input" wire:model="cpf" required />
                    </div>
                    @if (! $isEdit)
                        <div>
                            <label class="pf-label">Senha</label>
                            <input class="pf-input" type="password" wire:model="password" required />
                        </div>
                    @endif
                    <div>
                        <label class="pf-label">Perfil de Acesso</label>
                        <select class="pf-select" wire:model="perfil_acesso" required>
                            <option value="">Selecione</option>
                            <option value="cliente">Cliente</option>
                            <option value="admin">Admin</option>
                            <option value="atendente">Atendente</option>
                            <option value="gerente">Gerente</option>
                            <option value="manutencao">Manutenção</option>
                            <option value="financeiro">Financeiro</option>
                        </select>
                    </div>
                    @if ($isEdit)
                        <label class="inline-flex items-center gap-2 text-white/75">
                            <input type="checkbox" wire:model="ativo" class="rounded border-white/20 bg-white/10" />
                            <span>Usuário ativo</span>
                        </label>
                    @endif
                    <div class="flex justify-end gap-2">
                        <button type="button" class="pf-btn pf-btn-secondary" wire:click="$set('showModal', false)">Cancelar</button>
                        <button type="submit" class="pf-btn pf-btn-primary">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    @endif

    @if ($showResetPasswordModal)
        <div class="pf-modal-backdrop" wire:click.self="$set('showResetPasswordModal', false)">
            <div class="pf-modal">
                <div class="mb-5 flex items-center justify-between">
                    <h3 class="font-heading text-2xl font-bold text-white">Redefinir Senha</h3>
                    <button class="pf-btn pf-btn-secondary !min-h-9 !px-4" type="button" wire:click="$set('showResetPasswordModal', false)">Fechar</button>
                </div>
                <form wire:submit="resetPassword" class="grid gap-4">
                    <div>
                        <label class="pf-label">Nova Senha</label>
                        <input class="pf-input" type="password" wire:model="newPassword" required />
                    </div>
                    <div class="flex justify-end gap-2">
                        <button type="button" class="pf-btn pf-btn-secondary" wire:click="$set('showResetPasswordModal', false)">Cancelar</button>
                        <button type="submit" class="pf-btn pf-btn-primary">Redefinir</button>
                    </div>
                </form>
            </div>
        </div>
    @endif
</div>
