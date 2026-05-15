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
                placeholder="Buscar por nome, email ou CPF..."
                icon="magnifying-glass"
            />
            <flux:select wire:model.live="perfilAcesso" placeholder="Perfil de Acesso">
                <option value="">Todos</option>
                <option value="cliente">Cliente</option>
                <option value="admin">Admin</option>
                <option value="atendente">Atendente</option>
                <option value="gerente">Gerente</option>
                <option value="manutencao">Manutenção</option>
                <option value="financeiro">Financeiro</option>
            </flux:select>
            <flux:select wire:model.live="status" placeholder="Status">
                <option value="">Todos</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
            </flux:select>
        </div>
        <flux:button variant="primary" wire:click="create">
            Novo Usuário
        </flux:button>
    </div>

    <div class="overflow-x-auto">
        <flux:table>
            <flux:table.columns>
                <flux:table.column>#</flux:table.column>
                <flux:table.column>Nome</flux:table.column>
                <flux:table.column>Email</flux:table.column>
                <flux:table.column>CPF</flux:table.column>
                <flux:table.column>Perfil de Acesso</flux:table.column>
                <flux:table.column>Status</flux:table.column>
                <flux:table.column>Criado em</flux:table.column>
                <flux:table.column>Ações</flux:table.column>
            </flux:table.columns>
            <flux:table.rows>
                @foreach ($usuarios as $usuario)
                    <flux:table.row :key="$usuario->id">
                        <flux:table.cell>{{ $usuario->id }}</flux:table.cell>
                        <flux:table.cell>{{ $usuario->nome }}</flux:table.cell>
                        <flux:table.cell>{{ $usuario->email }}</flux:table.cell>
                        <flux:table.cell>{{ $usuario->cpf }}</flux:table.cell>
                        <flux:table.cell>
                            @php
                                $perfilColors = [
                                    'cliente' => 'blue',
                                    'admin' => 'red',
                                    'atendente' => 'green',
                                    'gerente' => 'purple',
                                    'manutencao' => 'yellow',
                                    'financeiro' => 'orange',
                                ];
                            @endphp
                            <flux:badge variant="solid" :color="$perfilColors[$usuario->perfil_acesso] ?? 'gray'">
                                {{ ucfirst($usuario->perfil_acesso) }}
                            </flux:badge>
                        </flux:table.cell>
                        <flux:table.cell>
                            <flux:badge variant="solid" :color="$usuario->ativo ? 'green' : 'red'">
                                {{ $usuario->ativo ? 'Ativo' : 'Inativo' }}
                            </flux:badge>
                        </flux:table.cell>
                        <flux:table.cell>{{ $usuario->created_at->format('d/m/Y H:i') }}</flux:table.cell>
                        <flux:table.cell>
                            <div class="flex items-center gap-2">
                                <flux:button size="sm" wire:click="edit({{ $usuario->id }})">Editar</flux:button>
                                <flux:button size="sm" variant="outline" wire:click="resetPasswordModal({{ $usuario->id }})">Redefinir Senha</flux:button>
                                <flux:button size="sm" variant="danger" wire:click="delete({{ $usuario->id }})" wire:confirm="Tem certeza que deseja desativar este usuário?">Desativar</flux:button>
                            </div>
                        </flux:table.cell>
                    </flux:table.row>
                @endforeach
            </flux:table.rows>
        </flux:table>
    </div>

    <div class="mt-4">
        {{ $usuarios->links() }}
    </div>

    <flux:modal wire:model="showModal" :title="$isEdit ? 'Editar Usuário' : 'Novo Usuário'">
        <form wire:submit="save" class="space-y-4">
            <flux:input label="Nome" wire:model="nome" required />
            <flux:input label="Email" type="email" wire:model="email" required />
            <flux:input label="CPF" wire:model="cpf" required />
            @if (!$isEdit)
                <flux:input label="Senha" type="password" wire:model="password" required />
            @endif
            <flux:select label="Perfil de Acesso" wire:model="perfil_acesso" required>
                <option value="">Selecione</option>
                <option value="cliente">Cliente</option>
                <option value="admin">Admin</option>
                <option value="atendente">Atendente</option>
                <option value="gerente">Gerente</option>
                <option value="manutencao">Manutenção</option>
                <option value="financeiro">Financeiro</option>
            </flux:select>
            @if ($isEdit)
                <flux:checkbox label="Ativo" wire:model="ativo" />
            @endif
            <div class="flex justify-end gap-2">
                <flux:button type="button" wire:click="$set('showModal', false)">Cancelar</flux:button>
                <flux:button type="submit" variant="primary">Salvar</flux:button>
            </div>
        </form>
    </flux:modal>

    <flux:modal wire:model="showResetPasswordModal" title="Redefinir Senha">
        <form wire:submit="resetPassword" class="space-y-4">
            <flux:input label="Nova Senha" type="password" wire:model="newPassword" required />
            <div class="flex justify-end gap-2">
                <flux:button type="button" wire:click="$set('showResetPasswordModal', false)">Cancelar</flux:button>
                <flux:button type="submit" variant="primary">Redefinir</flux:button>
            </div>
        </form>
    </flux:modal>
</div>
