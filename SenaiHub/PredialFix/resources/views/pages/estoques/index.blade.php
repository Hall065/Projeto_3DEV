<x-layouts::app :title="__('Estoque')">
    <div class="flex h-full w-full flex-1 flex-col gap-4 rounded-xl p-6">
        <div class="flex items-center justify-between">
            <flux:heading size="xl">Estoque</flux:heading>
        </div>
        <livewire:estoques />
    </div>
</x-layouts::app>
