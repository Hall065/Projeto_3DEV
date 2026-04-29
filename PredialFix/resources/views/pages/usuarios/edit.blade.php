<x-layouts::app :title="__('Editar Usuário')">
    <div class="flex h-full w-full flex-1 flex-col gap-4 rounded-xl p-6">
        <div class="flex items-center justify-between">
            <flux:heading size="xl">Editar Usuário</flux:heading>
            <flux:link href="{{ route('usuarios.index') }}">Voltar</flux:link>
        </div>

        <form action="{{ route('usuarios.update', $usuario) }}" method="POST" class="space-y-4">
            @csrf
            @method('PUT')
            <flux:input label="Nome" name="nome" value="{{ old('nome', $usuario->nome) }}" required />
            <flux:input label="Email" type="email" name="email" value="{{ old('email', $usuario->email) }}" required />
            <flux:input label="CPF" name="cpf" value="{{ old('cpf', $usuario->cpf) }}" required />
            <flux:select label="Perfil de Acesso" name="perfil_acesso" required>
                <option value="">Selecione</option>
                <option value="cliente" {{ old('perfil_acesso', $usuario->perfil_acesso) == 'cliente' ? 'selected' : '' }}>Cliente</option>
                <option value="admin" {{ old('perfil_acesso', $usuario->perfil_acesso) == 'admin' ? 'selected' : '' }}>Admin</option>
                <option value="atendente" {{ old('perfil_acesso', $usuario->perfil_acesso) == 'atendente' ? 'selected' : '' }}>Atendente</option>
                <option value="gerente" {{ old('perfil_acesso', $usuario->perfil_acesso) == 'gerente' ? 'selected' : '' }}>Gerente</option>
                <option value="manutencao" {{ old('perfil_acesso', $usuario->perfil_acesso) == 'manutencao' ? 'selected' : '' }}>Manutenção</option>
                <option value="financeiro" {{ old('perfil_acesso', $usuario->perfil_acesso) == 'financeiro' ? 'selected' : '' }}>Financeiro</option>
            </flux:select>
            <flux:checkbox label="Ativo" name="ativo" value="1" {{ old('ativo', $usuario->ativo) ? 'checked' : '' }} />
            <flux:button type="submit" variant="primary">Atualizar</flux:button>
        </form>
    </div>
</x-layouts::app>