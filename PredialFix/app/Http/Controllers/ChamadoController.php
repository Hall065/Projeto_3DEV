<?php

namespace App\Http\Controllers;

use App\Models\Chamado;
use App\Models\Usuario;
use Illuminate\Http\Request;

class ChamadoController extends Controller
{
    public function index()
    {
        $chamados = Chamado::with(['usuario', 'atendente'])->paginate(10);
        return view('pages.chamados.index', compact('chamados'));
    }

    public function create()
    {
        $atendentes = Usuario::where('ativo', true)->whereIn('perfil_acesso', ['admin', 'atendente'])->get();
        return view('pages.chamados.create', compact('atendentes'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'titulo' => 'required|string|max:255',
            'local' => 'required|string|max:255',
            'prioridade' => 'required|in:Baixa,Média,Alta,Urgente',
            'status' => 'required|in:Aberto,Em Análise,Fechado',
            'descricao' => 'nullable|string',
            'id_atendente' => 'nullable|exists:usuarios,id',
        ]);

        Chamado::create([
            'titulo' => $request->titulo,
            'id_usuario' => auth()->id(),
            'id_atendente' => $request->id_atendente,
            'local' => $request->local,
            'prioridade' => $request->prioridade,
            'status' => $request->status,
            'descricao' => $request->descricao,
        ]);

        return redirect()->route('chamados.index')->with('success', 'Chamado criado com sucesso!');
    }

    public function show(Chamado $chamado)
    {
        $chamado->load(['usuario', 'atendente']);
        return view('pages.chamados.show', compact('chamado'));
    }

    public function edit(Chamado $chamado)
    {
        $atendentes = Usuario::where('ativo', true)->whereIn('perfil_acesso', ['admin', 'atendente'])->get();
        return view('pages.chamados.edit', compact('chamado', 'atendentes'));
    }

    public function update(Request $request, Chamado $chamado)
    {
        $request->validate([
            'titulo' => 'required|string|max:255',
            'local' => 'required|string|max:255',
            'prioridade' => 'required|in:Baixa,Média,Alta,Urgente',
            'status' => 'required|in:Aberto,Em Análise,Fechado',
            'descricao' => 'nullable|string',
            'id_atendente' => 'nullable|exists:usuarios,id',
        ]);

        $chamado->update([
            'titulo' => $request->titulo,
            'id_atendente' => $request->id_atendente,
            'local' => $request->local,
            'prioridade' => $request->prioridade,
            'status' => $request->status,
            'descricao' => $request->descricao,
        ]);

        return redirect()->route('chamados.index')->with('success', 'Chamado atualizado com sucesso!');
    }

    public function destroy(Chamado $chamado)
    {
        $chamado->delete();
        return redirect()->route('chamados.index')->with('success', 'Chamado excluído com sucesso!');
    }
}
