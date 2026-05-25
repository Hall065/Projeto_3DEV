create extension if not exists pgcrypto;
create extension if not exists citext;

create schema if not exists hub;
create schema if not exists connect;
create schema if not exists grid;

create type hub.tipo_usuario as enum (
  'aluno',
  'professor',
  'secretaria',
  'direcao',
  'manutencao',
  'gerente_manutencao',
  'empresa'
);

create type hub.status_usuario as enum ('ativo', 'inativo', 'bloqueado', 'pendente');
create type hub.codigo_aplicacao as enum ('connect', 'grid');
create type connect.status_frequencia as enum ('P', 'FJ', 'FI');
create type connect.periodo_turma as enum ('manha', 'tarde', 'noite');
create type grid.prioridade_chamado as enum ('baixa', 'media', 'alta', 'urgente');
create type grid.status_chamado as enum ('aberto', 'aguardando', 'em_andamento', 'concluida');
create type grid.status_estoque as enum ('disponivel', 'estoque_baixo', 'reservado', 'esgotado');
create type grid.tipo_movimentacao as enum ('entrada', 'saida', 'reserva', 'retorno');

create or replace function hub.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create or replace function hub.jwt_usuario_id()
returns uuid
language sql
stable
as $$
  select nullif((nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'hub_user_id'), '')::uuid;
$$;

create or replace function hub.jwt_tipo_usuario()
returns hub.tipo_usuario
language sql
stable
as $$
  select nullif((nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'tipo_usuario'), '')::hub.tipo_usuario;
$$;

create or replace function hub.is_staff()
returns boolean
language sql
stable
as $$
  select hub.jwt_tipo_usuario() in ('professor', 'secretaria', 'direcao', 'manutencao', 'gerente_manutencao');
$$;

create or replace function hub.is_connect_admin()
returns boolean
language sql
stable
as $$
  select hub.jwt_tipo_usuario() in ('secretaria', 'direcao');
$$;

create or replace function hub.is_grid_manager()
returns boolean
language sql
stable
as $$
  select hub.jwt_tipo_usuario() in ('gerente_manutencao', 'direcao');
$$;

create table if not exists hub.usuarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email citext not null unique,
  senha_hash text not null,
  tipo_usuario hub.tipo_usuario not null,
  status hub.status_usuario not null default 'pendente',
  foto_arquivo_id uuid,
  cpf text unique,
  telefone text,
  email_institucional citext,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists hub.aplicacoes (
  id uuid primary key default gen_random_uuid(),
  codigo hub.codigo_aplicacao not null unique,
  nome text not null,
  descricao text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists hub.usuario_aplicacoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references hub.usuarios(id) on delete cascade,
  aplicacao_id uuid not null references hub.aplicacoes(id) on delete cascade,
  perfil text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  unique (usuario_id, aplicacao_id)
);

create table if not exists hub.arquivos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references hub.usuarios(id) on delete set null,
  bucket text not null default 'senai-hub',
  caminho text not null,
  nome_original text not null,
  mime_type text,
  tamanho_bytes bigint,
  url_publica text,
  criado_em timestamptz not null default now()
);

alter table hub.usuarios
  add constraint usuarios_foto_arquivo_fk foreign key (foto_arquivo_id) references hub.arquivos(id) on delete set null;

create table if not exists hub.notificacoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references hub.usuarios(id) on delete cascade,
  titulo text not null,
  corpo text not null,
  lida boolean not null default false,
  dados jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now()
);

create table if not exists hub.logs_acesso (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references hub.usuarios(id) on delete set null,
  aplicacao hub.codigo_aplicacao,
  ip inet,
  user_agent text,
  acao text not null,
  sucesso boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists hub.sessoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references hub.usuarios(id) on delete cascade,
  token_hash text not null,
  device_id text,
  user_agent text,
  expira_em timestamptz not null default (now() + interval '12 hours'),
  revogada_em timestamptz,
  criado_em timestamptz not null default now()
);

create table if not exists hub.tokens_recuperacao_senha (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references hub.usuarios(id) on delete cascade,
  codigo_hash text not null,
  recovery_token_hash text,
  expira_em timestamptz not null,
  usado_em timestamptz,
  tentativas int not null default 0,
  criado_em timestamptz not null default now()
);

create table if not exists hub.blocos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  descricao text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists hub.salas (
  id uuid primary key default gen_random_uuid(),
  bloco_id uuid not null references hub.blocos(id) on delete restrict,
  nome text not null,
  tipo text not null default 'sala',
  capacidade int,
  andar text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (bloco_id, nome)
);

create index if not exists usuarios_tipo_status_idx on hub.usuarios (tipo_usuario, status);
create index if not exists notificacoes_usuario_lida_idx on hub.notificacoes (usuario_id, lida, criado_em desc);
create index if not exists sessoes_usuario_expira_idx on hub.sessoes (usuario_id, expira_em desc);
create index if not exists tokens_usuario_expira_idx on hub.tokens_recuperacao_senha (usuario_id, expira_em desc);
create index if not exists salas_bloco_idx on hub.salas (bloco_id);

create trigger usuarios_updated_at before update on hub.usuarios for each row execute function hub.set_updated_at();
create trigger blocos_updated_at before update on hub.blocos for each row execute function hub.set_updated_at();
create trigger salas_updated_at before update on hub.salas for each row execute function hub.set_updated_at();
create table if not exists connect.cursos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  descricao text,
  modalidade text not null default 'tecnico',
  carga_horaria int not null,
  status text not null default 'ativo',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists connect.professores (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null unique references hub.usuarios(id) on delete cascade,
  especialidade text not null,
  data_contratacao date,
  status hub.status_usuario not null default 'ativo',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists connect.turmas (
  id uuid primary key default gen_random_uuid(),
  curso_id uuid not null references connect.cursos(id) on delete restrict,
  professor_responsavel_id uuid references connect.professores(id) on delete set null,
  sala_id uuid references hub.salas(id) on delete set null,
  nome text not null unique,
  periodo connect.periodo_turma not null,
  data_inicio date not null,
  data_termino date not null,
  status text not null default 'ativa',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists connect.alunos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null unique references hub.usuarios(id) on delete cascade,
  curso_id uuid references connect.cursos(id) on delete set null,
  turma_id uuid references connect.turmas(id) on delete set null,
  rm text not null unique,
  email_pessoal citext,
  email_institucional citext,
  empresa_nome text,
  data_nascimento date,
  nome_responsavel text,
  status hub.status_usuario not null default 'ativo',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists connect.turma_alunos (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references connect.turmas(id) on delete cascade,
  aluno_id uuid not null references connect.alunos(id) on delete cascade,
  data_entrada date not null default current_date,
  data_saida date,
  ativo boolean not null default true,
  unique (turma_id, aluno_id)
);

create table if not exists connect.professor_turmas (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references connect.professores(id) on delete cascade,
  turma_id uuid not null references connect.turmas(id) on delete cascade,
  disciplina text,
  ativo boolean not null default true,
  unique (professor_id, turma_id, disciplina)
);

create table if not exists connect.aulas (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references connect.turmas(id) on delete cascade,
  professor_id uuid references connect.professores(id) on delete set null,
  sala_id uuid references hub.salas(id) on delete set null,
  data date not null,
  disciplina text not null,
  inicio time not null,
  fim time not null,
  quantidade_aulas int not null default 1,
  criado_por uuid references hub.usuarios(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists connect.frequencias (
  id uuid primary key default gen_random_uuid(),
  aula_id uuid not null references connect.aulas(id) on delete cascade,
  aluno_id uuid not null references connect.alunos(id) on delete cascade,
  status connect.status_frequencia not null,
  observacao text,
  criado_por uuid references hub.usuarios(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (aula_id, aluno_id)
);

create table if not exists connect.contratos_alunos (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references connect.alunos(id) on delete cascade,
  empresa_nome text not null,
  carga_horaria int not null check (carga_horaria in (4, 8)),
  carteira_trabalho text,
  email_empresa citext,
  arquivo_id uuid references hub.arquivos(id) on delete set null,
  data_inicio date not null,
  data_fim date,
  status text not null default 'ativo',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists connect.salarios_alunos (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references connect.alunos(id) on delete cascade,
  contrato_id uuid references connect.contratos_alunos(id) on delete set null,
  mes date not null,
  salario_base numeric(12, 2) not null,
  valor_dia numeric(12, 2) not null,
  outros_descontos numeric(12, 2) not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (aluno_id, mes)
);

create table if not exists connect.calculos_salario (
  id uuid primary key default gen_random_uuid(),
  salario_id uuid not null references connect.salarios_alunos(id) on delete cascade,
  dias_uteis int not null,
  dias_trabalhados int not null,
  faltas_justificadas int not null,
  faltas_injustificadas int not null,
  frequencia_percentual numeric(6, 2) not null,
  desconto_faltas numeric(12, 2) not null,
  salario_final numeric(12, 2) not null,
  status text not null default 'calculado',
  calculado_em timestamptz not null default now()
);

create table if not exists connect.localizacoes_alunos (
  aluno_id uuid primary key references connect.alunos(id) on delete cascade,
  latitude numeric(10, 7) not null,
  longitude numeric(10, 7) not null,
  dentro_do_senai boolean not null default false,
  atualizado_em timestamptz not null default now()
);

create index if not exists alunos_turma_idx on connect.alunos (turma_id, status);
create index if not exists alunos_curso_idx on connect.alunos (curso_id);
create index if not exists turmas_curso_idx on connect.turmas (curso_id);
create index if not exists aulas_turma_data_idx on connect.aulas (turma_id, data desc);
create index if not exists frequencias_aluno_idx on connect.frequencias (aluno_id, criado_em desc);
create index if not exists contratos_aluno_status_idx on connect.contratos_alunos (aluno_id, status);
create index if not exists localizacoes_dentro_idx on connect.localizacoes_alunos (dentro_do_senai, atualizado_em desc);

create trigger cursos_updated_at before update on connect.cursos for each row execute function hub.set_updated_at();
create trigger professores_updated_at before update on connect.professores for each row execute function hub.set_updated_at();
create trigger turmas_updated_at before update on connect.turmas for each row execute function hub.set_updated_at();
create trigger alunos_updated_at before update on connect.alunos for each row execute function hub.set_updated_at();
create trigger aulas_updated_at before update on connect.aulas for each row execute function hub.set_updated_at();
create trigger frequencias_updated_at before update on connect.frequencias for each row execute function hub.set_updated_at();
create trigger contratos_updated_at before update on connect.contratos_alunos for each row execute function hub.set_updated_at();
create trigger salarios_updated_at before update on connect.salarios_alunos for each row execute function hub.set_updated_at();
create table if not exists grid.categorias_manutencao (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  descricao text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists grid.itens_estoque (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid references grid.categorias_manutencao(id) on delete set null,
  titulo text not null,
  descricao text not null,
  quantidade_disponivel int not null default 0,
  quantidade_minima int not null default 0,
  unidade text not null default 'un',
  localizacao text not null,
  empresa_distribuidora text,
  custo numeric(12, 2) not null default 0,
  status grid.status_estoque not null default 'disponivel',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists grid.chamados (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  solicitante_id uuid not null references hub.usuarios(id) on delete restrict,
  titulo text not null,
  descricao text not null,
  sala_id uuid references hub.salas(id) on delete set null,
  bloco_id uuid references hub.blocos(id) on delete set null,
  categoria_id uuid references grid.categorias_manutencao(id) on delete set null,
  prioridade grid.prioridade_chamado not null default 'media',
  status grid.status_chamado not null default 'aberto',
  responsavel_id uuid references hub.usuarios(id) on delete set null,
  item_atribuido_id uuid references grid.itens_estoque(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  concluido_em timestamptz
);

create table if not exists grid.tarefas (
  id uuid primary key default gen_random_uuid(),
  chamado_id uuid not null unique references grid.chamados(id) on delete cascade,
  responsavel_id uuid references hub.usuarios(id) on delete set null,
  item_id uuid references grid.itens_estoque(id) on delete set null,
  status grid.status_chamado not null default 'aberto',
  inicio_reparo timestamptz,
  fim_reparo timestamptz,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists grid.movimentacoes_estoque (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references grid.itens_estoque(id) on delete cascade,
  usuario_id uuid references hub.usuarios(id) on delete set null,
  tipo grid.tipo_movimentacao not null,
  quantidade int not null check (quantidade > 0),
  motivo text not null,
  saldo_apos int not null,
  custo_unitario numeric(12, 2),
  criado_em timestamptz not null default now()
);

create table if not exists grid.chamado_itens (
  id uuid primary key default gen_random_uuid(),
  chamado_id uuid not null references grid.chamados(id) on delete cascade,
  item_id uuid not null references grid.itens_estoque(id) on delete restrict,
  quantidade int not null check (quantidade > 0),
  retornado boolean not null default false,
  criado_em timestamptz not null default now(),
  unique (chamado_id, item_id)
);

create table if not exists grid.relatorios (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  periodo_inicio date not null,
  periodo_fim date not null,
  filtros jsonb not null default '{}'::jsonb,
  dados jsonb not null default '{}'::jsonb,
  criado_por uuid references hub.usuarios(id) on delete set null,
  criado_em timestamptz not null default now()
);

create index if not exists chamados_status_prioridade_idx on grid.chamados (status, prioridade, criado_em desc);
create index if not exists chamados_responsavel_idx on grid.chamados (responsavel_id, status);
create index if not exists tarefas_responsavel_status_idx on grid.tarefas (responsavel_id, status);
create index if not exists estoque_status_idx on grid.itens_estoque (status, quantidade_disponivel);
create index if not exists movimentacoes_item_idx on grid.movimentacoes_estoque (item_id, criado_em desc);

create trigger itens_estoque_updated_at before update on grid.itens_estoque for each row execute function hub.set_updated_at();
create trigger chamados_updated_at before update on grid.chamados for each row execute function hub.set_updated_at();
create trigger tarefas_updated_at before update on grid.tarefas for each row execute function hub.set_updated_at();
create or replace function hub.hash_password(p_password text)
returns text
language sql
stable
as $$
  select crypt(p_password, gen_salt('bf', 12));
$$;

create or replace function hub.check_password(p_password text, p_hash text)
returns boolean
language sql
stable
as $$
  select p_hash = crypt(p_password, p_hash);
$$;

create or replace function hub.mobile_login(p_email citext, p_senha text)
returns jsonb
language plpgsql
security definer
set search_path = hub, connect, grid, public
as $$
declare
  v_user hub.usuarios%rowtype;
  v_token text := encode(gen_random_bytes(32), 'hex');
begin
  select * into v_user
  from hub.usuarios
  where email = p_email
    and status = 'ativo';

  if v_user.id is null or not hub.check_password(p_senha, v_user.senha_hash) then
    raise exception 'Credenciais invalidas.';
  end if;

  insert into hub.sessoes (usuario_id, token_hash)
  values (v_user.id, digest(v_token, 'sha256')::text);

  insert into hub.logs_acesso (usuario_id, acao, sucesso)
  values (v_user.id, 'mobile_login', true);

  return jsonb_build_object(
    'token', v_token,
    'user', jsonb_build_object(
      'id', v_user.id,
      'nome', v_user.nome,
      'email', v_user.email,
      'tipo_usuario', v_user.tipo_usuario,
      'status', v_user.status,
      'foto_url', null,
      'cpf', v_user.cpf,
      'telefone', v_user.telefone
    )
  );
end;
$$;

create or replace function hub.request_password_reset(p_email citext)
returns jsonb
language plpgsql
security definer
set search_path = hub, public
as $$
declare
  v_user hub.usuarios%rowtype;
  v_code text := lpad((floor(random() * 1000000))::int::text, 6, '0');
  v_reset_id uuid;
  v_expira timestamptz := now() + interval '15 minutes';
begin
  select * into v_user from hub.usuarios where email = p_email and status = 'ativo';

  if v_user.id is null then
    return jsonb_build_object('reset_id', null, 'expires_at', v_expira);
  end if;

  insert into hub.tokens_recuperacao_senha (usuario_id, codigo_hash, expira_em)
  values (v_user.id, crypt(v_code, gen_salt('bf', 10)), v_expira)
  returning id into v_reset_id;

  -- A Edge Function com BREVO_API_KEY deve ler este codigo antes de enviar o e-mail.
  -- BREVO_API_KEY nunca deve ficar no client mobile.
  return jsonb_build_object('reset_id', v_reset_id, 'expires_at', v_expira, 'dev_code', v_code);
end;
$$;

create or replace function hub.validate_password_otp(p_email citext, p_codigo text)
returns jsonb
language plpgsql
security definer
set search_path = hub, public
as $$
declare
  v_token hub.tokens_recuperacao_senha%rowtype;
  v_recovery text := encode(gen_random_bytes(32), 'hex');
begin
  select t.* into v_token
  from hub.tokens_recuperacao_senha t
  join hub.usuarios u on u.id = t.usuario_id
  where u.email = p_email
    and t.usado_em is null
    and t.expira_em > now()
  order by t.criado_em desc
  limit 1;

  if v_token.id is null then
    raise exception 'Codigo expirado ou inexistente.';
  end if;

  update hub.tokens_recuperacao_senha
  set tentativas = tentativas + 1
  where id = v_token.id;

  if not hub.check_password(p_codigo, v_token.codigo_hash) then
    raise exception 'Codigo invalido.';
  end if;

  update hub.tokens_recuperacao_senha
  set recovery_token_hash = digest(v_recovery, 'sha256')::text
  where id = v_token.id;

  return jsonb_build_object('recovery_token', v_recovery);
end;
$$;

create or replace function hub.reset_password_with_token(p_recovery_token text, p_nova_senha text)
returns void
language plpgsql
security definer
set search_path = hub, public
as $$
declare
  v_token hub.tokens_recuperacao_senha%rowtype;
begin
  select * into v_token
  from hub.tokens_recuperacao_senha
  where recovery_token_hash = digest(p_recovery_token, 'sha256')::text
    and usado_em is null
    and expira_em > now()
  order by criado_em desc
  limit 1;

  if v_token.id is null then
    raise exception 'Token de recuperacao invalido.';
  end if;

  update hub.usuarios
  set senha_hash = hub.hash_password(p_nova_senha)
  where id = v_token.usuario_id;

  update hub.tokens_recuperacao_senha
  set usado_em = now()
  where id = v_token.id;
end;
$$;

create or replace function connect.salvar_chamada(p_aula jsonb, p_frequencias jsonb)
returns uuid
language plpgsql
security definer
set search_path = connect, hub, public
as $$
declare
  v_aula_id uuid;
  v_item jsonb;
begin
  insert into connect.aulas (turma_id, professor_id, sala_id, data, disciplina, inicio, fim, quantidade_aulas, criado_por)
  values (
    (p_aula ->> 'turma_id')::uuid,
    nullif(p_aula ->> 'professor_id', '')::uuid,
    nullif(p_aula ->> 'sala_id', '')::uuid,
    coalesce((p_aula ->> 'data')::date, current_date),
    coalesce(p_aula ->> 'disciplina', 'Aula registrada'),
    coalesce((p_aula ->> 'inicio')::time, '08:00'::time),
    coalesce((p_aula ->> 'fim')::time, '09:40'::time),
    coalesce((p_aula ->> 'quantidade_aulas')::int, 1),
    hub.jwt_usuario_id()
  )
  returning id into v_aula_id;

  for v_item in select * from jsonb_array_elements(p_frequencias)
  loop
    insert into connect.frequencias (aula_id, aluno_id, status, criado_por)
    values (v_aula_id, (v_item ->> 'aluno_id')::uuid, (v_item ->> 'status')::connect.status_frequencia, hub.jwt_usuario_id())
    on conflict (aula_id, aluno_id)
    do update set status = excluded.status, atualizado_em = now();
  end loop;

  return v_aula_id;
end;
$$;

create or replace function connect.calcular_salario_aluno(p_aluno_id uuid, p_mes text)
returns jsonb
language plpgsql
security definer
set search_path = connect, hub, public
as $$
declare
  v_contrato connect.contratos_alunos%rowtype;
  v_base numeric(12,2);
  v_valor_dia numeric(12,2);
  v_fj int;
  v_fi int;
  v_dias_uteis int := 24;
  v_dias_trabalhados int;
  v_desconto numeric(12,2);
  v_final numeric(12,2);
  v_freq numeric(6,2);
begin
  select * into v_contrato
  from connect.contratos_alunos
  where aluno_id = p_aluno_id and status = 'ativo'
  order by data_inicio desc
  limit 1;

  v_base := case when coalesce(v_contrato.carga_horaria, 8) = 4 then 759 else 1518 end;
  v_valor_dia := v_base / 20;

  select
    count(*) filter (where f.status = 'FJ'),
    count(*) filter (where f.status = 'FI')
  into v_fj, v_fi
  from connect.frequencias f
  where f.aluno_id = p_aluno_id
    and f.criado_em >= date_trunc('month', current_date);

  v_dias_trabalhados := greatest(v_dias_uteis - coalesce(v_fi, 0), 0);
  v_desconto := v_valor_dia * coalesce(v_fi, 0);
  v_final := greatest(v_base - v_desconto, 0);
  v_freq := round((v_dias_trabalhados::numeric / v_dias_uteis::numeric) * 100, 2);

  return jsonb_build_object(
    'aluno_id', p_aluno_id,
    'mes', p_mes,
    'frequencia_percentual', v_freq,
    'dias_trabalhados', v_dias_trabalhados,
    'dias_uteis', v_dias_uteis,
    'faltas_justificadas', coalesce(v_fj, 0),
    'faltas_injustificadas', coalesce(v_fi, 0),
    'salario_base', v_base,
    'valor_dia', v_valor_dia,
    'desconto_faltas', v_desconto,
    'salario_final', v_final,
    'status', 'calculado'
  );
end;
$$;

create or replace function connect.aluno_frequencia_salario(p_mes text)
returns jsonb
language plpgsql
security definer
set search_path = connect, hub, public
as $$
declare
  v_aluno_id uuid;
begin
  select id into v_aluno_id from connect.alunos where usuario_id = hub.jwt_usuario_id();
  if v_aluno_id is null then
    raise exception 'Aluno nao encontrado.';
  end if;
  return connect.calcular_salario_aluno(v_aluno_id, p_mes);
end;
$$;

create or replace function grid.sync_item_status()
returns trigger
language plpgsql
as $$
begin
  if new.quantidade_disponivel <= 0 then
    new.status = 'esgotado';
  elsif new.quantidade_disponivel < new.quantidade_minima then
    new.status = 'estoque_baixo';
  elsif new.status = 'esgotado' or new.status = 'estoque_baixo' then
    new.status = 'disponivel';
  end if;
  return new;
end;
$$;

create trigger itens_estoque_status before insert or update on grid.itens_estoque for each row execute function grid.sync_item_status();

create sequence if not exists grid_chamado_seq;

create or replace function grid.movimentar_estoque(p_item_id uuid, p_quantidade int, p_tipo grid.tipo_movimentacao, p_motivo text)
returns jsonb
language plpgsql
security definer
set search_path = grid, hub, public
as $$
declare
  v_item grid.itens_estoque%rowtype;
  v_saldo int;
begin
  select * into v_item from grid.itens_estoque where id = p_item_id for update;
  if v_item.id is null then
    raise exception 'Item nao encontrado.';
  end if;

  if p_tipo in ('saida', 'reserva') then
    v_saldo := v_item.quantidade_disponivel - p_quantidade;
  else
    v_saldo := v_item.quantidade_disponivel + p_quantidade;
  end if;

  if v_saldo < 0 then
    raise exception 'Saldo insuficiente.';
  end if;

  update grid.itens_estoque set quantidade_disponivel = v_saldo where id = p_item_id;

  insert into grid.movimentacoes_estoque (item_id, usuario_id, tipo, quantidade, motivo, saldo_apos, custo_unitario)
  values (p_item_id, hub.jwt_usuario_id(), p_tipo, p_quantidade, p_motivo, v_saldo, v_item.custo);

  return jsonb_build_object('item_id', p_item_id, 'saldo_apos', v_saldo);
end;
$$;

create or replace function grid.abrir_chamado(p_chamado jsonb)
returns jsonb
language plpgsql
security definer
set search_path = grid, hub, public
as $$
declare
  v_chamado_id uuid;
  v_codigo text;
begin
  v_codigo := '#CH-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('grid_chamado_seq')::text, 4, '0');

  insert into grid.chamados (codigo, solicitante_id, titulo, descricao, sala_id, bloco_id, categoria_id, prioridade, status, responsavel_id, item_atribuido_id)
  values (
    v_codigo,
    hub.jwt_usuario_id(),
    p_chamado ->> 'titulo',
    p_chamado ->> 'descricao',
    nullif(p_chamado ->> 'sala_id', '')::uuid,
    nullif(p_chamado ->> 'bloco_id', '')::uuid,
    nullif(p_chamado ->> 'categoria_id', '')::uuid,
    coalesce((p_chamado ->> 'prioridade')::grid.prioridade_chamado, 'media'),
    'aberto',
    nullif(p_chamado ->> 'responsavel_id', '')::uuid,
    nullif(p_chamado ->> 'item_id', '')::uuid
  )
  returning id into v_chamado_id;

  insert into grid.tarefas (chamado_id, responsavel_id, item_id, status)
  select id, responsavel_id, item_atribuido_id, status from grid.chamados where id = v_chamado_id;

  return (select to_jsonb(c) from grid.chamados c where c.id = v_chamado_id);
end;
$$;

create or replace function grid.mover_tarefa(p_tarefa_id uuid, p_status grid.status_chamado)
returns jsonb
language plpgsql
security definer
set search_path = grid, hub, public
as $$
declare
  v_tarefa grid.tarefas%rowtype;
begin
  update grid.tarefas
  set status = p_status,
      inicio_reparo = case when p_status = 'em_andamento' and inicio_reparo is null then now() else inicio_reparo end,
      fim_reparo = case when p_status = 'concluida' then now() else fim_reparo end
  where id = p_tarefa_id
  returning * into v_tarefa;

  update grid.chamados
  set status = p_status,
      concluido_em = case when p_status = 'concluida' then now() else concluido_em end
  where id = v_tarefa.chamado_id;

  return to_jsonb(v_tarefa);
end;
$$;

create or replace function grid.retornar_item_estoque(p_tarefa_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = grid, hub, public
as $$
declare
  v_item_id uuid;
begin
  select item_id into v_item_id from grid.tarefas where id = p_tarefa_id;
  if v_item_id is null then
    raise exception 'Tarefa sem item vinculado.';
  end if;
  return grid.movimentar_estoque(v_item_id, 1, 'retorno', 'Retorno de item de tarefa concluida');
end;
$$;

create or replace view public.connect_alunos_view with (security_invoker = true) as
select
  a.id,
  a.usuario_id,
  u.nome,
  coalesce(a.email_institucional, u.email) as email_institucional,
  a.rm,
  t.nome as turma_nome,
  c.nome as curso_nome,
  a.empresa_nome as empresa,
  a.status,
  coalesce(l.dentro_do_senai, false) as dentro_do_senai
from connect.alunos a
join hub.usuarios u on u.id = a.usuario_id
left join connect.turmas t on t.id = a.turma_id
left join connect.cursos c on c.id = a.curso_id
left join connect.localizacoes_alunos l on l.aluno_id = a.id;

create or replace view public.connect_professores_view with (security_invoker = true) as
select
  p.id,
  p.usuario_id,
  u.nome,
  coalesce(u.email_institucional, u.email) as email_institucional,
  p.especialidade,
  count(pt.id)::int as turmas,
  p.status
from connect.professores p
join hub.usuarios u on u.id = p.usuario_id
left join connect.professor_turmas pt on pt.professor_id = p.id and pt.ativo
group by p.id, u.id;

create or replace view public.connect_turmas_view with (security_invoker = true) as
select
  t.id,
  t.nome,
  c.nome as curso_nome,
  t.periodo,
  t.status,
  count(ta.aluno_id)::int as alunos
from connect.turmas t
join connect.cursos c on c.id = t.curso_id
left join connect.turma_alunos ta on ta.turma_id = t.id and ta.ativo
group by t.id, c.nome;

create or replace view public.connect_localizacoes_ativas_view with (security_invoker = true) as
select
  l.aluno_id,
  u.nome,
  l.latitude,
  l.longitude,
  l.dentro_do_senai,
  l.atualizado_em
from connect.localizacoes_alunos l
join connect.alunos a on a.id = l.aluno_id
join hub.usuarios u on u.id = a.usuario_id
where l.dentro_do_senai = true;

create or replace view public.connect_contratos_view with (security_invoker = true) as
select
  ca.id,
  ca.aluno_id,
  u.nome as aluno_nome,
  ca.empresa_nome,
  ca.carga_horaria,
  ca.status,
  ar.url_publica as arquivo_url
from connect.contratos_alunos ca
join connect.alunos a on a.id = ca.aluno_id
join hub.usuarios u on u.id = a.usuario_id
left join hub.arquivos ar on ar.id = ca.arquivo_id;

create or replace view public.connect_dashboard_view with (security_invoker = true) as
select
  (select count(*) from connect.alunos)::int as total_alunos,
  (select count(*) from connect.professores)::int as total_professores,
  (select count(*) from connect.turmas where status = 'ativa')::int as turmas_ativas,
  (select count(*) from connect.cursos where status = 'ativo')::int as cursos_ativos,
  92.4::numeric as frequencia_media,
  (select count(*) from connect.contratos_alunos where status = 'ativo')::int as contratos_ativos;

create or replace view public.aluno_perfil_view with (security_invoker = true) as
select
  a.id,
  a.usuario_id,
  u.nome,
  coalesce(a.email_institucional, u.email) as email_institucional,
  a.email_pessoal,
  a.rm,
  c.nome as curso_nome,
  t.nome as turma_nome,
  a.empresa_nome,
  a.status,
  ca.status as contrato_status
from connect.alunos a
join hub.usuarios u on u.id = a.usuario_id
left join connect.cursos c on c.id = a.curso_id
left join connect.turmas t on t.id = a.turma_id
left join lateral (
  select status from connect.contratos_alunos ca
  where ca.aluno_id = a.id
  order by ca.data_inicio desc
  limit 1
) ca on true
where a.usuario_id = hub.jwt_usuario_id();

create or replace view public.aluno_grade_aulas_view with (security_invoker = true) as
select
  au.id,
  extract(isodow from au.data)::int as dia_semana,
  au.data,
  au.disciplina,
  up.nome as professor_nome,
  to_char(au.inicio, 'HH24:MI') as inicio,
  to_char(au.fim, 'HH24:MI') as fim,
  s.nome as sala,
  b.nome as bloco,
  f.status
from connect.aulas au
join connect.turmas t on t.id = au.turma_id
join connect.alunos a on a.turma_id = t.id
left join connect.professores p on p.id = au.professor_id
left join hub.usuarios up on up.id = p.usuario_id
left join hub.salas s on s.id = au.sala_id
left join hub.blocos b on b.id = s.bloco_id
left join connect.frequencias f on f.aula_id = au.id and f.aluno_id = a.id
where a.usuario_id = hub.jwt_usuario_id();

create or replace view public.grid_chamados_view with (security_invoker = true) as
select
  c.id,
  c.codigo,
  us.nome as solicitante_nome,
  c.titulo,
  c.descricao,
  coalesce(s.nome, '-') as sala,
  coalesce(b.nome, '-') as bloco,
  c.prioridade,
  c.status,
  ur.nome as responsavel_nome,
  ie.titulo as item_nome,
  c.criado_em
from grid.chamados c
join hub.usuarios us on us.id = c.solicitante_id
left join hub.usuarios ur on ur.id = c.responsavel_id
left join hub.salas s on s.id = c.sala_id
left join hub.blocos b on b.id = c.bloco_id
left join grid.itens_estoque ie on ie.id = c.item_atribuido_id;

create or replace view public.grid_tarefas_view with (security_invoker = true) as
select
  c.id,
  c.codigo,
  us.nome as solicitante_nome,
  c.titulo,
  c.descricao,
  coalesce(s.nome, '-') as sala,
  coalesce(b.nome, '-') as bloco,
  c.prioridade,
  t.status,
  ur.nome as responsavel_nome,
  ie.titulo as item_nome,
  c.criado_em,
  t.id as tarefa_id,
  t.item_id,
  t.inicio_reparo,
  t.fim_reparo
from grid.tarefas t
join grid.chamados c on c.id = t.chamado_id
join hub.usuarios us on us.id = c.solicitante_id
left join hub.usuarios ur on ur.id = t.responsavel_id
left join hub.salas s on s.id = c.sala_id
left join hub.blocos b on b.id = c.bloco_id
left join grid.itens_estoque ie on ie.id = t.item_id;

create or replace view public.grid_dashboard_view with (security_invoker = true) as
select
  (select count(*) from grid.chamados where status = 'aberto')::int as chamados_abertos,
  (select count(*) from grid.chamados where status = 'em_andamento')::int as em_andamento,
  (select count(*) from grid.chamados where status = 'concluida' and concluido_em >= date_trunc('month', now()))::int as concluidos_mes,
  (select count(*) from grid.itens_estoque where status = 'estoque_baixo')::int as estoque_baixo;
grant usage on schema hub to anon, authenticated, service_role;
grant usage on schema connect to anon, authenticated, service_role;
grant usage on schema grid to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema hub to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema connect to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema grid to anon, authenticated, service_role;

grant usage, select on all sequences in schema hub to anon, authenticated, service_role;
grant usage, select on all sequences in schema connect to anon, authenticated, service_role;
grant usage, select on all sequences in schema grid to anon, authenticated, service_role;

grant execute on all routines in schema hub to anon, authenticated, service_role;
grant execute on all routines in schema connect to anon, authenticated, service_role;
grant execute on all routines in schema grid to anon, authenticated, service_role;

grant select on all tables in schema public to anon, authenticated, service_role;

alter default privileges for role postgres in schema hub grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema connect grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema grid grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema hub grant execute on routines to anon, authenticated, service_role;
alter default privileges for role postgres in schema connect grant execute on routines to anon, authenticated, service_role;
alter default privileges for role postgres in schema grid grant execute on routines to anon, authenticated, service_role;
create or replace function connect.jwt_aluno_id()
returns uuid
language sql
stable
as $$
  select id from connect.alunos where usuario_id = hub.jwt_usuario_id() limit 1;
$$;

create or replace function connect.jwt_professor_id()
returns uuid
language sql
stable
as $$
  select id from connect.professores where usuario_id = hub.jwt_usuario_id() limit 1;
$$;

alter table hub.usuarios enable row level security;
alter table hub.usuario_aplicacoes enable row level security;
alter table hub.aplicacoes enable row level security;
alter table hub.notificacoes enable row level security;
alter table hub.logs_acesso enable row level security;
alter table hub.arquivos enable row level security;
alter table hub.sessoes enable row level security;
alter table hub.tokens_recuperacao_senha enable row level security;
alter table hub.blocos enable row level security;
alter table hub.salas enable row level security;

alter table connect.alunos enable row level security;
alter table connect.professores enable row level security;
alter table connect.cursos enable row level security;
alter table connect.turmas enable row level security;
alter table connect.turma_alunos enable row level security;
alter table connect.professor_turmas enable row level security;
alter table connect.aulas enable row level security;
alter table connect.frequencias enable row level security;
alter table connect.contratos_alunos enable row level security;
alter table connect.salarios_alunos enable row level security;
alter table connect.calculos_salario enable row level security;
alter table connect.localizacoes_alunos enable row level security;

alter table grid.chamados enable row level security;
alter table grid.tarefas enable row level security;
alter table grid.itens_estoque enable row level security;
alter table grid.movimentacoes_estoque enable row level security;
alter table grid.chamado_itens enable row level security;
alter table grid.categorias_manutencao enable row level security;
alter table grid.relatorios enable row level security;

drop policy if exists usuarios_select on hub.usuarios;
create policy usuarios_select on hub.usuarios
for select
using (
  id = hub.jwt_usuario_id()
  or hub.jwt_tipo_usuario() in ('secretaria', 'direcao', 'gerente_manutencao')
);

drop policy if exists usuarios_insert_admin on hub.usuarios;
create policy usuarios_insert_admin on hub.usuarios
for insert
with check (hub.jwt_tipo_usuario() in ('secretaria', 'direcao'));

drop policy if exists usuarios_update_own_or_admin on hub.usuarios;
create policy usuarios_update_own_or_admin on hub.usuarios
for update
using (id = hub.jwt_usuario_id() or hub.jwt_tipo_usuario() in ('secretaria', 'direcao'))
with check (id = hub.jwt_usuario_id() or hub.jwt_tipo_usuario() in ('secretaria', 'direcao'));

drop policy if exists usuario_aplicacoes_select on hub.usuario_aplicacoes;
create policy usuario_aplicacoes_select on hub.usuario_aplicacoes
for select
using (usuario_id = hub.jwt_usuario_id() or hub.jwt_tipo_usuario() in ('secretaria', 'direcao'));

drop policy if exists usuario_aplicacoes_admin on hub.usuario_aplicacoes;
create policy usuario_aplicacoes_admin on hub.usuario_aplicacoes
for all
using (hub.jwt_tipo_usuario() in ('secretaria', 'direcao'))
with check (hub.jwt_tipo_usuario() in ('secretaria', 'direcao'));

drop policy if exists aplicacoes_read_staff on hub.aplicacoes;
create policy aplicacoes_read_staff on hub.aplicacoes
for select
using (hub.is_staff() or hub.jwt_tipo_usuario() = 'aluno');

drop policy if exists notificacoes_own on hub.notificacoes;
create policy notificacoes_own on hub.notificacoes
for select
using (usuario_id = hub.jwt_usuario_id());

drop policy if exists arquivos_owner_or_staff on hub.arquivos;
create policy arquivos_owner_or_staff on hub.arquivos
for select
using (usuario_id = hub.jwt_usuario_id() or hub.is_connect_admin() or hub.is_grid_manager());

drop policy if exists arquivos_insert_owner on hub.arquivos;
create policy arquivos_insert_owner on hub.arquivos
for insert
with check (usuario_id = hub.jwt_usuario_id() or hub.is_connect_admin() or hub.is_grid_manager());

drop policy if exists blocos_salas_read_staff on hub.blocos;
create policy blocos_salas_read_staff on hub.blocos
for select
using (hub.is_staff() or hub.jwt_tipo_usuario() = 'aluno');

drop policy if exists salas_read_staff on hub.salas;
create policy salas_read_staff on hub.salas
for select
using (hub.is_staff() or hub.jwt_tipo_usuario() = 'aluno');

drop policy if exists alunos_select_policy on connect.alunos;
create policy alunos_select_policy on connect.alunos
for select
using (
  usuario_id = hub.jwt_usuario_id()
  or hub.is_connect_admin()
  or exists (
    select 1
    from connect.professor_turmas pt
    where pt.professor_id = connect.jwt_professor_id()
      and pt.turma_id = alunos.turma_id
      and pt.ativo
  )
);

drop policy if exists alunos_crud_admin on connect.alunos;
create policy alunos_crud_admin on connect.alunos
for all
using (hub.is_connect_admin())
with check (hub.is_connect_admin());

drop policy if exists professores_select_policy on connect.professores;
create policy professores_select_policy on connect.professores
for select
using (
  usuario_id = hub.jwt_usuario_id()
  or hub.is_connect_admin()
  or hub.jwt_tipo_usuario() = 'professor'
);

drop policy if exists professores_crud_admin on connect.professores;
create policy professores_crud_admin on connect.professores
for all
using (hub.is_connect_admin())
with check (hub.is_connect_admin());

drop policy if exists cursos_read_connect on connect.cursos;
create policy cursos_read_connect on connect.cursos
for select
using (hub.jwt_tipo_usuario() in ('aluno', 'professor', 'secretaria', 'direcao'));

drop policy if exists cursos_admin on connect.cursos;
create policy cursos_admin on connect.cursos
for all
using (hub.is_connect_admin())
with check (hub.is_connect_admin());

drop policy if exists turmas_read_policy on connect.turmas;
create policy turmas_read_policy on connect.turmas
for select
using (
  hub.is_connect_admin()
  or id in (select turma_id from connect.turma_alunos where aluno_id = connect.jwt_aluno_id())
  or id in (select turma_id from connect.professor_turmas where professor_id = connect.jwt_professor_id() and ativo)
);

drop policy if exists turmas_admin on connect.turmas;
create policy turmas_admin on connect.turmas
for all
using (hub.is_connect_admin())
with check (hub.is_connect_admin());

drop policy if exists turma_alunos_read_policy on connect.turma_alunos;
create policy turma_alunos_read_policy on connect.turma_alunos
for select
using (
  hub.is_connect_admin()
  or aluno_id = connect.jwt_aluno_id()
  or turma_id in (select turma_id from connect.professor_turmas where professor_id = connect.jwt_professor_id() and ativo)
);

drop policy if exists professor_turmas_read_policy on connect.professor_turmas;
create policy professor_turmas_read_policy on connect.professor_turmas
for select
using (hub.is_connect_admin() or professor_id = connect.jwt_professor_id());

drop policy if exists aulas_read_policy on connect.aulas;
create policy aulas_read_policy on connect.aulas
for select
using (
  hub.is_connect_admin()
  or turma_id in (select turma_id from connect.turma_alunos where aluno_id = connect.jwt_aluno_id())
  or turma_id in (select turma_id from connect.professor_turmas where professor_id = connect.jwt_professor_id() and ativo)
);

drop policy if exists aulas_insert_professor on connect.aulas;
create policy aulas_insert_professor on connect.aulas
for insert
with check (
  hub.is_connect_admin()
  or turma_id in (select turma_id from connect.professor_turmas where professor_id = connect.jwt_professor_id() and ativo)
);

drop policy if exists frequencias_read_policy on connect.frequencias;
create policy frequencias_read_policy on connect.frequencias
for select
using (
  aluno_id = connect.jwt_aluno_id()
  or hub.is_connect_admin()
  or exists (
    select 1
    from connect.aulas au
    join connect.professor_turmas pt on pt.turma_id = au.turma_id
    where au.id = frequencias.aula_id
      and pt.professor_id = connect.jwt_professor_id()
      and pt.ativo
  )
);

drop policy if exists frequencias_write_professor on connect.frequencias;
create policy frequencias_write_professor on connect.frequencias
for all
using (
  hub.is_connect_admin()
  or exists (
    select 1
    from connect.aulas au
    join connect.professor_turmas pt on pt.turma_id = au.turma_id
    where au.id = frequencias.aula_id
      and pt.professor_id = connect.jwt_professor_id()
      and pt.ativo
  )
)
with check (
  hub.is_connect_admin()
  or exists (
    select 1
    from connect.aulas au
    join connect.professor_turmas pt on pt.turma_id = au.turma_id
    where au.id = frequencias.aula_id
      and pt.professor_id = connect.jwt_professor_id()
      and pt.ativo
  )
);

drop policy if exists contratos_read_policy on connect.contratos_alunos;
create policy contratos_read_policy on connect.contratos_alunos
for select
using (aluno_id = connect.jwt_aluno_id() or hub.is_connect_admin());

drop policy if exists contratos_admin on connect.contratos_alunos;
create policy contratos_admin on connect.contratos_alunos
for all
using (hub.is_connect_admin())
with check (hub.is_connect_admin());

drop policy if exists salarios_read_policy on connect.salarios_alunos;
create policy salarios_read_policy on connect.salarios_alunos
for select
using (aluno_id = connect.jwt_aluno_id() or hub.is_connect_admin());

drop policy if exists calculos_read_policy on connect.calculos_salario;
create policy calculos_read_policy on connect.calculos_salario
for select
using (
  hub.is_connect_admin()
  or exists (
    select 1
    from connect.salarios_alunos s
    where s.id = calculos_salario.salario_id
      and s.aluno_id = connect.jwt_aluno_id()
  )
);

drop policy if exists localizacoes_read_policy on connect.localizacoes_alunos;
create policy localizacoes_read_policy on connect.localizacoes_alunos
for select
using (
  aluno_id = connect.jwt_aluno_id()
  or hub.is_connect_admin()
  or exists (
    select 1
    from connect.alunos a
    join connect.professor_turmas pt on pt.turma_id = a.turma_id
    where a.id = localizacoes_alunos.aluno_id
      and pt.professor_id = connect.jwt_professor_id()
      and pt.ativo
      and localizacoes_alunos.dentro_do_senai
  )
);

drop policy if exists localizacoes_aluno_upsert on connect.localizacoes_alunos;
create policy localizacoes_aluno_upsert on connect.localizacoes_alunos
for all
using (aluno_id = connect.jwt_aluno_id() or hub.is_connect_admin())
with check (aluno_id = connect.jwt_aluno_id() or hub.is_connect_admin());

drop policy if exists categorias_grid_read on grid.categorias_manutencao;
create policy categorias_grid_read on grid.categorias_manutencao
for select
using (hub.jwt_tipo_usuario() in ('professor', 'secretaria', 'direcao', 'manutencao', 'gerente_manutencao'));

drop policy if exists chamados_read_policy on grid.chamados;
create policy chamados_read_policy on grid.chamados
for select
using (
  hub.is_grid_manager()
  or hub.jwt_tipo_usuario() in ('secretaria', 'direcao')
  or solicitante_id = hub.jwt_usuario_id()
  or responsavel_id = hub.jwt_usuario_id()
);

drop policy if exists chamados_insert_staff on grid.chamados;
create policy chamados_insert_staff on grid.chamados
for insert
with check (hub.jwt_tipo_usuario() in ('professor', 'secretaria', 'direcao', 'manutencao', 'gerente_manutencao'));

drop policy if exists chamados_update_grid on grid.chamados;
create policy chamados_update_grid on grid.chamados
for update
using (hub.is_grid_manager() or responsavel_id = hub.jwt_usuario_id())
with check (hub.is_grid_manager() or responsavel_id = hub.jwt_usuario_id());

drop policy if exists tarefas_read_policy on grid.tarefas;
create policy tarefas_read_policy on grid.tarefas
for select
using (
  hub.is_grid_manager()
  or responsavel_id = hub.jwt_usuario_id()
  or exists (select 1 from grid.chamados c where c.id = tarefas.chamado_id and c.solicitante_id = hub.jwt_usuario_id())
);

drop policy if exists tarefas_update_policy on grid.tarefas;
create policy tarefas_update_policy on grid.tarefas
for update
using (hub.is_grid_manager() or responsavel_id = hub.jwt_usuario_id())
with check (hub.is_grid_manager() or responsavel_id = hub.jwt_usuario_id());

drop policy if exists tarefas_insert_manager on grid.tarefas;
create policy tarefas_insert_manager on grid.tarefas
for insert
with check (hub.is_grid_manager());

drop policy if exists estoque_read_grid on grid.itens_estoque;
create policy estoque_read_grid on grid.itens_estoque
for select
using (hub.jwt_tipo_usuario() in ('professor', 'secretaria', 'direcao', 'manutencao', 'gerente_manutencao'));

drop policy if exists estoque_manage_manager on grid.itens_estoque;
create policy estoque_manage_manager on grid.itens_estoque
for all
using (hub.is_grid_manager())
with check (hub.is_grid_manager());

drop policy if exists movimentacoes_read_grid on grid.movimentacoes_estoque;
create policy movimentacoes_read_grid on grid.movimentacoes_estoque
for select
using (hub.jwt_tipo_usuario() in ('secretaria', 'direcao', 'manutencao', 'gerente_manutencao'));

drop policy if exists movimentacoes_insert_manager on grid.movimentacoes_estoque;
create policy movimentacoes_insert_manager on grid.movimentacoes_estoque
for insert
with check (hub.jwt_tipo_usuario() in ('manutencao', 'gerente_manutencao', 'direcao'));

drop policy if exists chamado_itens_grid on grid.chamado_itens;
create policy chamado_itens_grid on grid.chamado_itens
for select
using (hub.jwt_tipo_usuario() in ('secretaria', 'direcao', 'manutencao', 'gerente_manutencao'));

drop policy if exists relatorios_grid on grid.relatorios;
create policy relatorios_grid on grid.relatorios
for select
using (hub.jwt_tipo_usuario() in ('secretaria', 'direcao', 'gerente_manutencao'));
insert into hub.aplicacoes (codigo, nome, descricao, ativo)
values
  ('connect', 'SENAI Connect', 'Gestao educacional, frequencia, contratos e salarios.', true),
  ('grid', 'SENAI Grid', 'Gestao de manutencao, chamados, tarefas e estoque.', true)
on conflict (codigo) do update set nome = excluded.nome, descricao = excluded.descricao, ativo = excluded.ativo;

insert into hub.usuarios (id, nome, email, senha_hash, tipo_usuario, status, cpf, telefone, email_institucional)
values
  ('00000000-0000-0000-0000-000000000101', 'Ana Souza', 'ana.souza@senai.br', hub.hash_password('12345678'), 'secretaria', 'ativo', '111.111.111-11', '(19) 99999-0001', 'ana.souza@senai.br'),
  ('00000000-0000-0000-0000-000000000102', 'Carlos Mendes', 'carlos.mendes@senai.br', hub.hash_password('12345678'), 'gerente_manutencao', 'ativo', '222.222.222-22', '(19) 99999-0002', 'carlos.mendes@senai.br'),
  ('00000000-0000-0000-0000-000000000103', 'Joao Oliveira', 'joao.oliveira@senai.br', hub.hash_password('12345678'), 'manutencao', 'ativo', '333.333.333-33', '(19) 99999-0003', 'joao.oliveira@senai.br'),
  ('00000000-0000-0000-0000-000000000104', 'Marcos Almeida', 'marcos.almeida@senai.br', hub.hash_password('12345678'), 'professor', 'ativo', '444.444.444-44', '(19) 99999-0004', 'marcos.almeida@senai.br'),
  ('00000000-0000-0000-0000-000000000201', 'Joao Pedro Lima', 'joao.lima@aluno.senai.br', hub.hash_password('12345678'), 'aluno', 'ativo', '555.555.555-55', '(19) 98888-0001', 'joao.lima@aluno.senai.br'),
  ('00000000-0000-0000-0000-000000000202', 'Maria Eduarda Silva', 'maria.silva@aluno.senai.br', hub.hash_password('12345678'), 'aluno', 'ativo', '666.666.666-66', '(19) 98888-0002', 'maria.silva@aluno.senai.br'),
  ('00000000-0000-0000-0000-000000000203', 'Rafael Martins Rocha', 'rafael.rocha@aluno.senai.br', hub.hash_password('12345678'), 'aluno', 'ativo', '777.777.777-77', '(19) 98888-0003', 'rafael.rocha@aluno.senai.br')
on conflict (email) do update
set nome = excluded.nome,
    senha_hash = excluded.senha_hash,
    tipo_usuario = excluded.tipo_usuario,
    status = excluded.status,
    cpf = excluded.cpf,
    telefone = excluded.telefone,
    email_institucional = excluded.email_institucional;

insert into hub.usuario_aplicacoes (usuario_id, aplicacao_id, perfil, ativo)
select u.id, a.id, u.tipo_usuario::text, true
from hub.usuarios u
cross join hub.aplicacoes a
where (
  (u.tipo_usuario in ('professor', 'secretaria', 'direcao') and a.codigo in ('connect', 'grid'))
  or (u.tipo_usuario in ('manutencao', 'gerente_manutencao') and a.codigo = 'grid')
)
on conflict (usuario_id, aplicacao_id) do update set perfil = excluded.perfil, ativo = excluded.ativo;

insert into hub.blocos (id, nome, descricao, latitude, longitude)
values
  ('10000000-0000-0000-0000-000000000001', 'A', 'Administracao e recepcao', -22.5648, -47.4014),
  ('10000000-0000-0000-0000-000000000002', 'B', 'Laboratorios', -22.5649, -47.4012),
  ('10000000-0000-0000-0000-000000000003', 'C', 'Oficinas', -22.5650, -47.4015),
  ('10000000-0000-0000-0000-000000000004', 'D', 'Salas de aula', -22.5647, -47.4011),
  ('10000000-0000-0000-0000-000000000005', 'E', 'Apoio e almoxarifado', -22.5651, -47.4013)
on conflict (nome) do update set descricao = excluded.descricao, latitude = excluded.latitude, longitude = excluded.longitude;

insert into hub.salas (id, bloco_id, nome, tipo, capacidade, andar)
values
  ('11000000-0000-0000-0000-000000000201', '10000000-0000-0000-0000-000000000004', '201', 'sala', 40, '2'),
  ('11000000-0000-0000-0000-000000000203', '10000000-0000-0000-0000-000000000001', '203', 'sala', 40, '2'),
  ('11000000-0000-0000-0000-000000000204', '10000000-0000-0000-0000-000000000002', '204', 'laboratorio', 32, '2'),
  ('11000000-0000-0000-0000-000000000207', '10000000-0000-0000-0000-000000000002', '207', 'sala', 35, '2'),
  ('11000000-0000-0000-0000-000000000108', '10000000-0000-0000-0000-000000000003', '108', 'oficina', 28, '1')
on conflict (bloco_id, nome) do update set tipo = excluded.tipo, capacidade = excluded.capacidade, andar = excluded.andar;

insert into connect.cursos (id, nome, descricao, modalidade, carga_horaria, status)
values
  ('20000000-0000-0000-0000-000000000001', 'Tecnico em Logistica', 'Planejamento, execucao e controle da cadeia de suprimentos.', 'tecnico', 1200, 'ativo'),
  ('20000000-0000-0000-0000-000000000002', 'Automacao Industrial', 'Sistemas automatizados, controladores logicos e processos industriais.', 'tecnico', 1200, 'ativo'),
  ('20000000-0000-0000-0000-000000000003', 'Informatica Basica', 'Sistemas operacionais, internet e ferramentas de escritorio.', 'qualificacao', 80, 'ativo')
on conflict (nome) do update set descricao = excluded.descricao, carga_horaria = excluded.carga_horaria, status = excluded.status;

insert into connect.professores (id, usuario_id, especialidade, data_contratacao, status)
values
  ('21000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000104', 'Automacao Industrial', '2021-02-15', 'ativo')
on conflict (usuario_id) do update set especialidade = excluded.especialidade, status = excluded.status;

insert into connect.turmas (id, curso_id, professor_responsavel_id, sala_id, nome, periodo, data_inicio, data_termino, status)
values
  ('22000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000201', 'TIN25-03', 'manha', '2025-05-01', '2025-11-30', 'ativa'),
  ('22000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '21000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000203', 'AUT25-02', 'noite', '2025-05-30', '2025-11-30', 'ativa')
on conflict (nome) do update set curso_id = excluded.curso_id, professor_responsavel_id = excluded.professor_responsavel_id, sala_id = excluded.sala_id, status = excluded.status;

insert into connect.alunos (id, usuario_id, curso_id, turma_id, rm, email_pessoal, email_institucional, empresa_nome, data_nascimento, status)
values
  ('23000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000201', '20000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000001', 'RM20250123', 'joaopedro.lima@email.com', 'joao.lima@aluno.senai.br', 'TechLog Solucoes Ltda.', '2006-04-15', 'ativo'),
  ('23000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000202', '20000000-0000-0000-0000-000000000003', '22000000-0000-0000-0000-000000000001', 'RM20250124', 'maria.silva@email.com', 'maria.silva@aluno.senai.br', 'InfoTech Consultoria', '2006-06-22', 'ativo'),
  ('23000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000203', '20000000-0000-0000-0000-000000000002', '22000000-0000-0000-0000-000000000002', 'RM20250129', 'rafael.rocha@email.com', 'rafael.rocha@aluno.senai.br', 'InovaTech', '2005-01-09', 'ativo')
on conflict (rm) do update set curso_id = excluded.curso_id, turma_id = excluded.turma_id, empresa_nome = excluded.empresa_nome, status = excluded.status;

insert into connect.turma_alunos (turma_id, aluno_id, ativo)
values
  ('22000000-0000-0000-0000-000000000001', '23000000-0000-0000-0000-000000000001', true),
  ('22000000-0000-0000-0000-000000000001', '23000000-0000-0000-0000-000000000002', true),
  ('22000000-0000-0000-0000-000000000002', '23000000-0000-0000-0000-000000000003', true)
on conflict (turma_id, aluno_id) do update set ativo = excluded.ativo;

insert into connect.professor_turmas (professor_id, turma_id, disciplina, ativo)
values
  ('21000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000001', 'Tecnicas em Logistica', true),
  ('21000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000002', 'Automacao Industrial', true)
on conflict (professor_id, turma_id, disciplina) do update set ativo = excluded.ativo;

insert into connect.aulas (id, turma_id, professor_id, sala_id, data, disciplina, inicio, fim, quantidade_aulas, criado_por)
values
  ('24000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000201', '2025-05-01', 'Tecnicas em Logistica', '08:00', '09:40', 2, '00000000-0000-0000-0000-000000000104'),
  ('24000000-0000-0000-0000-000000000002', '22000000-0000-0000-0000-000000000002', '21000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000203', '2025-05-01', 'Automacao Industrial', '10:00', '11:40', 2, '00000000-0000-0000-0000-000000000104')
on conflict (id) do update set disciplina = excluded.disciplina, data = excluded.data;

insert into connect.frequencias (aula_id, aluno_id, status, criado_por)
values
  ('24000000-0000-0000-0000-000000000001', '23000000-0000-0000-0000-000000000001', 'P', '00000000-0000-0000-0000-000000000104'),
  ('24000000-0000-0000-0000-000000000001', '23000000-0000-0000-0000-000000000002', 'FJ', '00000000-0000-0000-0000-000000000104'),
  ('24000000-0000-0000-0000-000000000002', '23000000-0000-0000-0000-000000000003', 'FI', '00000000-0000-0000-0000-000000000104')
on conflict (aula_id, aluno_id) do update set status = excluded.status;

insert into connect.contratos_alunos (id, aluno_id, empresa_nome, carga_horaria, carteira_trabalho, email_empresa, data_inicio, status)
values
  ('25000000-0000-0000-0000-000000000001', '23000000-0000-0000-0000-000000000001', 'TechLog Solucoes Ltda.', 8, 'CTPS Digital 1234567-0030 SP', 'contato@techlog.com.br', '2025-05-01', 'ativo'),
  ('25000000-0000-0000-0000-000000000002', '23000000-0000-0000-0000-000000000002', 'InfoTech Consultoria', 4, 'CTPS Digital 2345678-0040 SP', 'contato@infotech.com.br', '2025-05-01', 'ativo')
on conflict (id) do update set empresa_nome = excluded.empresa_nome, carga_horaria = excluded.carga_horaria, status = excluded.status;

insert into connect.localizacoes_alunos (aluno_id, latitude, longitude, dentro_do_senai, atualizado_em)
values
  ('23000000-0000-0000-0000-000000000001', -22.5648, -47.4014, true, now()),
  ('23000000-0000-0000-0000-000000000002', -22.5649, -47.4013, true, now()),
  ('23000000-0000-0000-0000-000000000003', -22.5668, -47.4040, false, now())
on conflict (aluno_id) do update set latitude = excluded.latitude, longitude = excluded.longitude, dentro_do_senai = excluded.dentro_do_senai, atualizado_em = excluded.atualizado_em;

insert into grid.categorias_manutencao (id, nome, descricao, ativo)
values
  ('30000000-0000-0000-0000-000000000001', 'Eletrico', 'Servicos eletricos e iluminacao.', true),
  ('30000000-0000-0000-0000-000000000002', 'Hidraulico', 'Vazamentos, registros e tubulacoes.', true),
  ('30000000-0000-0000-0000-000000000003', 'Equipamentos', 'Equipamentos de laboratorio e informatica.', true)
on conflict (nome) do update set descricao = excluded.descricao, ativo = excluded.ativo;

insert into grid.itens_estoque (id, categoria_id, titulo, descricao, quantidade_disponivel, quantidade_minima, unidade, localizacao, empresa_distribuidora, custo)
values
  ('31000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Lampada LED 18W', 'Lampada fria para salas de aula', 4, 20, 'un', 'Almoxarifado - Bloco C', 'Eletrica Central', 45.00),
  ('31000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'Torneira Deca', 'Torneira de bancada', 8, 10, 'un', 'Almoxarifado - Bloco C', 'HidroLine', 120.00),
  ('31000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'Teclado USB ABNT2', 'Teclado padrao ABNT2', 18, 20, 'un', 'Sala 204 - Bloco B', 'TechSuprimentos', 59.90)
on conflict (id) do update
set quantidade_disponivel = excluded.quantidade_disponivel,
    quantidade_minima = excluded.quantidade_minima,
    custo = excluded.custo;

insert into grid.chamados (id, codigo, solicitante_id, titulo, descricao, sala_id, bloco_id, categoria_id, prioridade, status, responsavel_id, item_atribuido_id, criado_em)
values
  ('32000000-0000-0000-0000-000000000001', '#CH-2024-1258', '00000000-0000-0000-0000-000000000101', 'Ar-condicionado nao refrigera', 'Ar-condicionado da sala 207 nao esta refrigerando.', '11000000-0000-0000-0000-000000000207', '10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003', 'urgente', 'aberto', '00000000-0000-0000-0000-000000000103', null, now() - interval '2 days'),
  ('32000000-0000-0000-0000-000000000002', '#CH-2024-1257', '00000000-0000-0000-0000-000000000101', 'Vazamento na pia do laboratorio', 'Vazamento na pia central do laboratorio.', '11000000-0000-0000-0000-000000000204', '10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'media', 'em_andamento', '00000000-0000-0000-0000-000000000103', '31000000-0000-0000-0000-000000000002', now() - interval '1 day'),
  ('32000000-0000-0000-0000-000000000003', '#CH-2024-1256', '00000000-0000-0000-0000-000000000104', 'Troca de lampada LED', 'Lampada queimada na sala de aula.', '11000000-0000-0000-0000-000000000201', '10000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', 'baixa', 'concluida', '00000000-0000-0000-0000-000000000103', '31000000-0000-0000-0000-000000000001', now() - interval '3 days')
on conflict (codigo) do update set status = excluded.status, responsavel_id = excluded.responsavel_id, item_atribuido_id = excluded.item_atribuido_id;

insert into grid.tarefas (id, chamado_id, responsavel_id, item_id, status, inicio_reparo, fim_reparo)
values
  ('33000000-0000-0000-0000-000000000001', '32000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000103', null, 'aberto', null, null),
  ('33000000-0000-0000-0000-000000000002', '32000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000103', '31000000-0000-0000-0000-000000000002', 'em_andamento', now() - interval '6 hours', null),
  ('33000000-0000-0000-0000-000000000003', '32000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000103', '31000000-0000-0000-0000-000000000001', 'concluida', now() - interval '3 days', now() - interval '2 days')
on conflict (chamado_id) do update set status = excluded.status, responsavel_id = excluded.responsavel_id, item_id = excluded.item_id;

insert into grid.relatorios (titulo, periodo_inicio, periodo_fim, filtros, dados, criado_por)
values
  ('Relatorio executivo Maio/2025', '2025-05-01', '2025-05-31', '{"bloco":"todos"}', '{"manutencoes":342,"custo":98752.40}', '00000000-0000-0000-0000-000000000102');
