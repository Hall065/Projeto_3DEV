<?php

namespace App\Livewire;

use App\Models\Chamado;
use App\Models\Estoque;
use App\Models\Tarefa;
use App\Models\Usuario;
use Livewire\Component;

class Dashboard extends Component
{
    public function render()
    {
        $chamadosAbertos = Chamado::where('status', 'Aberto')->count();
        $chamadosUrgentes = Chamado::where('prioridade', 'Urgente')->count();
        $tarefasPendentes = Tarefa::where('status', 'Pendente')->count();
        $itensEstoqueBaixo = Estoque::whereIn('status', ['Estoque Baixo', 'Esgotado'])->count();
        $usuariosAtivos = Usuario::where('ativo', true)->count();
        $tarefasVencidas = Tarefa::where('status', '!=', 'Concluído')
            ->where('data_final', '<', now())
            ->count();

        $ultimosChamados = Chamado::with(['usuario', 'atendente'])
            ->where('status', 'Aberto')
            ->orderBy('prioridade', 'desc')
            ->take(5)
            ->get();

        $ultimasTarefas = Tarefa::with('responsavel')
            ->where('status', '!=', 'Concluído')
            ->orderBy('data_final', 'asc')
            ->take(5)
            ->get();

        $topEstoqueBaixo = Estoque::orderBy('quantidade', 'asc')
            ->take(5)
            ->get();

        $ultimosUsuarios = Usuario::orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        $chamadosPorStatus = Chamado::selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $tarefasPorPrioridade = Tarefa::selectRaw('prioridade, count(*) as total')
            ->groupBy('prioridade')
            ->pluck('total', 'prioridade')
            ->toArray();

        $chamadosUltimos7Dias = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $chamadosUltimos7Dias[$date] = Chamado::whereDate('created_at', $date)->count();
        }

        return view('livewire.dashboard', compact(
            'chamadosAbertos',
            'chamadosUrgentes',
            'tarefasPendentes',
            'itensEstoqueBaixo',
            'usuariosAtivos',
            'tarefasVencidas',
            'ultimosChamados',
            'ultimasTarefas',
            'topEstoqueBaixo',
            'ultimosUsuarios',
            'chamadosPorStatus',
            'tarefasPorPrioridade',
            'chamadosUltimos7Dias'
        ));
    }
}
