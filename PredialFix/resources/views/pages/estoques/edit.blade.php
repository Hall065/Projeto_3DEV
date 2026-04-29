<x-layouts::app :title="__('Editar Item de Estoque')">
    <div class="flex h-full w-full flex-1 flex-col gap-4 rounded-xl p-6">
        <div class="flex items-center justify-between">
            <flux:heading size="xl">Editar Item de Estoque</flux:heading>
            <flux:link href="{{ route('estoques.index') }}">Voltar</flux:link>
        </div>

        <form action="{{ route('estoques.update', $estoque) }}" method="POST" class="space-y-4">
            @csrf
            @method('PUT')
            <flux:input label="Nome" name="nome" value="{{ old('nome', $estoque->nome) }}" required />
            <flux:input label="Categoria" name="categoria" value="{{ old('categoria', $estoque->categoria) }}" required />
            <flux:input label="Localização" name="localizacao" value="{{ old('localizacao', $estoque->localizacao) }}" required />
            <flux:input label="Quantidade" type="number" name="quantidade" value="{{ old('quantidade', $estoque->quantidade) }}" required />
            <flux:button type="submit" variant="primary">Atualizar</flux:button>
        </form>
    </div>
</x-layouts::app>