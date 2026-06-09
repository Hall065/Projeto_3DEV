<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <title>Redefinição de senha</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:32px 16px;">
    <tr>
        <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">
                <tr><td style="height:4px;background:linear-gradient(90deg,#021A3A,#e30613);"></td></tr>
                <tr>
                    <td style="padding:32px;">
                        <h1 style="margin:0 0 16px;font-size:22px;color:#021A3A;">Redefinir senha</h1>
                        <p style="margin:0 0 12px;font-size:15px;color:#334155;">Olá, {{ $recipientName }}.</p>
                        <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">
                            Recebemos uma solicitação para redefinir a senha da sua conta no SENAI HUB.
                            Clique no botão abaixo para escolher uma nova senha. O link expira em 60 minutos.
                        </p>
                        <p style="text-align:center;margin:0 0 24px;">
                            <a href="{{ $resetUrl }}" style="display:inline-block;background:#e30613;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">
                                Redefinir senha
                            </a>
                        </p>
                        <p style="margin:0;font-size:13px;color:#64748b;">
                            Se você não solicitou esta alteração, ignore este e-mail.
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
