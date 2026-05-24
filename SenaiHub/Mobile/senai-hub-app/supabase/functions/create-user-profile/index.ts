import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Usuario nao autenticado.' }), { status: 401, headers });
  }

  const { data: callerData, error: callerError } = await supabase.auth.getUser(token);
  if (callerError || !callerData.user) {
    return new Response(JSON.stringify({ error: 'Sessao invalida.' }), { status: 401, headers });
  }

  const { data: callerProfile, error: callerProfileError } = await supabase
    .schema('hub')
    .from('usuarios')
    .select('tipo_usuario, status')
    .eq('id', callerData.user.id)
    .maybeSingle();

  const canCreateUsers =
    callerProfile?.status === 'ativo' &&
    ['admin', 'secretaria', 'direcao'].includes(String(callerProfile.tipo_usuario));

  if (callerProfileError || !canCreateUsers) {
    return new Response(
      JSON.stringify({ error: 'Sem permissao para criar usuarios.' }),
      { status: 403, headers }
    );
  }

  const {
    email,
    password,
    senha,
    nome,
    tipo,
    tipo_usuario,
    email_institucional,
    telefone,
    cpf,
    status = 'ativo',
  } = await req.json();

  const normalizedEmail = String(email ?? '').trim().toLowerCase();
  const initialPassword = String(password ?? senha ?? '').trim();
  const tipoUsuario = String(tipo_usuario ?? tipo ?? 'aluno').trim();

  if (!normalizedEmail || !initialPassword || !nome) {
    return new Response(
      JSON.stringify({ error: 'email, senha e nome sao obrigatorios.' }),
      { status: 400, headers }
    );
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password: initialPassword,
    email_confirm: true,
    user_metadata: {
      nome,
      tipo_usuario: tipoUsuario,
      email_institucional: email_institucional ?? normalizedEmail,
      telefone,
      cpf,
    },
  });

  if (authError || !authData.user) {
    return new Response(JSON.stringify({ error: authError?.message }), { status: 400, headers });
  }

  const { error: profileError } = await supabase
    .schema('hub')
    .from('usuarios')
    .upsert(
      {
        id: authData.user.id,
        nome,
        email: normalizedEmail,
        email_institucional: email_institucional ?? normalizedEmail,
        tipo_usuario: tipoUsuario,
        status,
        telefone: telefone ?? null,
        cpf: cpf ?? null,
      },
      { onConflict: 'id' }
    );

  if (profileError) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    return new Response(JSON.stringify({ error: profileError.message }), { status: 400, headers });
  }

  return new Response(JSON.stringify({ userId: authData.user.id }), {
    headers,
  });
});
