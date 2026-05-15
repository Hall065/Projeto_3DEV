<?php

namespace App\Http\Controllers;

use App\Models\Estoque;
use Illuminate\Http\Request;

class EstoqueController extends Controller
{
    public function index()
    {
        $estoques = Estoque::paginate(10);
        return view('pages.estoques.index', compact('estoques'));
    }

    public function create()
    {
        return view('pages.estoques.create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'nome' => 'required|string|max:255',
            'categoria' => 'required|string|max:255',
            'localizacao' => 'required|string|max:255',
            'quantidade' => 'required|integer|min:0',
        ]);

        Estoque::create([
            'nome' => $request->nome,
            'categoria' => $request->categoria,
            'localizacao' => $request->localizacao,
            'quantidade' => $request->quantidade,
        ]);

        return redirect()->route('estoques.index')->with('success', 'Item de estoque criado com sucesso!');
    }

    public function show(Estoque $estoque)
    {
        return view('pages.estoques.show', compact('estoque'));
    }

    public function edit(Estoque $estoque)
    {
        return view('pages.estoques.edit', compact('estoque'));
    }

    public function update(Request $request, Estoque $estoque)
    {
        $request->validate([
            'nome' => 'required|string|max:255',
            'categoria' => 'required|string|max:255',
            'localizacao' => 'required|string|max:255',
            'quantidade' => 'required|integer|min:0',
        ]);

        $estoque->update([
            'nome' => $request->nome,
            'categoria' => $request->categoria,
            'localizacao' => $request->localizacao,
            'quantidade' => $request->quantidade,
        ]);

        return redirect()->route('estoques.index')->with('success', 'Item de estoque atualizado com sucesso!');
    }

    public function destroy(Estoque $estoque)
    {
        $estoque->delete();
        return redirect()->route('estoques.index')->with('success', 'Item de estoque excluído com sucesso!');
    }
}
