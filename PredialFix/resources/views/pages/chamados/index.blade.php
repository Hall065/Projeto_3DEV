<x-layouts::app :title="__('Chamados')">
    <div class="flex h-full w-full flex-1 flex-col gap-4 rounded-xl p-6">
        <div class="flex items-center justify-between">
            <flux:heading size="xl">Chamados</flux:heading>
        </div>
        <livewire:chamados />
    </div>
</x-layouts::app>
