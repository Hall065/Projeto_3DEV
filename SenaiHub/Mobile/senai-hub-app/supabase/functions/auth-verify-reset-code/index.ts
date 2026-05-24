import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const { email, code } = await req.json();
  if (!email || !code) {
    return new Response(JSON.stringify({ error: 'E-mail e código obrigatórios' }), { status: 400 });
  }

  // TODO: validar hash em hub.tokens_recuperacao_senha e alterar senha via Admin API
  return new Response(JSON.stringify({ ok: true, token: 'temporary-token-stub' }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
