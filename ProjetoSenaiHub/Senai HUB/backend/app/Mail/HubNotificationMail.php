<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/**
 * Mailable genérico de notificação — equivalente Hub do AtelierMail (confeccaoTB).
 *
 * @param  list<string>  $lines
 * @param  array<string, string>  $details
 */
class HubNotificationMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    /**
     * @param  list<string>  $lines
     * @param  array<string, string>  $details
     */
    public function __construct(
        public readonly string $recipientLabel,
        public readonly string $title,
        public readonly array $lines,
        public readonly ?string $actionUrl = null,
        public readonly ?string $actionLabel = null,
        public readonly array $details = [],
        public readonly string $moduleLabel = 'SENAI HUB',
    ) {
    }

    public function build(): self
    {
        return $this
            ->subject($this->title)
            ->view('emails.hub-notification');
    }
}
