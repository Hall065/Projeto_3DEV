<?php

namespace App\Services\Safe;

use App\Enums\Safe\AuthorizationStatus;
use App\Enums\Safe\AuthorizationType;
use App\Models\Safe\SafeAuthorization;
use App\Models\Safe\SafeAuthorizationLog;
use App\Models\Safe\SafeStudent;
use App\Models\User;
use App\Services\Notification\SafeNotificationTriggers;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SafeWorkflowService
{
    public function __construct(
        private readonly SafeNotificationTriggers $notifications,
    ) {}
    /**
     * @param  array<string, mixed>  $data
     */
    public function createAuthorization(User $user, array $data): SafeAuthorization
    {
        return DB::transaction(function () use ($user, $data) {
            $student = null;
            if (! empty($data['safe_student_id'])) {
                $student = SafeStudent::query()->findOrFail($data['safe_student_id']);
            }

            $authorization = SafeAuthorization::query()->create([
                'protocol' => $this->generateProtocol(),
                'safe_student_id' => $student?->id,
                'student_name' => $student?->name ?? $data['student_name'],
                'class_name' => $student?->class_name ?? $data['class_name'],
                'type' => $data['type'],
                'reason' => $data['reason'],
                'absence_count' => $data['absence_count'] ?? null,
                'scheduled_at' => $data['scheduled_at'],
                'notes' => $data['notes'] ?? null,
                'status' => AuthorizationStatus::AguardandoProfessor,
                'requested_by' => $user->id,
            ]);

            $this->logAction($authorization, 'Solicitação criada pela AQV', $user->id);

            $fresh = $authorization->fresh(['student', 'requester']);
            $this->notifications->authorizationCreated($fresh, $user);

            return $fresh;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateAuthorization(SafeAuthorization $authorization, User $user, array $data): SafeAuthorization
    {
        $this->assertEditable($authorization);

        return DB::transaction(function () use ($authorization, $user, $data) {
            $student = null;
            if (! empty($data['safe_student_id'])) {
                $student = SafeStudent::query()->findOrFail($data['safe_student_id']);
            }

            $authorization->update([
                'safe_student_id' => $student?->id ?? $data['safe_student_id'] ?? $authorization->safe_student_id,
                'student_name' => $student?->name ?? $data['student_name'] ?? $authorization->student_name,
                'class_name' => $student?->class_name ?? $data['class_name'] ?? $authorization->class_name,
                'type' => $data['type'] ?? $authorization->type,
                'reason' => $data['reason'] ?? $authorization->reason,
                'absence_count' => array_key_exists('absence_count', $data) ? $data['absence_count'] : $authorization->absence_count,
                'scheduled_at' => $data['scheduled_at'] ?? $authorization->scheduled_at,
                'notes' => array_key_exists('notes', $data) ? $data['notes'] : $authorization->notes,
            ]);

            $this->logAction($authorization, 'Solicitação atualizada pela AQV', $user->id);

            return $authorization->fresh(['student', 'requester', 'teacherApprover', 'portariaApprover']);
        });
    }

    public function approveByTeacher(SafeAuthorization $authorization, User $user): SafeAuthorization
    {
        $this->assertStatus($authorization, AuthorizationStatus::AguardandoProfessor, 'A solicitação não está aguardando aprovação do professor.');

        return DB::transaction(function () use ($authorization, $user) {
            if ($authorization->type === AuthorizationType::Entrada) {
                $authorization->update([
                    'status' => AuthorizationStatus::Finalizado,
                    'approved_by_teacher' => $user->id,
                    'teacher_approved_at' => now(),
                    'finalized_at' => now(),
                ]);

                $this->logAction($authorization, 'Professor aprovou entrada', $user->id);

                $fresh = $authorization->fresh(['student', 'requester', 'teacherApprover', 'portariaApprover']);
                $this->notifications->teacherApproved($fresh, $user);

                return $fresh;
            }

            $authorization->update([
                'status' => AuthorizationStatus::LiberadoPortaria,
                'approved_by_teacher' => $user->id,
                'teacher_approved_at' => now(),
            ]);

            $this->logAction($authorization, 'Professor aprovou saída', $user->id);

            $fresh = $authorization->fresh(['student', 'requester', 'teacherApprover', 'portariaApprover']);
            $this->notifications->teacherApproved($fresh, $user);

            return $fresh;
        });
    }

    public function denyByTeacher(SafeAuthorization $authorization, User $user): SafeAuthorization
    {
        $this->assertStatus($authorization, AuthorizationStatus::AguardandoProfessor, 'A solicitação não está aguardando aprovação do professor.');

        return DB::transaction(function () use ($authorization, $user) {
            $authorization->update([
                'status' => AuthorizationStatus::Negado,
                'approved_by_teacher' => $user->id,
                'teacher_approved_at' => now(),
            ]);

            $action = $authorization->type === AuthorizationType::Entrada
                ? 'Professor negou entrada'
                : 'Professor negou saída';

            $this->logAction($authorization, $action, $user->id);

            $fresh = $authorization->fresh(['student', 'requester', 'teacherApprover', 'portariaApprover']);
            $this->notifications->teacherDenied($fresh, $user);

            return $fresh;
        });
    }

    public function confirmByPortaria(SafeAuthorization $authorization, User $user): SafeAuthorization
    {
        $this->assertStatus($authorization, AuthorizationStatus::LiberadoPortaria, 'A solicitação não está liberada para a portaria.');

        if ($authorization->type !== AuthorizationType::Saida) {
            throw ValidationException::withMessages([
                'type' => ['A portaria só pode confirmar solicitações de saída.'],
            ]);
        }

        return DB::transaction(function () use ($authorization, $user) {
            $authorization->update([
                'status' => AuthorizationStatus::Finalizado,
                'approved_by_portaria' => $user->id,
                'portaria_confirmed_at' => now(),
                'finalized_at' => now(),
            ]);

            $this->logAction($authorization, 'Portaria validou saída', $user->id);

            $fresh = $authorization->fresh(['student', 'requester', 'teacherApprover', 'portariaApprover']);
            $this->notifications->portariaConfirmed($fresh, $user);

            return $fresh;
        });
    }

    public function denyByPortaria(SafeAuthorization $authorization, User $user): SafeAuthorization
    {
        $this->assertStatus($authorization, AuthorizationStatus::LiberadoPortaria, 'A solicitação não está liberada para a portaria.');

        if ($authorization->type !== AuthorizationType::Saida) {
            throw ValidationException::withMessages([
                'type' => ['A portaria só pode recusar solicitações de saída.'],
            ]);
        }

        return DB::transaction(function () use ($authorization, $user) {
            $authorization->update([
                'status' => AuthorizationStatus::Negado,
                'approved_by_portaria' => $user->id,
                'portaria_confirmed_at' => now(),
            ]);

            $this->logAction($authorization, 'Portaria recusou', $user->id);

            $fresh = $authorization->fresh(['student', 'requester', 'teacherApprover', 'portariaApprover']);
            $this->notifications->portariaDenied($fresh, $user);

            return $fresh;
        });
    }

    public function parseScheduledAt(string $date, string $time): Carbon
    {
        return Carbon::createFromFormat('Y-m-d H:i', $date.' '.$time);
    }

    public function generateProtocol(): string
    {
        $year = now()->format('Y');
        $prefix = 'SAF'.$year.'-';

        $last = SafeAuthorization::query()
            ->where('protocol', 'like', $prefix.'%')
            ->orderByDesc('protocol')
            ->value('protocol');

        $next = 1;
        if ($last) {
            $parts = explode('-', $last);
            $number = (int) ($parts[1] ?? 0);
            $next = $number + 1;
        }

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $protocol = $prefix.str_pad((string) $next, 5, '0', STR_PAD_LEFT);
            if (! SafeAuthorization::query()->where('protocol', $protocol)->exists()) {
                return $protocol;
            }
            $next++;
        }

        return $prefix.str_pad((string) random_int(1, 99999), 5, '0', STR_PAD_LEFT);
    }

    public function logAction(SafeAuthorization $authorization, string $action, ?int $userId): void
    {
        SafeAuthorizationLog::query()->create([
            'safe_authorization_id' => $authorization->id,
            'action' => $action,
            'user_id' => $userId,
        ]);
    }

    private function assertEditable(SafeAuthorization $authorization): void
    {
        if (in_array($authorization->status, [AuthorizationStatus::Finalizado, AuthorizationStatus::Negado], true)) {
            throw ValidationException::withMessages([
                'status' => ['Solicitações finalizadas ou negadas não podem ser editadas.'],
            ]);
        }
    }

    private function assertStatus(SafeAuthorization $authorization, AuthorizationStatus $expected, string $message): void
    {
        if ($authorization->status !== $expected) {
            throw ValidationException::withMessages([
                'status' => [$message],
            ]);
        }
    }
}
