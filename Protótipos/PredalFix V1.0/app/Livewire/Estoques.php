<?php

namespace App\Livewire;

use App\Models\Estoque;
use Livewire\Component;
use Livewire\WithPagination;

class Estoques extends Component
{
    use WithPagination;

    public $search = '';
    public $categoria = '';
    public $status = '';

    public $showModal = false;
    public $isEdit = false;
    public $estoqueId;

    public $nome;
    public $categoria_item;
    public $localizacao;
    public $quantidade;

    protected $rules = [
        'nome' => 'required|string|max:255',
        'categoria_item' => 'required|string|max:255',
        'localizacao' => 'required|string|max:255',
        'quantidade' => 'required|integer|min:0',
    ];

    public function render()
    {
        $query = Estoque::query();

        if ($this->search) {
            $query->where(function ($q) {
                $q->where('nome', 'like', '%' . $this->search . '%')
                  ->orWhere('localizacao', 'like', '%' . $this->search . '%');
            });
        }

        if ($this->categoria) {
            $query->where('categoria', $this->categoria);
        }

        if ($this->status) {
            $query->where('status', $this->status);
        }

        $estoques = $query->paginate(10);

        $categorias = Estoque::distinct()->pluck('categoria');

        return view('livewire.estoques', compact('estoques', 'categorias'));
    }

    public function create()
    {
        $this->resetForm();
        $this->isEdit = false;
        $this->showModal = true;
    }

    public function edit($id)
    {
        $estoque = Estoque::findOrFail($id);
        $this->estoqueId = $estoque->id;
        $this->nome = $estoque->nome;
        $this->categoria_item = $estoque->categoria;
        $this->localizacao = $estoque->localizacao;
        $this->quantidade = $estoque->quantidade;
        $this->isEdit = true;
        $this->showModal = true;
    }

    public function save()
    {
        $this->validate();

        if ($this->isEdit) {
            $estoque = Estoque::findOrFail($this->estoqueId);
            $estoque->update([
                'nome' => $this->nome,
                'categoria' => $this->categoria_item,
                'localizacao' => $this->localizacao,
                'quantidade' => $this->quantidade,
            ]);
            session()->flash('message', 'Item de estoque atualizado com sucesso!');
        } else {
            Estoque::create([
                'nome' => $this->nome,
                'categoria' => $this->categoria_item,
                'localizacao' => $this->localizacao,
                'quantidade' => $this->quantidade,
            ]);
            session()->flash('message', 'Item de estoque criado com sucesso!');
        }

        $this->showModal = false;
        $this->resetForm();
    }

    public function delete($id)
    {
        $estoque = Estoque::findOrFail($id);
        $estoque->delete();
        session()->flash('message', 'Item de estoque excluído com sucesso!');
    }

    private function resetForm()
    {
        $this->estoqueId = null;
        $this->nome = '';
        $this->categoria_item = '';
        $this->localizacao = '';
        $this->quantidade = 0;
        $this->resetErrorBag();
    }

    public function updatingSearch()
    {
        $this->resetPage();
    }

    public function updatingCategoria()
    {
        $this->resetPage();
    }

    public function updatingStatus()
    {
        $this->resetPage();
    }
}
