<?php

namespace App\Models\Connect;

use App\Models\HubPerson;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['code', 'name', 'description', 'workload_hours', 'start_date', 'end_date', 'area', 'status'])]
class ConnectCourse extends Model
{
    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    /** @return HasMany<ConnectClass, $this> */
    public function classes(): HasMany
    {
        return $this->hasMany(ConnectClass::class, 'connect_course_id');
    }

    /** Pessoas vinculadas ao curso (alunos, professores, coordenadores). */
    /** @return BelongsToMany<HubPerson, $this> */
    public function people(): BelongsToMany
    {
        return $this->belongsToMany(HubPerson::class, 'connect_course_hub_person', 'connect_course_id', 'hub_person_id')
            ->withPivot(['role', 'status', 'enrolled_at'])
            ->withTimestamps();
    }
}
