<?php

namespace App\Livewire;

use App\Models\Chamado;
use App\Models\Usuario;
use Livewire\Component;
use Livewire\WithPagination;

class Chamados extends Component
{
    use WithPagination;

    public $search = '';
    public $prioridade = '';
    public $status = '';

    public $showModal = false;
    public $showDetailModal = false;
    public $isEdit = false;
    public $chamadoId;
    public $selectedChamado;

    public $titulo;
    public $id_atendente;
    public $local;
    public $prioridade_item;
    public $status_item;
    public $descricao;

    protected $rules = [
        'titulo' => 'required|string|max:255',
        'local' => 'required|string|max:255',
        'prioridade_item' => 'required|in:Baixa,Média,Alta,Urgente',
        'status_item' => 'required|in:Aberto,Em Análise,Fechado',
        'descricao' => 'nullable|string',
    ];

    public function render()
    {
        $query = Chamado::with(['usuario', 'atendente']);

        if ($this->search) {
            $query->where(function ($q) {
                $q->where('titulo', 'like', '%' . $this->search . '%')
                  ->orWhere('local', 'like', '%' . $this->search . '%')
                  ->orWhereHas('usuario', function ($qr) {
                      $qr->where('nome', 'like', '%' . $this->search . '%');
                  });
            });
        }

        if ($this->prioridade) {
            $query->where('prioridade', $this->prioridade);
        }

        if ($this->status) {
            $query->where('status', $this->status);
        }

        $chamados = $query->paginate(10);

        $atendentes = Usuario::where('ativo', true)
            ->whereIn('perfil_acesso', ['admin', 'atendente'])
            ->get();

        return view('livewire.chamados', compact('chamados', 'atendentes'));
    }

    public function create()
    {
        $this->resetForm();
        $this->isEdit = false;
        $this->showModal = true;
    }

    public function edit($id)
    {
        $chamado = Chamado::findOrFail($id);
        $this->chamadoId = $chamado->id;
        $this->titulo = $chamado->titulo;
        $this->id_atendente = $chamado->id_atendente;
        $this->local = $chamado->local;
        $this->prioridade_item = $chamado->prioridade;
        $this->status_item = $chamado->status;
        $this->descricao = $chamado->descricao;
        $this->isEdit = true;
        $this->showModal = true;
    }

    public function show($id)
    {
        $this->selectedChamado = Chamado::with(['usuario', 'atendente'])->findOrFail($id);
        $this->showDetailModal = true;
    }

    public function save()
    {
        $this->validate();

        if ($this->isEdit) {
            $chamado = Chamado::findOrFail($this->chamadoId);
            $chamado->update([
                'titulo' => $this->titulo,
                'id_atendente' => $this->id_atendente ?: null,
                'local' => $this->local,
                'prioridade' => $this->prioridade_item,
                'status' => $this->status_item,
                'descricao' => $this->descricao,
            ]);
            session()->flash('message', 'Chamado atualizado com sucesso!');
        } else {
            Chamado::create([
                'titulo' => $this->titulo,
                'id_usuario' => auth()->id() ?: 1,
                'id_atendente' => $this->id_atendente ?: null,
                'local' => $this->local,
                'prioridade' => $this->prioridade_item,
                'status' => $this->status_item,
                'descricao' => $this->descricao,
            ]);
            session()->flash('message', 'Chamado criado com sucesso!');
        }

        $this->showModal = false;
        $this->resetForm();
    }

    public function delete($id)
    {
        $chamado = Chamado::findOrFail($id);
        $chamado->delete();
        session()->flash('message', 'Chamado excluído com sucesso!');
    }

    private function resetForm()
    {
        $this->chamadoId = null;
        $this->titulo = '';
        $this->id_atendente = '';
        $this->local = '';
        $this->prioridade_item = '';
        $this->status_item = '';
        $this->descricao = '';
        $this->resetErrorBag();
    }

    public function updatingSearch()
    {
        $this->resetPage();
    }

    public function updatingPrioridade()
    {
        $this->resetPage();
    }

    public function updatingStatus()
    {
        $this->resetPage();
    }
}
