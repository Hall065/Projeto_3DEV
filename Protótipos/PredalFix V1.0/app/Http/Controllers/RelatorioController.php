<?php

namespace App\Http\Controllers;

use App\Models\Chamado;
use App\Models\Estoque;
use App\Models\Tarefa;
use Illuminate\View\View;

class RelatorioController extends Controller
{
    public function index(): View
    {
        $totalRelatorios = Chamado::count() + Tarefa::count() + Estoque::count();
        $relatoriosPendentes = Tarefa::where('status', '!=', 'Concluído')->count();
        $alertasCusto = Estoque::whereIn('status', ['Estoque Baixo', 'Esgotado'])->count();

        $custosPorCategoria = Estoque::query()
            ->selectRaw('categoria, SUM(quantidade * 35) as total')
            ->groupBy('categoria')
            ->pluck('total', 'categoria');

        $mttCategorias = [
            ['nome' => 'Elétrico', 'atual' => 44, 'meta' => 12],
            ['nome' => 'Mecânico', 'atual' => 26, 'meta' => 18],
            ['nome' => 'Predial', 'atual' => 31, 'meta' => 45],
            ['nome' => 'Outros', 'atual' => 4, 'meta' => 9],
        ];

        $historico = [400, 450, 430, 450, 460, 530, 470, 460, 490, 490, 520, 570];

        $falhasFrequentes = Estoque::query()
            ->orderBy('quantidade')
            ->take(4)
            ->get()
            ->map(fn (Estoque $item) => [
                'ativo' => $item->nome,
                'falhas' => max(1, 6 - min($item->quantidade, 5)),
                'tempo' => '3 Meses',
            ]);

        return view('pages.relatorios.index', compact(
            'totalRelatorios',
            'relatoriosPendentes',
            'alertasCusto',
            'custosPorCategoria',
            'mttCategorias',
            'historico',
            'falhasFrequentes',
        ));
    }
}
