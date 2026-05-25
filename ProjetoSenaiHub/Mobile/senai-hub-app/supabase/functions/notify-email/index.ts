import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const { to, subject, html } = await req.json();

  // SMTP Brevo — variáveis: SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_EMAIL_FROM
  // Nunca expor credenciais no app Expo
  console.log('notify-email stub', { to, subject, htmlLength: html?.length });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
