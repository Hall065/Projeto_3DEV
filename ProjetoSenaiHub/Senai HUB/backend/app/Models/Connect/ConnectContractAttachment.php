<?php

namespace App\Models\Connect;

use App\Models\User;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'connect_contract_id',
    'uploaded_by_user_id',
    'original_name',
    'mime_type',
    'size_bytes',
    'disk_path',
    'is_generated',
])]
class ConnectContractAttachment extends Model
{
    protected function casts(): array
    {
        return [
            'is_generated' => 'boolean',
        ];
    }

    /** @return BelongsTo<ConnectContract, $this> */
    public function contract(): BelongsTo
    {
        return $this->belongsTo(ConnectContract::class, 'connect_contract_id');
    }

    /** @return BelongsTo<User, $this> */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_user_id');
    }
}
