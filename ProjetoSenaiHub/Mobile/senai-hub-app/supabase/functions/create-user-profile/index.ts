import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json',
};

const MIN_PASSWORD_LENGTH = 6;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
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

  const body = await req.json();
  const {
    action = 'create',
    user_id,
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
    allow_password_update = false,
  } = body;

  const normalizedEmail = String(email ?? '').trim().toLowerCase();
  const initialPassword = String(password ?? senha ?? '').trim();
  const tipoUsuario = String(tipo_usuario ?? tipo ?? 'aluno').trim().toLowerCase().replace(/\s+/g, '_');
  const allowPasswordUpdate = allow_password_update === true;

  const callerRole = String(callerProfile?.tipo_usuario ?? '');
  const canCreateUsers =
    callerProfile?.status === 'ativo' &&
    ['admin', 'secretaria', 'direcao', 'connect_secretaria', 'connect_aqv'].includes(callerRole);
  const canCreateMaintenanceUser =
    callerProfile?.status === 'ativo' &&
    ['gerente_manutencao', 'grid_chefe'].includes(callerRole) &&
    ['manutencao', 'grid_funcionario'].includes(tipoUsuario);

  if (action === 'delete') {
    if (callerProfileError || !canCreateUsers) {
      return new Response(
        JSON.stringify({ error: 'Sem permissao para reverter cadastros de usuarios.' }),
        { status: 403, headers }
      );
    }

    const targetUserId = String(user_id ?? '').trim();
    if (!targetUserId || targetUserId === callerData.user.id) {
      return new Response(
        JSON.stringify({ error: 'Usuario de reversao invalido.' }),
        { status: 400, headers }
      );
    }

    const { data: targetProfile, error: targetProfileError } = await supabase
      .schema('hub')
      .from('usuarios')
      .select('id, tipo_usuario')
      .eq('id', targetUserId)
      .maybeSingle();

    if (targetProfileError) {
      return new Response(JSON.stringify({ error: targetProfileError.message }), { status: 400, headers });
    }

    if (targetProfile && !['aluno', 'connect_aluno'].includes(String(targetProfile.tipo_usuario ?? ''))) {
      return new Response(
        JSON.stringify({ error: 'A reversao automatica so pode remover usuarios de aluno.' }),
        { status: 400, headers }
      );
    }

    const { error: deleteProfileError } = await supabase
      .schema('hub')
      .from('usuarios')
      .delete()
      .eq('id', targetUserId);

    if (deleteProfileError) {
      return new Response(JSON.stringify({ error: deleteProfileError.message }), { status: 400, headers });
    }

    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(targetUserId);
    if (deleteAuthError && !deleteAuthError.message.toLowerCase().includes('not found')) {
      return new Response(JSON.stringify({ error: deleteAuthError.message }), { status: 400, headers });
    }

    return new Response(JSON.stringify({ userId: targetUserId }), { headers });
  }

  if (action === 'update_password') {
    const targetUserId = String(user_id ?? '').trim();
    if (!targetUserId || !initialPassword) {
      return new Response(
        JSON.stringify({ error: 'user_id e senha sao obrigatorios para alterar senha.' }),
        { status: 400, headers }
      );
    }

    if (initialPassword.length < MIN_PASSWORD_LENGTH) {
      return new Response(
        JSON.stringify({ error: `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.` }),
        { status: 400, headers }
      );
    }

    const { data: targetProfile, error: targetProfileError } = await supabase
      .schema('hub')
      .from('usuarios')
      .select('id, tipo_usuario')
      .eq('id', targetUserId)
      .maybeSingle();

    if (targetProfileError || !targetProfile) {
      return new Response(
        JSON.stringify({ error: targetProfileError?.message ?? 'Usuario nao encontrado em hub.usuarios.' }),
        { status: 400, headers }
      );
    }

    const targetRole = String(targetProfile.tipo_usuario ?? '');
    const canUpdatePassword =
      canCreateUsers ||
      (
        callerProfile?.status === 'ativo' &&
        ['gerente_manutencao', 'grid_chefe'].includes(callerRole) &&
        ['manutencao', 'grid_funcionario'].includes(targetRole)
      );

    if (callerProfileError || !canUpdatePassword) {
      return new Response(
        JSON.stringify({ error: 'Sem permissao para alterar senha deste usuario.' }),
        { status: 403, headers }
      );
    }

    const { error: updateAuthError } = await supabase.auth.admin.updateUserById(targetUserId, {
      password: initialPassword,
    });

    if (updateAuthError) {
      return new Response(JSON.stringify({ error: updateAuthError.message }), { status: 400, headers });
    }

    return new Response(JSON.stringify({ userId: targetUserId }), { headers });
  }

  if (callerProfileError || (!canCreateUsers && !canCreateMaintenanceUser)) {
    return new Response(
      JSON.stringify({ error: 'Sem permissao para criar usuarios.' }),
      { status: 403, headers }
    );
  }

  if (!normalizedEmail || !initialPassword || !nome) {
    return new Response(
      JSON.stringify({ error: 'email, senha e nome sao obrigatorios.' }),
      { status: 400, headers }
    );
  }

  if (initialPassword.length < MIN_PASSWORD_LENGTH) {
    return new Response(
      JSON.stringify({ error: `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.` }),
      { status: 400, headers }
    );
  }

  const userMetadata = {
    nome,
    tipo_usuario: tipoUsuario,
    email_institucional: email_institucional ?? normalizedEmail,
    telefone,
    cpf,
  };

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password: initialPassword,
    email_confirm: true,
    user_metadata: userMetadata,
  });

  let userId = authData?.user?.id ?? null;

  if (authError || !userId) {
    if (!allowPasswordUpdate) {
      return new Response(JSON.stringify({ error: authError?.message }), { status: 400, headers });
    }

    const { data: existingProfile } = await supabase
      .schema('hub')
      .from('usuarios')
      .select('id')
      .or(`email.eq.${normalizedEmail},email_institucional.eq.${normalizedEmail}`)
      .maybeSingle();

    if (!existingProfile?.id) {
      return new Response(JSON.stringify({ error: authError?.message }), { status: 400, headers });
    }

    const { error: updateAuthError } = await supabase.auth.admin.updateUserById(existingProfile.id, {
      password: initialPassword,
      user_metadata: userMetadata,
    });

    if (updateAuthError) {
      return new Response(JSON.stringify({ error: updateAuthError.message }), { status: 400, headers });
    }

    userId = existingProfile.id;
  }

  const { error: profileError } = await supabase
    .schema('hub')
    .from('usuarios')
    .upsert(
      {
        id: userId,
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
    if (authData?.user?.id) {
      await supabase.auth.admin.deleteUser(authData.user.id);
    }
    return new Response(JSON.stringify({ error: profileError.message }), { status: 400, headers });
  }

  return new Response(JSON.stringify({ userId }), {
    headers,
  });
});
