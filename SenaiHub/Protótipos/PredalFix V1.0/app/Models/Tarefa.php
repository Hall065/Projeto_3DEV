<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tarefa extends Model
{
    protected $fillable = [
        'titulo',
        'id_responsavel',
        'localizacao',
        'prioridade',
        'status',
        'data_inicio',
        'data_final',
    ];

    protected $casts = [
        'data_inicio' => 'date',
        'data_final' => 'date',
    ];

    public function responsavel(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'id_responsavel');
    }

    public function getEstaVencidaAttribute(): bool
    {
        return $this->status !== 'Concluído' && $this->data_final < now();
    }
}
