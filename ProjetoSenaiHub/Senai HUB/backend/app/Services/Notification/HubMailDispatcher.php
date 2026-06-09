<?php

namespace App\Services\Notification;

use App\Mail\HubNotificationMail;
use App\Models\User;
use App\Support\NotificationPreferences;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Envio transacional de e-mail do SENAI HUB.
 *
 * Padrão portado do AtelierMail + AtelierNotifier (confeccaoTB): Mailable genérico,
 * redirect opcional em dev e Mail::to()->send(). Nenhuma outra lógica do projeto
 * confecção foi trazida para o Hub.
 */
class HubMailDispatcher
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function sendForUser(User $user, array $payload): void
    {
        $module = (string) ($payload['module'] ?? 'hub');
        if (! NotificationPreferences::allowsEmail($user, $module)) {
            return;
        }

        $this->send(
            to: $this->resolveRecipient($user->email),
            recipientLabel: $user->name,
            payload: $payload,
        );
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function sendToAddress(string $email, string $recipientLabel, array $payload): void
    {
        if (! filled($email)) {
            return;
        }

        $this->send(
            to: $this->resolveRecipient($email),
            recipientLabel: $recipientLabel,
            payload: $payload,
        );
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function send(string $to, string $recipientLabel, array $payload): void
    {
        $module = (string) ($payload['module'] ?? 'hub');
        $title = (string) ($payload['title'] ?? 'Notificação SENAI HUB');
        $lines = $this->resolveLines($payload);
        $details = is_array($payload['email_details'] ?? null) ? $payload['email_details'] : [];
        $actionUrl = $this->resolveActionUrl($payload);
        $actionLabel = (string) ($payload['action_label'] ?? 'Abrir no sistema');

        Log::info('SENAI HUB e-mail', [
            'to' => $to,
            'module' => $module,
            'title' => $title,
        ]);

        try {
            Mail::to($to)->send(new HubNotificationMail(
                recipientLabel: $recipientLabel,
                title: $title,
                lines: $lines,
                actionUrl: $actionUrl,
                actionLabel: $actionLabel,
                details: $details,
                moduleLabel: $this->moduleLabel($module),
            ));
        } catch (\Throwable $e) {
            Log::warning('hub.mail.failed', [
                'email' => $to,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Em dev, redireciona todos os e-mails para HUB_NOTIFICATION_EMAIL
     * (mesmo comportamento de redirect_all_mail no confeccaoTB).
     */
    private function resolveRecipient(string $email): string
    {
        if (config('hub.mail.redirect_all', false)) {
            return (string) config('hub.mail.notification_email', $email);
        }

        return $email;
    }

    private function resolveActionUrl(array $payload): ?string
    {
        $actionPath = $payload['action_url'] ?? null;
        if (! filled($actionPath)) {
            return null;
        }

        if (str_starts_with((string) $actionPath, 'http')) {
            return (string) $actionPath;
        }

        $frontend = rtrim((string) config('hub.frontend_url', 'http://127.0.0.1:5173'), '/');

        return $frontend.$actionPath;
    }

    private function moduleLabel(string $module): string
    {
        return match ($module) {
            'connect' => 'SENAI Connect',
            'grid' => 'SENAI Grid',
            'safe' => 'SENAI SAFE',
            default => 'SENAI HUB',
        };
    }

    /**
     * Corpo do e-mail: menos detalhado que a notificação in-app, mas indica o módulo/responsabilidade.
     *
     * @param  array<string, mixed>  $payload
     * @return list<string>
     */
    private function resolveLines(array $payload): array
    {
        if (isset($payload['email_lines']) && is_array($payload['email_lines'])) {
            return array_values(array_filter(array_map('strval', $payload['email_lines'])));
        }

        $module = (string) ($payload['module'] ?? 'hub');
        $summary = filled($payload['email_message'] ?? null)
            ? (string) $payload['email_message']
            : (string) ($payload['message'] ?? 'Você tem uma nova atualização no sistema.');

        return [
            $summary,
            $this->responsibilityHint($module),
        ];
    }

    private function responsibilityHint(string $module): string
    {
        return match ($module) {
            'connect' => 'Acesse o SENAI Connect para conferir suas pendências acadêmicas.',
            'grid' => 'Acesse o SENAI Grid para acompanhar chamados e tarefas sob sua responsabilidade.',
            'safe' => 'Acesse o SENAI SAFE para tratar autorizações e fluxos escolares pendentes.',
            default => 'Acesse o SENAI HUB para ver detalhes da sua conta e dos módulos disponíveis.',
        };
    }
}
