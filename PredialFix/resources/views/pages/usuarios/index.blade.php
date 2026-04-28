<x-layouts::app :title="__('Usuários')">
    <div class="flex h-full w-full flex-1 flex-col gap-4 rounded-xl p-6">
        <div class="flex items-center justify-between">
            <flux:heading size="xl">Usuários</flux:heading>
        </div>
        <livewire:usuarios />
    </div>
</x-layouts::app>
