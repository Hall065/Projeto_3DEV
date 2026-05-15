<x-layouts::app :title="__('Criar Usuário')">
    <div class="flex h-full w-full flex-1 flex-col gap-4 rounded-xl p-6">
        <div class="flex items-center justify-between">
            <flux:heading size="xl">Criar Usuário</flux:heading>
            <flux:link href="{{ route('usuarios.index') }}">Voltar</flux:link>
        </div>

        <form action="{{ route('usuarios.store') }}" method="POST" class="space-y-4">
            @csrf
            <flux:input label="Nome" name="nome" value="{{ old('nome') }}" required />
            <flux:input label="Email" type="email" name="email" value="{{ old('email') }}" required />
            <flux:input label="CPF" name="cpf" value="{{ old('cpf') }}" required />
            <flux:input label="Senha" type="password" name="password" required />
            <flux:select label="Perfil de Acesso" name="perfil_acesso" required>
                <option value="">Selecione</option>
                <option value="cliente" {{ old('perfil_acesso') == 'cliente' ? 'selected' : '' }}>Cliente</option>
                <option value="admin" {{ old('perfil_acesso') == 'admin' ? 'selected' : '' }}>Admin</option>
                <option value="atendente" {{ old('perfil_acesso') == 'atendente' ? 'selected' : '' }}>Atendente</option>
                <option value="gerente" {{ old('perfil_acesso') == 'gerente' ? 'selected' : '' }}>Gerente</option>
                <option value="manutencao" {{ old('perfil_acesso') == 'manutencao' ? 'selected' : '' }}>Manutenção</option>
                <option value="financeiro" {{ old('perfil_acesso') == 'financeiro' ? 'selected' : '' }}>Financeiro</option>
            </flux:select>
            <flux:checkbox label="Ativo" name="ativo" value="1" {{ old('ativo', true) ? 'checked' : '' }} />
            <flux:button type="submit" variant="primary">Criar</flux:button>
        </form>
    </div>
</x-layouts::app>