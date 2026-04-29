<?php

namespace App\Livewire;

use App\Models\User;
use App\Models\Usuario;
use Illuminate\Support\Facades\Hash;
use Livewire\Component;
use Livewire\WithPagination;

class Usuarios extends Component
{
    use WithPagination;

    public $search = '';
    public $perfilAcesso = '';
    public $status = '';

    public $showModal = false;
    public $isEdit = false;
    public $usuarioId;

    public $nome;
    public $email;
    public $cpf;
    public $password;
    public $perfil_acesso;
    public $ativo = true;

    public $showResetPasswordModal = false;
    public $newPassword;

    protected $rules = [
        'nome' => 'required|string|max:255',
        'email' => 'required|string|email|max:255|unique:usuarios,email',
        'cpf' => 'required|string|max:14|unique:usuarios,cpf',
        'perfil_acesso' => 'required|in:cliente,admin,atendente,gerente,manutencao,financeiro',
        'ativo' => 'boolean',
    ];

    public function render()
    {
        $query = Usuario::query();

        if ($this->search) {
            $query->where(function ($q) {
                $q->where('nome', 'like', '%' . $this->search . '%')
                  ->orWhere('email', 'like', '%' . $this->search . '%')
                  ->orWhere('cpf', 'like', '%' . $this->search . '%');
            });
        }

        if ($this->perfilAcesso) {
            $query->where('perfil_acesso', $this->perfilAcesso);
        }

        if ($this->status !== '') {
            $query->where('ativo', $this->status === 'ativo');
        }

        $usuarios = $query->paginate(10);

        return view('livewire.usuarios', compact('usuarios'));
    }

    public function create()
    {
        $this->resetForm();
        $this->isEdit = false;
        $this->showModal = true;
    }

    public function edit($id)
    {
        $usuario = Usuario::findOrFail($id);
        $this->usuarioId = $usuario->id;
        $this->nome = $usuario->nome;
        $this->email = $usuario->email;
        $this->cpf = $usuario->cpf;
        $this->perfil_acesso = $usuario->perfil_acesso;
        $this->ativo = $usuario->ativo;
        $this->isEdit = true;
        $this->showModal = true;
    }

    public function save()
    {
        if ($this->isEdit) {
            $this->rules['email'] = 'required|string|email|max:255|unique:usuarios,email,' . $this->usuarioId;
            $this->rules['cpf'] = 'required|string|max:14|unique:usuarios,cpf,' . $this->usuarioId;
            unset($this->rules['password']);
        } else {
            $this->rules['password'] = 'required|string|min:8';
        }

        $this->validate();

        if ($this->isEdit) {
            $usuario = Usuario::findOrFail($this->usuarioId);
            $oldEmail = $usuario->email;
            $oldCpf = $usuario->cpf;
            $usuario->update([
                'nome' => $this->nome,
                'email' => $this->email,
                'cpf' => $this->cpf,
                'perfil_acesso' => $this->perfil_acesso,
                'ativo' => $this->ativo,
            ]);

            User::query()
                ->where('email', $oldEmail)
                ->orWhere('cpf', $oldCpf)
                ->update([
                    'name' => $this->nome,
                    'email' => $this->email,
                    'cpf' => $this->cpf,
                    'tipo' => $this->perfil_acesso === 'admin' ? 'admin' : 'colaborador',
                    'ativo' => $this->ativo,
                ]);
            session()->flash('message', 'Usuário atualizado com sucesso!');
        } else {
            $user = User::create([
                'name' => $this->nome,
                'email' => $this->email,
                'cpf' => $this->cpf,
                'tipo' => $this->perfil_acesso === 'admin' ? 'admin' : 'colaborador',
                'ativo' => $this->ativo,
                'password' => $this->password,
            ]);

            $usuario = new Usuario();
            $usuario->forceFill([
                'id' => $user->id,
                'nome' => $this->nome,
                'email' => $this->email,
                'cpf' => $this->cpf,
                'password' => Hash::make($this->password),
                'perfil_acesso' => $this->perfil_acesso,
                'ativo' => $this->ativo,
            ])->save();
            session()->flash('message', 'Usuário criado com sucesso!');
        }

        $this->showModal = false;
        $this->resetForm();
    }

    public function delete($id)
    {
        $usuario = Usuario::findOrFail($id);
        $usuario->update(['ativo' => false]);
        User::query()
            ->where('email', $usuario->email)
            ->orWhere('cpf', $usuario->cpf)
            ->update(['ativo' => false]);
        session()->flash('message', 'Usuário desativado com sucesso!');
    }

    public function resetPasswordModal($id)
    {
        $this->usuarioId = $id;
        $this->newPassword = '';
        $this->showResetPasswordModal = true;
    }

    public function resetPassword()
    {
        $this->validate([
            'newPassword' => 'required|string|min:8',
        ]);

        $usuario = Usuario::findOrFail($this->usuarioId);
        $usuario->update(['password' => Hash::make($this->newPassword)]);
        User::query()
            ->where('email', $usuario->email)
            ->orWhere('cpf', $usuario->cpf)
            ->update(['password' => Hash::make($this->newPassword)]);
        session()->flash('message', 'Senha redefinida com sucesso!');
        $this->showResetPasswordModal = false;
    }

    private function resetForm()
    {
        $this->usuarioId = null;
        $this->nome = '';
        $this->email = '';
        $this->cpf = '';
        $this->password = '';
        $this->perfil_acesso = '';
        $this->ativo = true;
        $this->resetErrorBag();
    }

    public function updatingSearch()
    {
        $this->resetPage();
    }

    public function updatingPerfilAcesso()
    {
        $this->resetPage();
    }

    public function updatingStatus()
    {
        $this->resetPage();
    }
}
