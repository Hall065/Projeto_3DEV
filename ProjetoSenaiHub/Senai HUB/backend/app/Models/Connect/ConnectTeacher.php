<?php

namespace App\Models\Connect;

use App\Models\Concerns\ResolvesProfileFromHubPerson;
use App\Models\HubPerson;
use App\Models\User;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['hub_person_id', 'user_id', 'full_name', 'cpf', 'email', 'phone', 'specialty', 'status'])]
class ConnectTeacher extends Model
{
    use ResolvesProfileFromHubPerson;

    /** @return BelongsTo<HubPerson, $this> */
    public function hubPerson(): BelongsTo
    {
        return $this->belongsTo(HubPerson::class, 'hub_person_id');
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<ConnectClass, $this> */
    public function classes(): HasMany
    {
        return $this->hasMany(ConnectClass::class, 'connect_teacher_id');
    }

    /** @return HasMany<ConnectAttendanceSession, $this> */
    public function attendanceSessions(): HasMany
    {
        return $this->hasMany(ConnectAttendanceSession::class, 'connect_teacher_id');
    }
}
