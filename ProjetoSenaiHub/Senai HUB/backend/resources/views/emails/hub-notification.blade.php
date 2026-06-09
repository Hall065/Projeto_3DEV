<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title }}</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:32px 16px;">
    <tr>
        <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 24px rgba(2,26,58,0.08);">
                <tr>
                    <td style="height:4px;background:linear-gradient(90deg,#021A3A,#e30613);"></td>
                </tr>
                <tr>
                    <td style="padding:28px 32px 8px;">
                        <p style="margin:0;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#e30613;font-weight:700;">
                            {{ $moduleLabel }}
                        </p>
                        <h1 style="margin:12px 0 0;font-size:22px;font-weight:700;color:#021A3A;">{{ $title }}</h1>
                        <p style="margin:12px 0 0;font-size:13px;color:#64748b;">Para: {{ $recipientLabel }}</p>
                    </td>
                </tr>
                <tr>
                    <td style="padding:8px 32px 28px;">
                        @if(!empty($details))
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-collapse:collapse;">
                                @foreach($details as $label => $value)
                                    <tr>
                                        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:11px;text-transform:uppercase;color:#64748b;width:38%;">{{ $label }}</td>
                                        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#021A3A;">{{ $value }}</td>
                                    </tr>
                                @endforeach
                            </table>
                        @endif

                        @foreach($lines as $line)
                            <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#334155;">{{ $line }}</p>
                        @endforeach

                        @if($actionUrl && $actionLabel)
                            <p style="margin:28px 0 0;text-align:center;">
                                <a href="{{ $actionUrl }}" style="display:inline-block;background:#e30613;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:13px;font-weight:600;">
                                    {{ $actionLabel }}
                                </a>
                            </p>
                        @endif
                    </td>
                </tr>
                <tr>
                    <td style="padding:16px 32px;background:#021A3A;text-align:center;">
                        <p style="margin:0;font-size:11px;color:#94a3b8;">SENAI HUB — notificação automática do sistema</p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
