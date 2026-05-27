<?php

namespace App\Models\Grid;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'name',
    'email',
    'phone',
    'role',
    'cpf',
    'status',
])]
class GridUser extends Model
{
    public function scopeSearch($query, ?string $search)
    {
        if (! $search) {
            return $query;
        }

        $like = '%'.$search.'%';

        return $query->where(function ($q) use ($like) {
            $q->where('name', 'like', $like)
                ->orWhere('email', 'like', $like)
                ->orWhere('cpf', 'like', $like);
        });
    }
}
