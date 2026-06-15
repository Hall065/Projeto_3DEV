<?php

namespace App\Models\Grid;

use App\Models\HubPerson;
use App\Models\User;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'user_id',
    'hub_person_id',
    'name',
    'email',
    'phone',
    'role',
    'cpf',
    'status',
])]
class GridUser extends Model
{
    /** @return \Illuminate\Database\Eloquent\Relations\BelongsTo<User, $this> */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /** @return \Illuminate\Database\Eloquent\Relations\BelongsTo<HubPerson, $this> */
    public function hubPerson()
    {
        return $this->belongsTo(HubPerson::class, 'hub_person_id');
    }
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
