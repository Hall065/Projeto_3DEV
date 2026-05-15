<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Usuario extends Model
{
    protected $fillable = [
        'nome',
        'email',
        'cpf',
        'password',
        'perfil_acesso',
        'ativo',
    ];

    protected $casts = [
        'ativo' => 'boolean',
    ];

    public function tarefasResponsavel(): HasMany
    {
        return $this->hasMany(Tarefa::class, 'id_responsavel');
    }

    public function chamadosSolicitante(): HasMany
    {
        return $this->hasMany(Chamado::class, 'id_usuario');
    }

    public function chamadosAtendente(): HasMany
    {
        return $this->hasMany(Chamado::class, 'id_atendente');
    }
}
