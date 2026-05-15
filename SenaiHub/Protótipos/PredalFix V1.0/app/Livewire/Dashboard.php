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

        $chamadosUltimosMeses = collect(['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jul'])
            ->mapWithKeys(function ($month, $index) {
                return [$month => max(1, Chamado::count() + ($index * 2) - (int) ($index === 2))];
            })
            ->toArray();

        $agendaHoje = [
            ['hora' => '10:00', 'titulo' => 'Inspeção elétrica', 'local' => 'Sala 20'],
            ['hora' => '12:00', 'titulo' => 'Inspeção Mecânica', 'local' => 'Sala 20'],
            ['hora' => '14:00', 'titulo' => 'Troca Lâmpada', 'local' => 'Sala 20'],
            ['hora' => '16:00', 'titulo' => 'Conserto Janela', 'local' => 'Sala 20'],
        ];

        $tiposManutencao = [
            'Corretivo' => max(1, Chamado::where('status', 'Aberto')->count()),
            'Preventivo' => max(1, Tarefa::where('status', 'Em Andamento')->count()),
            'Preditivo' => max(1, Tarefa::where('status', 'Concluído')->count()),
        ];

        $ultimosChamadosPainel = Chamado::latest()->take(3)->get();

        if ($ultimosChamadosPainel->isEmpty()) {
            $ultimosChamadosPainel = collect();
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
            'chamadosUltimosMeses',
            'agendaHoje',
            'tiposManutencao',
            'ultimosChamadosPainel',
        ));
    }
}
