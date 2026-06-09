<?php

namespace App\Models\Safe;

use App\Enums\Safe\AuthorizationStatus;
use App\Enums\Safe\AuthorizationType;
use App\Models\User;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'protocol',
    'safe_student_id',
    'student_name',
    'class_name',
    'type',
    'reason',
    'absence_count',
    'scheduled_at',
    'notes',
    'status',
    'requested_by',
    'approved_by_teacher',
    'approved_by_portaria',
    'teacher_approved_at',
    'portaria_confirmed_at',
    'finalized_at',
])]
class SafeAuthorization extends Model
{
    protected $table = 'safe_authorizations';

    protected function casts(): array
    {
        return [
            'type' => AuthorizationType::class,
            'status' => AuthorizationStatus::class,
            'absence_count' => 'integer',
            'scheduled_at' => 'datetime',
            'teacher_approved_at' => 'datetime',
            'portaria_confirmed_at' => 'datetime',
            'finalized_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<SafeStudent, $this> */
    public function student(): BelongsTo
    {
        return $this->belongsTo(SafeStudent::class, 'safe_student_id');
    }

    /** @return BelongsTo<User, $this> */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /** @return BelongsTo<User, $this> */
    public function teacherApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_teacher');
    }

    /** @return BelongsTo<User, $this> */
    public function portariaApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_portaria');
    }

    /** @return HasMany<SafeAuthorizationLog, $this> */
    public function logs(): HasMany
    {
        return $this->hasMany(SafeAuthorizationLog::class);
    }

    public function statusLabel(): string
    {
        return match ($this->status) {
            AuthorizationStatus::PendenteAqv => 'Pendente AQV',
            AuthorizationStatus::AguardandoProfessor => 'Aguardando Professor',
            AuthorizationStatus::LiberadoPortaria => 'Liberado para Portaria',
            AuthorizationStatus::Finalizado => 'Finalizado',
            AuthorizationStatus::Negado => 'Negado',
        };
    }

    public function typeLabel(): string
    {
        return $this->type === AuthorizationType::Saida ? 'Saída' : 'Entrada';
    }
}
