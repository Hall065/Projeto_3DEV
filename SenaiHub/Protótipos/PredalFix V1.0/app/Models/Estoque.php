<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Estoque extends Model
{
    protected $fillable = [
        'nome',
        'categoria',
        'localizacao',
        'quantidade',
        'status',
    ];

    public static function updateStatus(int $quantidade): string
    {
        if ($quantidade === 0) {
            return 'Esgotado';
        } elseif ($quantidade >= 1 && $quantidade <= 5) {
            return 'Estoque Baixo';
        } else {
            return 'Disponível';
        }
    }

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($estoque) {
            $estoque->status = self::updateStatus($estoque->quantidade);
        });
    }
}
