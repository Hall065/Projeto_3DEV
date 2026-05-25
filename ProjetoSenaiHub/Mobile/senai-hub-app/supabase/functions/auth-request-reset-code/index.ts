import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

/**
 * Edge Function opcional: gera código de 6 dígitos e envia via Brevo.
 * Credenciais SMTP apenas em variáveis de ambiente do Supabase.
 */
serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const { email } = await req.json();
  if (!email) {
    return new Response(JSON.stringify({ error: 'E-mail obrigatório' }), { status: 400 });
  }

  // TODO: validar usuário, gerar hash em hub.tokens_recuperacao_senha, enviar via Brevo
  return new Response(JSON.stringify({ ok: true, message: 'Código enviado (stub)' }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
