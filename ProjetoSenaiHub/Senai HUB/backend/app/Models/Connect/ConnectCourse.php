<?php

namespace App\Models\Connect;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['code', 'name', 'description', 'workload_hours', 'area', 'status'])]
class ConnectCourse extends Model
{
    /** @return HasMany<ConnectClass, $this> */
    public function classes(): HasMany
    {
        return $this->hasMany(ConnectClass::class, 'connect_course_id');
    }
}
