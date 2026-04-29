<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    protected $fillable = [
        'nome',
        'email',
        'telefone',
        'tipo_imovel',
        'mensagem',
        'status',
        'origem',
    ];
}
