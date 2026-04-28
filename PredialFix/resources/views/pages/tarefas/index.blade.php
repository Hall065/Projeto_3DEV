<x-layouts::app :title="__('Tarefas')">
    <div class="flex h-full w-full flex-1 flex-col gap-4 rounded-xl p-6">
        <div class="flex items-center justify-between">
            <flux:heading size="xl">Tarefas</flux:heading>
        </div>
        <livewire:tarefas />
    </div>
</x-layouts::app>
