-- Crie primeiro o usuario em Authentication > Users.
-- Depois copie o UUID dele e rode este script no SQL Editor.

do $$
declare
  v_auth_user_id uuid := 'COLE_AQUI_O_UUID_DO_AUTH_USER'::uuid;
  v_nome text := 'Secretaria SENAI';
  v_cpf text := '000.000.000-01';
  v_telefone text := '(19) 99999-0000';
begin
  if not exists (select 1 from auth.users where id = v_auth_user_id) then
    raise exception 'Usuario nao existe em auth.users. Crie primeiro em Authentication > Users.';
  end if;

  insert into hub.usuarios (
    id,
    nome,
    email,
    email_institucional,
    tipo_usuario,
    status,
    cpf,
    telefone
  )
  select
    au.id,
    v_nome,
    au.email::public.citext,
    au.email::public.citext,
    'secretaria',
    'ativo',
    v_cpf,
    v_telefone
  from auth.users au
  where au.id = v_auth_user_id
  on conflict (id) do update
    set nome = excluded.nome,
        email = excluded.email,
        email_institucional = excluded.email_institucional,
        tipo_usuario = excluded.tipo_usuario,
        status = excluded.status,
        cpf = excluded.cpf,
        telefone = excluded.telefone,
        atualizado_em = now();

  update hub.usuario_aplicacoes
     set ativo = true,
         perfil = 'secretaria'
   where usuario_id = v_auth_user_id;
end $$;
