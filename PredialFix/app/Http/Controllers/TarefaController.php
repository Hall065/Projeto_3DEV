<?php

namespace App\Http\Controllers;

use App\Models\Tarefa;
use App\Models\Usuario;
use Illuminate\Http\Request;

class TarefaController extends Controller
{
    public function index()
    {
        $tarefas = Tarefa::with('responsavel')->paginate(10);
        return view('pages.tarefas.index', compact('tarefas'));
    }

    public function create()
    {
        $responsaveis = Usuario::where('ativo', true)->get();
        return view('pages.tarefas.create', compact('responsaveis'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'titulo' => 'required|string|max:255',
            'id_responsavel' => 'required|exists:usuarios,id',
            'localizacao' => 'required|string|max:255',
            'prioridade' => 'required|in:Baixa,Média,Alta,Urgente',
            'status' => 'required|in:Pendente,Em Andamento,Concluído',
            'data_inicio' => 'required|date',
            'data_final' => 'required|date|after_or_equal:data_inicio',
        ]);

        Tarefa::create([
            'titulo' => $request->titulo,
            'id_responsavel' => $request->id_responsavel,
            'localizacao' => $request->localizacao,
            'prioridade' => $request->prioridade,
            'status' => $request->status,
            'data_inicio' => $request->data_inicio,
            'data_final' => $request->data_final,
        ]);

        return redirect()->route('tarefas.index')->with('success', 'Tarefa criada com sucesso!');
    }

    public function show(Tarefa $tarefa)
    {
        $tarefa->load('responsavel');
        return view('pages.tarefas.show', compact('tarefa'));
    }

    public function edit(Tarefa $tarefa)
    {
        $responsaveis = Usuario::where('ativo', true)->get();
        return view('pages.tarefas.edit', compact('tarefa', 'responsaveis'));
    }

    public function update(Request $request, Tarefa $tarefa)
    {
        $request->validate([
            'titulo' => 'required|string|max:255',
            'id_responsavel' => 'required|exists:usuarios,id',
            'localizacao' => 'required|string|max:255',
            'prioridade' => 'required|in:Baixa,Média,Alta,Urgente',
            'status' => 'required|in:Pendente,Em Andamento,Concluído',
            'data_inicio' => 'required|date',
            'data_final' => 'required|date|after_or_equal:data_inicio',
        ]);

        $tarefa->update([
            'titulo' => $request->titulo,
            'id_responsavel' => $request->id_responsavel,
            'localizacao' => $request->localizacao,
            'prioridade' => $request->prioridade,
            'status' => $request->status,
            'data_inicio' => $request->data_inicio,
            'data_final' => $request->data_final,
        ]);

        return redirect()->route('tarefas.index')->with('success', 'Tarefa atualizada com sucesso!');
    }

    public function destroy(Tarefa $tarefa)
    {
        $tarefa->delete();
        return redirect()->route('tarefas.index')->with('success', 'Tarefa excluída com sucesso!');
    }
}
