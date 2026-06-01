<?php

namespace App\Models\Connect;

use App\Models\Concerns\ResolvesProfileFromHubPerson;
use App\Models\HubPerson;
use App\Models\User;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'hub_person_id',
    'user_id',
    'connect_class_id',
    'full_name',
    'cpf',
    'registration_number',
    'email',
    'phone',
    'birth_date',
    'status',
    'max_absences_allowed',
])]
class ConnectStudent extends Model
{
    use ResolvesProfileFromHubPerson;

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
        ];
    }

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

    /** @return BelongsTo<ConnectClass, $this> */
    public function connectClass(): BelongsTo
    {
        return $this->belongsTo(ConnectClass::class, 'connect_class_id');
    }

    /** @return HasMany<ConnectAttendanceMark, $this> */
    public function attendanceMarks(): HasMany
    {
        return $this->hasMany(ConnectAttendanceMark::class, 'connect_student_id');
    }

    /** @return HasMany<ConnectContract, $this> */
    public function contracts(): HasMany
    {
        return $this->hasMany(ConnectContract::class, 'connect_student_id');
    }

    /** @return HasMany<ConnectSalaryRecord, $this> */
    public function salaryRecords(): HasMany
    {
        return $this->hasMany(ConnectSalaryRecord::class, 'connect_student_id');
    }

    /** @return HasOne<ConnectStudentLocation, $this> */
    public function location(): HasOne
    {
        return $this->hasOne(ConnectStudentLocation::class, 'connect_student_id');
    }
}
