<div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
            <div class="flex items-center justify-between">
                <div>
                    <flux:text class="text-sm text-gray-500 dark:text-gray-400">🎫 Chamados Abertos</flux:text>
                    <flux:heading size="2xl">{{ $chamadosAbertos }}</flux:heading>
                </div>
                <div class="text-blue-500 text-4xl">🎫</div>
            </div>
        </div>
        <div class="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
            <div class="flex items-center justify-between">
                <div>
                    <flux:text class="text-sm text-gray-500 dark:text-gray-400">⚠️ Chamados Urgentes</flux:text>
                    <flux:heading size="2xl">{{ $chamadosUrgentes }}</flux:heading>
                </div>
                <div class="text-red-500 text-4xl">⚠️</div>
            </div>
        </div>
        <div class="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
            <div class="flex items-center justify-between">
                <div>
                    <flux:text class="text-sm text-gray-500 dark:text-gray-400">✅ Tarefas Pendentes</flux:text>
                    <flux:heading size="2xl">{{ $tarefasPendentes }}</flux:heading>
                </div>
                <div class="text-green-500 text-4xl">✅</div>
            </div>
        </div>
        <div class="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
            <div class="flex items-center justify-between">
                <div>
                    <flux:text class="text-sm text-gray-500 dark:text-gray-400">📦 Itens em Estoque Baixo</flux:text>
                    <flux:heading size="2xl">{{ $itensEstoqueBaixo }}</flux:heading>
                </div>
                <div class="text-yellow-500 text-4xl">📦</div>
            </div>
        </div>
        <div class="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
            <div class="flex items-center justify-between">
                <div>
                    <flux:text class="text-sm text-gray-500 dark:text-gray-400">👤 Usuários Ativos</flux:text>
                    <flux:heading size="2xl">{{ $usuariosAtivos }}</flux:heading>
                </div>
                <div class="text-blue-500 text-4xl">👤</div>
            </div>
        </div>
        <div class="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
            <div class="flex items-center justify-between">
                <div>
                    <flux:text class="text-sm text-gray-500 dark:text-gray-400">🔴 Tarefas Vencidas</flux:text>
                    <flux:heading size="2xl">{{ $tarefasVencidas }}</flux:heading>
                </div>
                <div class="text-red-500 text-4xl">🔴</div>
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
            <flux:heading size="lg">Últimos 5 Chamados Abertos (Prioridade Alta)</flux:heading>
            <div class="mt-4 space-y-3">
                @foreach ($ultimosChamados as $chamado)
                    <div class="p-4 bg-gray-50 dark:bg-zinc-700 rounded-lg">
                        <div class="flex justify-between items-start">
                            <div>
                                <flux:text class="font-medium">{{ $chamado->titulo }}</flux:text>
                                <flux:text class="text-sm text-gray-500">{{ $chamado->usuario?->nome ?? '-' }} • {{ $chamado->local }}</flux:text>
                            </div>
                            <div>
                                @php
                                    $prioridadeColors = [
                                        'Baixa' => 'green',
                                        'Média' => 'yellow',
                                        'Alta' => 'orange',
                                        'Urgente' => 'red',
                                    ];
                                @endphp
                                <flux:badge variant="solid" :color="$prioridadeColors[$chamado->prioridade] ?? 'gray'">
                                    {{ $chamado->prioridade }}
                                </flux:badge>
                            </div>
                        </div>
                    </div>
                @endforeach
            </div>
        </div>
        <div class="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
            <flux:heading size="lg">Últimas 5 Tarefas (Prazo Mais Próximo)</flux:heading>
            <div class="mt-4 space-y-3">
                @foreach ($ultimasTarefas as $tarefa)
                    <div class="p-4 bg-gray-50 dark:bg-zinc-700 rounded-lg {{ $tarefa->esta_vencida ? 'border-l-4 border-red-500' : '' }}">
                        <div class="flex justify-between items-start">
                            <div>
                                <flux:text class="font-medium">{{ $tarefa->titulo }}</flux:text>
                                <flux:text class="text-sm text-gray-500">{{ $tarefa->responsavel?->nome ?? '-' }} • {{ $tarefa->data_final->format('d/m/Y') }}</flux:text>
                            </div>
                            <div>
                                @php
                                    $statusColors = [
                                        'Pendente' => 'gray',
                                        'Em Andamento' => 'blue',
                                        'Concluído' => 'green',
                                    ];
                                @endphp
                                <flux:badge variant="solid" :color="$statusColors[$tarefa->status] ?? 'gray'">
                                    {{ $tarefa->status }}
                                </flux:badge>
                            </div>
                        </div>
                    </div>
                @endforeach
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
            <flux:heading size="lg">Top 5 Itens de Estoque (Menor Quantidade)</flux:heading>
            <div class="mt-4 space-y-3">
                @foreach ($topEstoqueBaixo as $item)
                    <div class="p-4 bg-gray-50 dark:bg-zinc-700 rounded-lg">
                        <div class="flex justify-between items-start">
                            <div>
                                <flux:text class="font-medium">{{ $item->nome }}</flux:text>
                                <flux:text class="text-sm text-gray-500">{{ $item->categoria }} • {{ $item->localizacao }}</flux:text>
                            </div>
                            <div>
                                <flux:badge variant="solid" :color="$item->status === 'Disponível' ? 'green' : ($item->status === 'Estoque Baixo' ? 'yellow' : 'red')">
                                    {{ $item->quantidade }} unidades
                                </flux:badge>
                            </div>
                        </div>
                    </div>
                @endforeach
            </div>
        </div>
        <div class="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
            <flux:heading size="lg">Últimos 5 Usuários Cadastrados</flux:heading>
            <div class="mt-4 space-y-3">
                @foreach ($ultimosUsuarios as $usuario)
                    <div class="p-4 bg-gray-50 dark:bg-zinc-700 rounded-lg">
                        <div class="flex justify-between items-start">
                            <div>
                                <flux:text class="font-medium">{{ $usuario->nome }}</flux:text>
                                <flux:text class="text-sm text-gray-500">{{ $usuario->email }} • {{ $usuario->cpf }}</flux:text>
                            </div>
                            <div>
                                <flux:badge variant="solid" :color="$usuario->ativo ? 'green' : 'red'">
                                    {{ $usuario->ativo ? 'Ativo' : 'Inativo' }}
                                </flux:badge>
                            </div>
                        </div>
                    </div>
                @endforeach
            </div>
        </div>
    </div>
</div>
