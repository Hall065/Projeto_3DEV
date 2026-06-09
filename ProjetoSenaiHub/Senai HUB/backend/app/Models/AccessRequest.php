<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'name',
    'email',
    'organization',
    'message',
    'status',
])]
class AccessRequest extends Model
{
    //
}
