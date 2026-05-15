<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Chamado extends Model
{
    protected $fillable = [
        'titulo',
        'id_usuario',
        'id_atendente',
        'local',
        'prioridade',
        'status',
        'descricao',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'id_usuario');
    }

    public function atendente(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'id_atendente');
    }
}
