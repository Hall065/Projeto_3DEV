<?php

namespace App\Livewire;

use App\Models\Tarefa;
use App\Models\Usuario;
use Livewire\Component;
use Livewire\WithPagination;

class Tarefas extends Component
{
    use WithPagination;

    public $search = '';
    public $prioridade = '';
    public $status = '';

    public $showModal = false;
    public $isEdit = false;
    public $tarefaId;

    public $titulo;
    public $id_responsavel;
    public $localizacao;
    public $prioridade_item;
    public $status_item;
    public $data_inicio;
    public $data_final;

    protected $rules = [
        'titulo' => 'required|string|max:255',
        'id_responsavel' => 'required|exists:usuarios,id',
        'localizacao' => 'required|string|max:255',
        'prioridade_item' => 'required|in:Baixa,Média,Alta,Urgente',
        'status_item' => 'required|in:Pendente,Em Andamento,Concluído',
        'data_inicio' => 'required|date',
        'data_final' => 'required|date|after_or_equal:data_inicio',
    ];

    public function render()
    {
        $query = Tarefa::with('responsavel');

        if ($this->search) {
            $query->where(function ($q) {
                $q->where('titulo', 'like', '%' . $this->search . '%')
                  ->orWhereHas('responsavel', function ($qr) {
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

        $tarefas = $query->paginate(10);

        $responsaveis = Usuario::where('ativo', true)->get();

        return view('livewire.tarefas', compact('tarefas', 'responsaveis'));
    }

    public function create()
    {
        $this->resetForm();
        $this->isEdit = false;
        $this->showModal = true;
    }

    public function edit($id)
    {
        $tarefa = Tarefa::findOrFail($id);
        $this->tarefaId = $tarefa->id;
        $this->titulo = $tarefa->titulo;
        $this->id_responsavel = $tarefa->id_responsavel;
        $this->localizacao = $tarefa->localizacao;
        $this->prioridade_item = $tarefa->prioridade;
        $this->status_item = $tarefa->status;
        $this->data_inicio = $tarefa->data_inicio->format('Y-m-d');
        $this->data_final = $tarefa->data_final->format('Y-m-d');
        $this->isEdit = true;
        $this->showModal = true;
    }

    public function save()
    {
        $this->validate();

        if ($this->isEdit) {
            $tarefa = Tarefa::findOrFail($this->tarefaId);
            $tarefa->update([
                'titulo' => $this->titulo,
                'id_responsavel' => $this->id_responsavel,
                'localizacao' => $this->localizacao,
                'prioridade' => $this->prioridade_item,
                'status' => $this->status_item,
                'data_inicio' => $this->data_inicio,
                'data_final' => $this->data_final,
            ]);
            session()->flash('message', 'Tarefa atualizada com sucesso!');
        } else {
            Tarefa::create([
                'titulo' => $this->titulo,
                'id_responsavel' => $this->id_responsavel,
                'localizacao' => $this->localizacao,
                'prioridade' => $this->prioridade_item,
                'status' => $this->status_item,
                'data_inicio' => $this->data_inicio,
                'data_final' => $this->data_final,
            ]);
            session()->flash('message', 'Tarefa criada com sucesso!');
        }

        $this->showModal = false;
        $this->resetForm();
    }

    public function delete($id)
    {
        $tarefa = Tarefa::findOrFail($id);
        $tarefa->delete();
        session()->flash('message', 'Tarefa excluída com sucesso!');
    }

    private function resetForm()
    {
        $this->tarefaId = null;
        $this->titulo = '';
        $this->id_responsavel = '';
        $this->localizacao = '';
        $this->prioridade_item = '';
        $this->status_item = '';
        $this->data_inicio = '';
        $this->data_final = '';
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
