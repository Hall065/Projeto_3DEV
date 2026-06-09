<?php

namespace App\Models\Safe;

use App\Models\User;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'safe_authorization_id',
    'action',
    'user_id',
])]
class SafeAuthorizationLog extends Model
{
    protected $table = 'safe_authorization_logs';

    /** @return BelongsTo<SafeAuthorization, $this> */
    public function authorization(): BelongsTo
    {
        return $this->belongsTo(SafeAuthorization::class, 'safe_authorization_id');
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
