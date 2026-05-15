<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'nome' => ['required', 'string', 'min:3', 'max:100'],
            'email' => ['required', 'email', 'max:255'],
            'telefone' => ['required', 'string', 'max:20'],
            'tipo_imovel' => ['nullable', 'string', 'max:50'],
            'mensagem' => ['nullable', 'string', 'max:1000'],
        ]);

        Lead::create($data + [
            'status' => 'novo',
            'origem' => 'landing',
        ]);

        return back()->with('status', 'Recebemos seu contato. Retornaremos em breve.');
    }
}
