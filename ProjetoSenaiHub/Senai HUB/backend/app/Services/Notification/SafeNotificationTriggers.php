<?php

namespace App\Services\Notification;

use App\Enums\Safe\AuthorizationStatus;
use App\Models\Safe\SafeAuthorization;
use App\Models\User;
use App\Support\HubRole;

class SafeNotificationTriggers
{
    public function __construct(
        private readonly NotificationService $notifications,
    ) {}

    public function authorizationCreated(SafeAuthorization $authorization, ?User $actor = null): void
    {
        $authorization->loadMissing(['student', 'requester']);

        $this->notifications->notifyPermission('safe.approve', [
            'module' => 'safe',
            'type' => 'safe.authorization.created',
            'title' => 'Nova autorização SAFE',
            'message' => "Protocolo {$authorization->protocol}: {$authorization->student_name} aguarda aprovação do professor.",
            'action_url' => '/safe/aprovacoes',
            'entity_type' => 'safe_authorization',
            'entity_id' => $authorization->id,
            'actor_user_id' => $actor?->id,
            'except_user_id' => $actor?->id,
            'severity' => 'info',
            'email_details' => [
                'Protocolo' => $authorization->protocol,
                'Aluno' => $authorization->student_name,
                'Tipo' => $authorization->type->value ?? (string) $authorization->type,
            ],
        ]);
    }

    public function teacherApproved(SafeAuthorization $authorization, ?User $actor = null): void
    {
        if ($authorization->status === AuthorizationStatus::LiberadoPortaria) {
            $this->notifications->notifyPermission('safe.portaria', [
                'module' => 'safe',
                'type' => 'safe.authorization.portaria_pending',
                'title' => 'Saída liberada — portaria',
                'message' => "Protocolo {$authorization->protocol}: {$authorization->student_name} aguarda validação na portaria.",
                'action_url' => '/safe/portaria',
                'entity_type' => 'safe_authorization',
                'entity_id' => $authorization->id,
                'actor_user_id' => $actor?->id,
                'except_user_id' => $actor?->id,
                'severity' => 'warning',
            ]);
        }

        if ($authorization->requested_by) {
            $this->notifications->notify((int) $authorization->requested_by, [
                'module' => 'safe',
                'type' => 'safe.authorization.teacher_approved',
                'title' => 'Autorização aprovada pelo professor',
                'message' => "Protocolo {$authorization->protocol} foi aprovado.",
                'action_url' => '/safe/autorizacoes/'.$authorization->id,
                'entity_type' => 'safe_authorization',
                'entity_id' => $authorization->id,
                'actor_user_id' => $actor?->id,
                'severity' => 'info',
            ]);
        }
    }

    public function teacherDenied(SafeAuthorization $authorization, ?User $actor = null): void
    {
        if ($authorization->requested_by) {
            $this->notifications->notify((int) $authorization->requested_by, [
                'module' => 'safe',
                'type' => 'safe.authorization.teacher_denied',
                'title' => 'Autorização negada pelo professor',
                'message' => "Protocolo {$authorization->protocol} foi negado.",
                'action_url' => '/safe/autorizacoes/'.$authorization->id,
                'entity_type' => 'safe_authorization',
                'entity_id' => $authorization->id,
                'actor_user_id' => $actor?->id,
                'severity' => 'warning',
            ]);
        }
    }

    public function portariaConfirmed(SafeAuthorization $authorization, ?User $actor = null): void
    {
        $this->notifyRequesterAndStaff($authorization, $actor, 'Saída confirmada na portaria', 'info');
    }

    public function portariaDenied(SafeAuthorization $authorization, ?User $actor = null): void
    {
        $this->notifyRequesterAndStaff($authorization, $actor, 'Saída recusada na portaria', 'warning');
    }

    private function notifyRequesterAndStaff(
        SafeAuthorization $authorization,
        ?User $actor,
        string $titleSuffix,
        string $severity,
    ): void {
        if ($authorization->requested_by) {
            $this->notifications->notify((int) $authorization->requested_by, [
                'module' => 'safe',
                'type' => 'safe.authorization.finalized',
                'title' => $titleSuffix,
                'message' => "Protocolo {$authorization->protocol}: {$authorization->student_name}.",
                'action_url' => '/safe/autorizacoes/'.$authorization->id,
                'entity_type' => 'safe_authorization',
                'entity_id' => $authorization->id,
                'actor_user_id' => $actor?->id,
                'severity' => $severity,
            ]);
        }

        $this->notifications->notifyRole(HubRole::SAFE_AQV, [
            'module' => 'safe',
            'type' => 'safe.authorization.finalized_staff',
            'title' => $titleSuffix,
            'message' => "Protocolo {$authorization->protocol} finalizado.",
            'action_url' => '/safe/autorizacoes/'.$authorization->id,
            'entity_type' => 'safe_authorization',
            'entity_id' => $authorization->id,
            'actor_user_id' => $actor?->id,
            'except_user_id' => $actor?->id,
            'severity' => $severity,
        ]);
    }
}
