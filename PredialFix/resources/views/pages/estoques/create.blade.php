<x-layouts::app :title="__('Criar Item de Estoque')">
    <div class="flex h-full w-full flex-1 flex-col gap-4 rounded-xl p-6">
        <div class="flex items-center justify-between">
            <flux:heading size="xl">Criar Item de Estoque</flux:heading>
            <flux:link href="{{ route('estoques.index') }}">Voltar</flux:link>
        </div>

        <form action="{{ route('estoques.store') }}" method="POST" class="space-y-4">
            @csrf
            <flux:input label="Nome" name="nome" value="{{ old('nome') }}" required />
            <flux:input label="Categoria" name="categoria" value="{{ old('categoria') }}" required />
            <flux:input label="Localização" name="localizacao" value="{{ old('localizacao') }}" required />
            <flux:input label="Quantidade" type="number" name="quantidade" value="{{ old('quantidade', 0) }}" required />
            <flux:button type="submit" variant="primary">Criar</flux:button>
        </form>
    </div>
</x-layouts::app>