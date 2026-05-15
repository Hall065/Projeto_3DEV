<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UsuarioController extends Controller
{
    public function index()
    {
        $usuarios = Usuario::paginate(10);
        return view('pages.usuarios.index', compact('usuarios'));
    }

    public function create()
    {
        return view('pages.usuarios.create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'nome' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:usuarios,email',
            'cpf' => 'required|string|max:14|unique:usuarios,cpf',
            'password' => 'required|string|min:8',
            'perfil_acesso' => 'required|in:cliente,admin,atendente,gerente,manutencao,financeiro',
            'ativo' => 'boolean',
        ]);

        Usuario::create([
            'nome' => $request->nome,
            'email' => $request->email,
            'cpf' => $request->cpf,
            'password' => Hash::make($request->password),
            'perfil_acesso' => $request->perfil_acesso,
            'ativo' => $request->ativo ?? true,
        ]);

        return redirect()->route('usuarios.index')->with('success', 'Usuário criado com sucesso!');
    }

    public function show(Usuario $usuario)
    {
        return view('pages.usuarios.show', compact('usuario'));
    }

    public function edit(Usuario $usuario)
    {
        return view('pages.usuarios.edit', compact('usuario'));
    }

    public function update(Request $request, Usuario $usuario)
    {
        $request->validate([
            'nome' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:usuarios,email,' . $usuario->id,
            'cpf' => 'required|string|max:14|unique:usuarios,cpf,' . $usuario->id,
            'perfil_acesso' => 'required|in:cliente,admin,atendente,gerente,manutencao,financeiro',
            'ativo' => 'boolean',
        ]);

        $usuario->update([
            'nome' => $request->nome,
            'email' => $request->email,
            'cpf' => $request->cpf,
            'perfil_acesso' => $request->perfil_acesso,
            'ativo' => $request->ativo ?? true,
        ]);

        return redirect()->route('usuarios.index')->with('success', 'Usuário atualizado com sucesso!');
    }

    public function destroy(Usuario $usuario)
    {
        $usuario->update(['ativo' => false]);
        return redirect()->route('usuarios.index')->with('success', 'Usuário desativado com sucesso!');
    }
}
