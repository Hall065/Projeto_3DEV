<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class HubResetPasswordMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public readonly string $resetUrl,
        public readonly string $recipientName,
    ) {
    }

    public function build(): self
    {
        return $this
            ->subject('Redefinição de senha — SENAI HUB')
            ->view('emails.reset-password');
    }
}
