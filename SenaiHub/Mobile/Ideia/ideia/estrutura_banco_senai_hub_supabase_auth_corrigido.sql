-- SENAI HUB - Banco corrigido para Supabase Auth
-- Use este arquivo em um projeto Supabase novo ou em um banco resetado.
-- Regra principal: hub.usuarios.id = auth.users.id.
-- Senhas, sessoes e recuperacao de senha ficam no Supabase Auth.

create extension if not exists pgcrypto;
create extension if not exists citext;

create schema if not exists hub;
create schema if not exists connect;
create schema if not exists grid;

do $$
begin
  create type hub.tipo_usuario as enum (
    'admin',
    'aluno',
    'professor',
    'secretaria',
    'direcao',
    'manutencao',
    'gerente_manutencao',
    'empresa'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type hub.status_usuario as enum ('ativo', 'inativo', 'bloqueado', 'pendente');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type connect.status_frequencia as enum (
    'presente',
    'falta_justificada',
    'falta_injustificada'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type connect.periodo_turma as enum ('manha', 'tarde', 'noite', 'integral');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type grid.prioridade_chamado as enum ('baixa', 'media', 'alta', 'urgente');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type grid.status_chamado as enum (
    'aberto',
    'aguardando',
    'em_andamento',
    'concluido',
    'concluida'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type grid.status_tarefa as enum (
    'a_fazer',
    'em_andamento',
    'concluida',
    'concluido'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type grid.status_estoque as enum (
    'disponivel',
    'estoque_baixo',
    'reservado',
    'esgotado'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type grid.tipo_movimentacao as enum ('entrada', 'saida', 'reserva', 'retorno');
exception when duplicate_object then null;
end $$;

create or replace function hub.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create or replace function hub.coerce_tipo_usuario(
  p_value text,
  p_default hub.tipo_usuario default null
)
returns hub.tipo_usuario
language plpgsql
immutable
as $$
begin
  if p_value is null or btrim(p_value) = '' then
    return p_default;
  end if;

  return p_value::hub.tipo_usuario;
exception
  when invalid_text_representation then
    return p_default;
end;
$$;

create table if not exists hub.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email public.citext not null unique,
  email_institucional public.citext,
  tipo_usuario hub.tipo_usuario not null default 'aluno',
  status hub.status_usuario not null default 'ativo',
  cpf text unique,
  telefone text,
  foto_arquivo_id uuid,
  senha_hash text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on column hub.usuarios.senha_hash is
  'Compatibilidade legada. Nao usar para login; senhas ficam no Supabase Auth.';

create table if not exists hub.aplicacoes (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique check (codigo in ('senai_connect', 'senai_grid')),
  nome text not null,
  descricao text,
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
  enviado_por uuid references hub.usuarios(id) on delete set null,
  url_segura text,
  public_id text,
  tipo_arquivo text,
  tamanho_bytes bigint,
  relacionamento_tipo text,
  relacionamento_id uuid,
  bucket text default 'senai-hub',
  caminho text,
  nome_original text,
  mime_type text,
  url_publica text,
  criado_em timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'usuarios_foto_arquivo_fk'
  ) then
    alter table hub.usuarios
      add constraint usuarios_foto_arquivo_fk
      foreign key (foto_arquivo_id) references hub.arquivos(id) on delete set null;
  end if;
end $$;

create table if not exists hub.notificacoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references hub.usuarios(id) on delete cascade,
  titulo text not null,
  mensagem text not null,
  corpo text,
  lida boolean not null default false,
  dados jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists hub.logs_acesso (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references hub.usuarios(id) on delete set null,
  aplicacao text,
  ip inet,
  user_agent text,
  acao text not null,
  sucesso boolean not null default true,
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

create table if not exists connect.cursos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  descricao text,
  modalidade text not null default 'tecnico',
  periodo connect.periodo_turma,
  carga_horaria int,
  data_inicio date,
  data_termino date,
  status text not null default 'ativo',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists connect.professores (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null unique references hub.usuarios(id) on delete cascade,
  especialidade text,
  tempo_contrato text,
  data_contratacao date,
  data_nascimento date,
  celular text,
  endereco text,
  status hub.status_usuario not null default 'ativo',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists connect.turmas (
  id uuid primary key default gen_random_uuid(),
  curso_id uuid references connect.cursos(id) on delete restrict,
  professor_responsavel_id uuid references connect.professores(id) on delete set null,
  sala_id uuid references hub.salas(id) on delete set null,
  nome text not null unique,
  periodo connect.periodo_turma not null default 'manha',
  horario_inicio time,
  horario_fim time,
  data_inicio date,
  data_termino date,
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
  email_pessoal public.citext,
  email_institucional public.citext,
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

create table if not exists connect.empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text unique,
  email public.citext,
  telefone text,
  responsavel_nome text,
  status text not null default 'ativa',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists connect.aulas (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid references connect.turmas(id) on delete cascade,
  professor_id uuid references connect.professores(id) on delete set null,
  sala_id uuid references hub.salas(id) on delete set null,
  data_aula date not null,
  disciplina text not null default 'Aula',
  inicio time,
  fim time,
  quantidade_aulas int not null default 1,
  observacao text,
  criado_por uuid references hub.usuarios(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists connect.frequencias (
  id uuid primary key default gen_random_uuid(),
  aula_id uuid not null references connect.aulas(id) on delete cascade,
  aluno_id uuid not null references connect.alunos(id) on delete cascade,
  status connect.status_frequencia not null default 'presente',
  quantidade_aulas_faltadas int not null default 0,
  justificativa text,
  observacao text,
  registrado_por uuid references hub.usuarios(id) on delete set null,
  criado_por uuid references hub.usuarios(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (aula_id, aluno_id)
);

create table if not exists connect.contratos_alunos (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references connect.alunos(id) on delete cascade,
  empresa_id uuid references connect.empresas(id) on delete set null,
  empresa_nome text,
  carga_horaria text,
  carteira_trabalho text,
  conta_bancaria text,
  localizacao_empresa text,
  email_empresa public.citext,
  arquivo_id uuid references hub.arquivos(id) on delete set null,
  data_inicio date,
  data_termino date,
  status text not null default 'ativo',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists connect.salarios_alunos (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references connect.alunos(id) on delete cascade,
  empresa_id uuid references connect.empresas(id) on delete set null,
  contrato_id uuid references connect.contratos_alunos(id) on delete set null,
  mes_referencia text not null,
  tipo_pagamento text not null default 'mensal',
  salario_base numeric(12, 2) not null default 0,
  valor_hora numeric(12, 2),
  valor_dia numeric(12, 2),
  carga_diaria_horas numeric(6, 2) default 6,
  dias_uteis_mes int default 22,
  outros_descontos numeric(12, 2) not null default 0,
  salario_final numeric(12, 2),
  faltas_injustificadas int default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (aluno_id, mes_referencia)
);

create table if not exists connect.calculos_salario (
  id uuid primary key default gen_random_uuid(),
  salario_id uuid not null references connect.salarios_alunos(id) on delete cascade,
  dias_uteis int not null default 0,
  dias_trabalhados int not null default 0,
  faltas_justificadas int not null default 0,
  faltas_injustificadas int not null default 0,
  frequencia_percentual numeric(6, 2) not null default 0,
  desconto_faltas numeric(12, 2) not null default 0,
  salario_final numeric(12, 2) not null default 0,
  status text not null default 'calculado',
  calculado_em timestamptz not null default now()
);

create table if not exists connect.localizacoes_alunos (
  aluno_id uuid primary key references connect.alunos(id) on delete cascade,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  dentro_do_senai boolean not null default false,
  dentro_perimetro boolean,
  em_aula boolean,
  precisao_metros numeric(10, 2),
  data_hora timestamptz,
  atualizado_em timestamptz not null default now()
);

create table if not exists grid.categorias_manutencao (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  descricao text,
  ativo boolean not null default true,
  status text not null default 'ativo',
  criado_em timestamptz not null default now()
);

create table if not exists grid.fornecedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text unique,
  email public.citext,
  telefone text,
  status text not null default 'ativo',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists grid.itens_estoque (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid references grid.categorias_manutencao(id) on delete set null,
  fornecedor_id uuid references grid.fornecedores(id) on delete set null,
  titulo text not null,
  descricao text not null default '',
  quantidade_disponivel int not null default 0,
  quantidade_minima int not null default 0,
  unidade text not null default 'un',
  localizacao text not null default 'N/A',
  empresa_distribuidora text,
  custo numeric(12, 2) not null default 0,
  status grid.status_estoque not null default 'disponivel',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create or replace function grid.generate_chamado_codigo()
returns text
language sql
volatile
as $$
  select '#CH-' || to_char(now(), 'YYYYMMDD') || '-' ||
         lpad((floor(random() * 1000000))::int::text, 6, '0');
$$;

create table if not exists grid.chamados (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique default grid.generate_chamado_codigo(),
  solicitante_id uuid references hub.usuarios(id) on delete restrict,
  aberto_por uuid references hub.usuarios(id) on delete restrict,
  titulo text not null,
  descricao text not null default '',
  sala_id uuid references hub.salas(id) on delete set null,
  bloco_id uuid references hub.blocos(id) on delete set null,
  categoria_id uuid references grid.categorias_manutencao(id) on delete set null,
  prioridade grid.prioridade_chamado not null default 'media',
  status grid.status_chamado not null default 'aberto',
  responsavel_id uuid references hub.usuarios(id) on delete set null,
  item_atribuido_id uuid references grid.itens_estoque(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  concluido_em timestamptz,
  check (solicitante_id is not null or aberto_por is not null)
);

create table if not exists grid.tarefas (
  id uuid primary key default gen_random_uuid(),
  chamado_id uuid not null unique references grid.chamados(id) on delete cascade,
  responsavel_id uuid references hub.usuarios(id) on delete set null,
  atribuido_por uuid references hub.usuarios(id) on delete set null,
  item_id uuid references grid.itens_estoque(id) on delete set null,
  status grid.status_tarefa not null default 'a_fazer',
  inicio_reparo timestamptz,
  fim_reparo timestamptz,
  observacao text,
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

create or replace function hub.current_user_role()
returns hub.tipo_usuario
language sql
stable
security definer
set search_path = hub, public
as $$
  select u.tipo_usuario
  from hub.usuarios u
  where u.id = auth.uid()
  limit 1;
$$;

create or replace function hub.current_user_status()
returns hub.status_usuario
language sql
stable
security definer
set search_path = hub, public
as $$
  select u.status
  from hub.usuarios u
  where u.id = auth.uid()
  limit 1;
$$;

create or replace function hub.is_active_user()
returns boolean
language sql
stable
as $$
  select hub.current_user_status() = 'ativo';
$$;

create or replace function hub.is_staff()
returns boolean
language sql
stable
as $$
  select hub.is_active_user()
     and hub.current_user_role() in (
       'admin',
       'professor',
       'secretaria',
       'direcao',
       'manutencao',
       'gerente_manutencao'
     );
$$;

create or replace function hub.can_manage_users()
returns boolean
language sql
stable
as $$
  select hub.is_active_user()
     and hub.current_user_role() in ('admin', 'secretaria', 'direcao');
$$;

create or replace function hub.is_connect_admin()
returns boolean
language sql
stable
as $$
  select hub.is_active_user()
     and hub.current_user_role() in ('admin', 'secretaria', 'direcao');
$$;

create or replace function hub.is_grid_manager()
returns boolean
language sql
stable
as $$
  select hub.is_active_user()
     and hub.current_user_role() in ('admin', 'gerente_manutencao', 'direcao');
$$;

create or replace function connect.current_aluno_id()
returns uuid
language sql
stable
security definer
set search_path = connect, hub, public
as $$
  select a.id
  from connect.alunos a
  where a.usuario_id = auth.uid()
  limit 1;
$$;

create or replace function connect.current_professor_id()
returns uuid
language sql
stable
security definer
set search_path = connect, hub, public
as $$
  select p.id
  from connect.professores p
  where p.usuario_id = auth.uid()
  limit 1;
$$;

create or replace function hub.sync_usuario_aplicacoes()
returns trigger
language plpgsql
security definer
set search_path = hub, public
as $$
declare
  v_codigos text[];
begin
  if new.status <> 'ativo' then
    update hub.usuario_aplicacoes
       set ativo = false
     where usuario_id = new.id;
    return new;
  end if;

  case new.tipo_usuario
    when 'admin' then
      v_codigos := array['senai_connect', 'senai_grid'];
    when 'direcao' then
      v_codigos := array['senai_connect', 'senai_grid'];
    when 'secretaria' then
      v_codigos := array['senai_connect', 'senai_grid'];
    when 'professor' then
      v_codigos := array['senai_connect', 'senai_grid'];
    when 'empresa' then
      v_codigos := array['senai_connect'];
    when 'manutencao' then
      v_codigos := array['senai_grid'];
    when 'gerente_manutencao' then
      v_codigos := array['senai_grid'];
    else
      v_codigos := array[]::text[];
  end case;

  insert into hub.usuario_aplicacoes (usuario_id, aplicacao_id, perfil, ativo)
  select new.id, a.id, new.tipo_usuario::text, true
  from hub.aplicacoes a
  where a.codigo = any(v_codigos)
  on conflict (usuario_id, aplicacao_id) do update
    set perfil = excluded.perfil,
        ativo = true;

  update hub.usuario_aplicacoes ua
     set ativo = false
   where ua.usuario_id = new.id
     and ua.aplicacao_id not in (
       select a.id
       from hub.aplicacoes a
       where a.codigo = any(v_codigos)
     );

  return new;
end;
$$;

create or replace function public.handle_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = hub, public, auth
as $$
declare
  v_tipo_text text;
  v_tipo hub.tipo_usuario;
  v_nome text;
  v_email public.citext;
begin
  v_tipo_text := coalesce(
    new.raw_user_meta_data ->> 'tipo_usuario',
    new.raw_user_meta_data ->> 'tipo'
  );
  v_tipo := hub.coerce_tipo_usuario(v_tipo_text, null);
  v_email := new.email::public.citext;
  v_nome := coalesce(
    nullif(new.raw_user_meta_data ->> 'nome', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    split_part(coalesce(new.email, 'usuario@senai.local'), '@', 1)
  );

  insert into hub.usuarios (
    id,
    nome,
    email,
    email_institucional,
    tipo_usuario,
    status,
    telefone,
    cpf
  )
  values (
    new.id,
    v_nome,
    v_email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'email_institucional', '')::public.citext,
      v_email
    ),
    coalesce(v_tipo, 'aluno'),
    'ativo',
    nullif(new.raw_user_meta_data ->> 'telefone', ''),
    nullif(new.raw_user_meta_data ->> 'cpf', '')
  )
  on conflict (id) do update
    set nome = coalesce(excluded.nome, hub.usuarios.nome),
        email = excluded.email,
        email_institucional = coalesce(excluded.email_institucional, hub.usuarios.email_institucional),
        tipo_usuario = coalesce(v_tipo, hub.usuarios.tipo_usuario),
        telefone = coalesce(excluded.telefone, hub.usuarios.telefone),
        cpf = coalesce(excluded.cpf, hub.usuarios.cpf),
        atualizado_em = now();

  return new;
end;
$$;

create or replace function grid.sync_chamado_columns()
returns trigger
language plpgsql
as $$
begin
  if new.solicitante_id is null then
    new.solicitante_id := new.aberto_por;
  end if;

  if new.aberto_por is null then
    new.aberto_por := new.solicitante_id;
  end if;

  if new.status in ('concluido', 'concluida') and new.concluido_em is null then
    new.concluido_em := now();
  end if;

  return new;
end;
$$;

insert into hub.aplicacoes (codigo, nome, descricao, ativo)
values
  ('senai_connect', 'SENAI Connect', 'Gestao educacional, frequencia, contratos e salarios.', true),
  ('senai_grid', 'SENAI Grid', 'Gestao de manutencao, chamados, tarefas e estoque.', true)
on conflict (codigo) do update
set nome = excluded.nome,
    descricao = excluded.descricao,
    ativo = excluded.ativo;

drop trigger if exists usuarios_updated_at on hub.usuarios;
create trigger usuarios_updated_at
before update on hub.usuarios
for each row execute function hub.set_updated_at();

drop trigger if exists blocos_updated_at on hub.blocos;
create trigger blocos_updated_at
before update on hub.blocos
for each row execute function hub.set_updated_at();

drop trigger if exists salas_updated_at on hub.salas;
create trigger salas_updated_at
before update on hub.salas
for each row execute function hub.set_updated_at();

drop trigger if exists cursos_updated_at on connect.cursos;
create trigger cursos_updated_at
before update on connect.cursos
for each row execute function hub.set_updated_at();

drop trigger if exists professores_updated_at on connect.professores;
create trigger professores_updated_at
before update on connect.professores
for each row execute function hub.set_updated_at();

drop trigger if exists turmas_updated_at on connect.turmas;
create trigger turmas_updated_at
before update on connect.turmas
for each row execute function hub.set_updated_at();

drop trigger if exists alunos_updated_at on connect.alunos;
create trigger alunos_updated_at
before update on connect.alunos
for each row execute function hub.set_updated_at();

drop trigger if exists empresas_updated_at on connect.empresas;
create trigger empresas_updated_at
before update on connect.empresas
for each row execute function hub.set_updated_at();

drop trigger if exists aulas_updated_at on connect.aulas;
create trigger aulas_updated_at
before update on connect.aulas
for each row execute function hub.set_updated_at();

drop trigger if exists frequencias_updated_at on connect.frequencias;
create trigger frequencias_updated_at
before update on connect.frequencias
for each row execute function hub.set_updated_at();

drop trigger if exists contratos_updated_at on connect.contratos_alunos;
create trigger contratos_updated_at
before update on connect.contratos_alunos
for each row execute function hub.set_updated_at();

drop trigger if exists salarios_updated_at on connect.salarios_alunos;
create trigger salarios_updated_at
before update on connect.salarios_alunos
for each row execute function hub.set_updated_at();

drop trigger if exists fornecedores_updated_at on grid.fornecedores;
create trigger fornecedores_updated_at
before update on grid.fornecedores
for each row execute function hub.set_updated_at();

drop trigger if exists itens_estoque_updated_at on grid.itens_estoque;
create trigger itens_estoque_updated_at
before update on grid.itens_estoque
for each row execute function hub.set_updated_at();

drop trigger if exists chamados_sync_columns on grid.chamados;
create trigger chamados_sync_columns
before insert or update on grid.chamados
for each row execute function grid.sync_chamado_columns();

drop trigger if exists chamados_updated_at on grid.chamados;
create trigger chamados_updated_at
before update on grid.chamados
for each row execute function hub.set_updated_at();

drop trigger if exists tarefas_updated_at on grid.tarefas;
create trigger tarefas_updated_at
before update on grid.tarefas
for each row execute function hub.set_updated_at();

drop trigger if exists sync_usuario_aplicacoes on hub.usuarios;
create trigger sync_usuario_aplicacoes
after insert or update of tipo_usuario, status on hub.usuarios
for each row execute function hub.sync_usuario_aplicacoes();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_auth_user_profile();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update of email, raw_user_meta_data on auth.users
for each row execute function public.handle_auth_user_profile();

create index if not exists usuarios_tipo_status_idx on hub.usuarios (tipo_usuario, status);
create index if not exists usuario_aplicacoes_usuario_idx on hub.usuario_aplicacoes (usuario_id, ativo);
create index if not exists notificacoes_usuario_lida_idx on hub.notificacoes (usuario_id, lida, created_at desc);
create index if not exists salas_bloco_idx on hub.salas (bloco_id);

create index if not exists alunos_turma_idx on connect.alunos (turma_id, status);
create index if not exists alunos_curso_idx on connect.alunos (curso_id);
create index if not exists turmas_curso_idx on connect.turmas (curso_id);
create index if not exists aulas_turma_data_idx on connect.aulas (turma_id, data_aula desc);
create index if not exists frequencias_aluno_idx on connect.frequencias (aluno_id, criado_em desc);
create index if not exists contratos_aluno_status_idx on connect.contratos_alunos (aluno_id, status);
create index if not exists salarios_aluno_mes_idx on connect.salarios_alunos (aluno_id, mes_referencia);
create index if not exists localizacoes_dentro_idx on connect.localizacoes_alunos (dentro_do_senai, atualizado_em desc);

create index if not exists chamados_status_prioridade_idx on grid.chamados (status, prioridade, criado_em desc);
create index if not exists chamados_responsavel_idx on grid.chamados (responsavel_id, status);
create index if not exists chamados_solicitante_idx on grid.chamados (solicitante_id, status);
create index if not exists tarefas_responsavel_status_idx on grid.tarefas (responsavel_id, status);
create index if not exists estoque_status_idx on grid.itens_estoque (status, quantidade_disponivel);
create index if not exists movimentacoes_item_idx on grid.movimentacoes_estoque (item_id, criado_em desc);

grant usage on schema hub, connect, grid to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema hub to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema connect to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema grid to anon, authenticated, service_role;
grant usage, select on all sequences in schema hub to anon, authenticated, service_role;
grant usage, select on all sequences in schema connect to anon, authenticated, service_role;
grant usage, select on all sequences in schema grid to anon, authenticated, service_role;
grant execute on all routines in schema hub to anon, authenticated, service_role;
grant execute on all routines in schema connect to anon, authenticated, service_role;
grant execute on all routines in schema grid to anon, authenticated, service_role;

alter default privileges for role postgres in schema hub
  grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema connect
  grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema grid
  grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema hub
  grant execute on routines to anon, authenticated, service_role;
alter default privileges for role postgres in schema connect
  grant execute on routines to anon, authenticated, service_role;
alter default privileges for role postgres in schema grid
  grant execute on routines to anon, authenticated, service_role;

alter table hub.usuarios enable row level security;
alter table hub.aplicacoes enable row level security;
alter table hub.usuario_aplicacoes enable row level security;
alter table hub.arquivos enable row level security;
alter table hub.notificacoes enable row level security;
alter table hub.logs_acesso enable row level security;
alter table hub.blocos enable row level security;
alter table hub.salas enable row level security;

alter table connect.cursos enable row level security;
alter table connect.professores enable row level security;
alter table connect.turmas enable row level security;
alter table connect.alunos enable row level security;
alter table connect.turma_alunos enable row level security;
alter table connect.professor_turmas enable row level security;
alter table connect.empresas enable row level security;
alter table connect.aulas enable row level security;
alter table connect.frequencias enable row level security;
alter table connect.contratos_alunos enable row level security;
alter table connect.salarios_alunos enable row level security;
alter table connect.calculos_salario enable row level security;
alter table connect.localizacoes_alunos enable row level security;

alter table grid.categorias_manutencao enable row level security;
alter table grid.fornecedores enable row level security;
alter table grid.itens_estoque enable row level security;
alter table grid.chamados enable row level security;
alter table grid.tarefas enable row level security;
alter table grid.movimentacoes_estoque enable row level security;
alter table grid.chamado_itens enable row level security;
alter table grid.relatorios enable row level security;

drop policy if exists usuarios_select on hub.usuarios;
create policy usuarios_select on hub.usuarios
for select
using (id = auth.uid() or hub.can_manage_users() or hub.is_grid_manager());

drop policy if exists usuarios_insert_admin on hub.usuarios;
create policy usuarios_insert_admin on hub.usuarios
for insert
with check (hub.can_manage_users());

drop policy if exists usuarios_update_admin on hub.usuarios;
create policy usuarios_update_admin on hub.usuarios
for update
using (hub.can_manage_users())
with check (hub.can_manage_users());

drop policy if exists usuarios_delete_admin on hub.usuarios;
create policy usuarios_delete_admin on hub.usuarios
for delete
using (hub.can_manage_users());

drop policy if exists aplicacoes_read_auth on hub.aplicacoes;
create policy aplicacoes_read_auth on hub.aplicacoes
for select
using (auth.uid() is not null);

drop policy if exists aplicacoes_manage_admin on hub.aplicacoes;
create policy aplicacoes_manage_admin on hub.aplicacoes
for all
using (hub.can_manage_users())
with check (hub.can_manage_users());

drop policy if exists usuario_aplicacoes_select on hub.usuario_aplicacoes;
create policy usuario_aplicacoes_select on hub.usuario_aplicacoes
for select
using (usuario_id = auth.uid() or hub.can_manage_users());

drop policy if exists usuario_aplicacoes_admin on hub.usuario_aplicacoes;
create policy usuario_aplicacoes_admin on hub.usuario_aplicacoes
for all
using (hub.can_manage_users())
with check (hub.can_manage_users());

drop policy if exists notificacoes_own on hub.notificacoes;
create policy notificacoes_own on hub.notificacoes
for select
using (usuario_id = auth.uid() or hub.can_manage_users());

drop policy if exists notificacoes_update_own on hub.notificacoes;
create policy notificacoes_update_own on hub.notificacoes
for update
using (usuario_id = auth.uid() or hub.can_manage_users())
with check (usuario_id = auth.uid() or hub.can_manage_users());

drop policy if exists notificacoes_insert_staff on hub.notificacoes;
create policy notificacoes_insert_staff on hub.notificacoes
for insert
with check (hub.is_staff() or usuario_id = auth.uid());

drop policy if exists arquivos_select_policy on hub.arquivos;
create policy arquivos_select_policy on hub.arquivos
for select
using (
  usuario_id = auth.uid()
  or enviado_por = auth.uid()
  or hub.is_connect_admin()
  or hub.is_grid_manager()
);

drop policy if exists arquivos_insert_policy on hub.arquivos;
create policy arquivos_insert_policy on hub.arquivos
for insert
with check (
  enviado_por = auth.uid()
  or usuario_id = auth.uid()
  or hub.is_connect_admin()
  or hub.is_grid_manager()
);

drop policy if exists blocos_salas_read on hub.blocos;
create policy blocos_salas_read on hub.blocos
for select
using (auth.uid() is not null);

drop policy if exists blocos_manage_admin on hub.blocos;
create policy blocos_manage_admin on hub.blocos
for all
using (hub.can_manage_users() or hub.is_grid_manager())
with check (hub.can_manage_users() or hub.is_grid_manager());

drop policy if exists salas_read on hub.salas;
create policy salas_read on hub.salas
for select
using (auth.uid() is not null);

drop policy if exists salas_manage_admin on hub.salas;
create policy salas_manage_admin on hub.salas
for all
using (hub.can_manage_users() or hub.is_grid_manager())
with check (hub.can_manage_users() or hub.is_grid_manager());

drop policy if exists logs_insert_auth on hub.logs_acesso;
create policy logs_insert_auth on hub.logs_acesso
for insert
with check (usuario_id = auth.uid() or hub.can_manage_users());

drop policy if exists cursos_read on connect.cursos;
create policy cursos_read on connect.cursos
for select
using (auth.uid() is not null);

drop policy if exists cursos_admin on connect.cursos;
create policy cursos_admin on connect.cursos
for all
using (hub.is_connect_admin())
with check (hub.is_connect_admin());

drop policy if exists alunos_select_policy on connect.alunos;
create policy alunos_select_policy on connect.alunos
for select
using (
  usuario_id = auth.uid()
  or hub.is_connect_admin()
  or exists (
    select 1
    from connect.professor_turmas pt
    where pt.professor_id = connect.current_professor_id()
      and pt.turma_id = alunos.turma_id
      and pt.ativo
  )
);

drop policy if exists alunos_admin on connect.alunos;
create policy alunos_admin on connect.alunos
for all
using (hub.is_connect_admin())
with check (hub.is_connect_admin());

drop policy if exists professores_select_policy on connect.professores;
create policy professores_select_policy on connect.professores
for select
using (usuario_id = auth.uid() or hub.is_connect_admin() or hub.current_user_role() = 'professor');

drop policy if exists professores_admin on connect.professores;
create policy professores_admin on connect.professores
for all
using (hub.is_connect_admin())
with check (hub.is_connect_admin());

drop policy if exists turmas_read_policy on connect.turmas;
create policy turmas_read_policy on connect.turmas
for select
using (
  hub.is_connect_admin()
  or id in (
    select ta.turma_id
    from connect.turma_alunos ta
    where ta.aluno_id = connect.current_aluno_id()
      and ta.ativo
  )
  or id in (
    select pt.turma_id
    from connect.professor_turmas pt
    where pt.professor_id = connect.current_professor_id()
      and pt.ativo
  )
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
  or aluno_id = connect.current_aluno_id()
  or turma_id in (
    select pt.turma_id
    from connect.professor_turmas pt
    where pt.professor_id = connect.current_professor_id()
      and pt.ativo
  )
);

drop policy if exists turma_alunos_admin on connect.turma_alunos;
create policy turma_alunos_admin on connect.turma_alunos
for all
using (hub.is_connect_admin())
with check (hub.is_connect_admin());

drop policy if exists professor_turmas_read_policy on connect.professor_turmas;
create policy professor_turmas_read_policy on connect.professor_turmas
for select
using (hub.is_connect_admin() or professor_id = connect.current_professor_id());

drop policy if exists professor_turmas_admin on connect.professor_turmas;
create policy professor_turmas_admin on connect.professor_turmas
for all
using (hub.is_connect_admin())
with check (hub.is_connect_admin());

drop policy if exists empresas_read_policy on connect.empresas;
create policy empresas_read_policy on connect.empresas
for select
using (hub.is_connect_admin() or hub.current_user_role() in ('professor', 'empresa'));

drop policy if exists empresas_admin on connect.empresas;
create policy empresas_admin on connect.empresas
for all
using (hub.is_connect_admin())
with check (hub.is_connect_admin());

drop policy if exists aulas_read_policy on connect.aulas;
create policy aulas_read_policy on connect.aulas
for select
using (
  hub.is_connect_admin()
  or turma_id in (
    select ta.turma_id
    from connect.turma_alunos ta
    where ta.aluno_id = connect.current_aluno_id()
      and ta.ativo
  )
  or turma_id in (
    select pt.turma_id
    from connect.professor_turmas pt
    where pt.professor_id = connect.current_professor_id()
      and pt.ativo
  )
);

drop policy if exists aulas_write_policy on connect.aulas;
create policy aulas_write_policy on connect.aulas
for all
using (
  hub.is_connect_admin()
  or turma_id in (
    select pt.turma_id
    from connect.professor_turmas pt
    where pt.professor_id = connect.current_professor_id()
      and pt.ativo
  )
)
with check (
  hub.is_connect_admin()
  or turma_id in (
    select pt.turma_id
    from connect.professor_turmas pt
    where pt.professor_id = connect.current_professor_id()
      and pt.ativo
  )
);

drop policy if exists frequencias_read_policy on connect.frequencias;
create policy frequencias_read_policy on connect.frequencias
for select
using (
  aluno_id = connect.current_aluno_id()
  or hub.is_connect_admin()
  or exists (
    select 1
    from connect.aulas au
    join connect.professor_turmas pt on pt.turma_id = au.turma_id
    where au.id = frequencias.aula_id
      and pt.professor_id = connect.current_professor_id()
      and pt.ativo
  )
);

drop policy if exists frequencias_write_policy on connect.frequencias;
create policy frequencias_write_policy on connect.frequencias
for all
using (
  hub.is_connect_admin()
  or exists (
    select 1
    from connect.aulas au
    join connect.professor_turmas pt on pt.turma_id = au.turma_id
    where au.id = frequencias.aula_id
      and pt.professor_id = connect.current_professor_id()
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
      and pt.professor_id = connect.current_professor_id()
      and pt.ativo
  )
);

drop policy if exists contratos_read_policy on connect.contratos_alunos;
create policy contratos_read_policy on connect.contratos_alunos
for select
using (
  hub.is_connect_admin()
  or aluno_id = connect.current_aluno_id()
);

drop policy if exists contratos_admin on connect.contratos_alunos;
create policy contratos_admin on connect.contratos_alunos
for all
using (hub.is_connect_admin())
with check (hub.is_connect_admin());

drop policy if exists salarios_read_policy on connect.salarios_alunos;
create policy salarios_read_policy on connect.salarios_alunos
for select
using (
  hub.is_connect_admin()
  or aluno_id = connect.current_aluno_id()
);

drop policy if exists salarios_admin on connect.salarios_alunos;
create policy salarios_admin on connect.salarios_alunos
for all
using (hub.is_connect_admin())
with check (hub.is_connect_admin());

drop policy if exists calculos_read_policy on connect.calculos_salario;
create policy calculos_read_policy on connect.calculos_salario
for select
using (
  hub.is_connect_admin()
  or exists (
    select 1
    from connect.salarios_alunos s
    where s.id = calculos_salario.salario_id
      and s.aluno_id = connect.current_aluno_id()
  )
);

drop policy if exists localizacoes_read_policy on connect.localizacoes_alunos;
create policy localizacoes_read_policy on connect.localizacoes_alunos
for select
using (
  aluno_id = connect.current_aluno_id()
  or hub.is_connect_admin()
  or exists (
    select 1
    from connect.alunos a
    join connect.professor_turmas pt on pt.turma_id = a.turma_id
    where a.id = localizacoes_alunos.aluno_id
      and pt.professor_id = connect.current_professor_id()
      and pt.ativo
  )
);

drop policy if exists localizacoes_write_policy on connect.localizacoes_alunos;
create policy localizacoes_write_policy on connect.localizacoes_alunos
for all
using (aluno_id = connect.current_aluno_id() or hub.is_connect_admin())
with check (aluno_id = connect.current_aluno_id() or hub.is_connect_admin());

drop policy if exists categorias_grid_read on grid.categorias_manutencao;
create policy categorias_grid_read on grid.categorias_manutencao
for select
using (hub.is_staff());

drop policy if exists categorias_grid_manage on grid.categorias_manutencao;
create policy categorias_grid_manage on grid.categorias_manutencao
for all
using (hub.is_grid_manager())
with check (hub.is_grid_manager());

drop policy if exists fornecedores_grid_read on grid.fornecedores;
create policy fornecedores_grid_read on grid.fornecedores
for select
using (hub.is_staff());

drop policy if exists fornecedores_grid_manage on grid.fornecedores;
create policy fornecedores_grid_manage on grid.fornecedores
for all
using (hub.is_grid_manager())
with check (hub.is_grid_manager());

drop policy if exists estoque_read_grid on grid.itens_estoque;
create policy estoque_read_grid on grid.itens_estoque
for select
using (hub.is_staff());

drop policy if exists estoque_manage_grid on grid.itens_estoque;
create policy estoque_manage_grid on grid.itens_estoque
for all
using (hub.is_grid_manager())
with check (hub.is_grid_manager());

drop policy if exists chamados_read_policy on grid.chamados;
create policy chamados_read_policy on grid.chamados
for select
using (
  hub.is_grid_manager()
  or hub.current_user_role() in ('secretaria', 'direcao', 'admin')
  or solicitante_id = auth.uid()
  or aberto_por = auth.uid()
  or responsavel_id = auth.uid()
);

drop policy if exists chamados_insert_policy on grid.chamados;
create policy chamados_insert_policy on grid.chamados
for insert
with check (
  hub.is_grid_manager()
  or (
    hub.is_staff()
    and coalesce(solicitante_id, aberto_por) = auth.uid()
  )
);

drop policy if exists chamados_update_policy on grid.chamados;
create policy chamados_update_policy on grid.chamados
for update
using (hub.is_grid_manager() or responsavel_id = auth.uid())
with check (hub.is_grid_manager() or responsavel_id = auth.uid());

drop policy if exists chamados_delete_policy on grid.chamados;
create policy chamados_delete_policy on grid.chamados
for delete
using (hub.is_grid_manager());

drop policy if exists tarefas_read_policy on grid.tarefas;
create policy tarefas_read_policy on grid.tarefas
for select
using (
  hub.is_grid_manager()
  or responsavel_id = auth.uid()
  or exists (
    select 1
    from grid.chamados c
    where c.id = tarefas.chamado_id
      and (c.solicitante_id = auth.uid() or c.aberto_por = auth.uid())
  )
);

drop policy if exists tarefas_insert_policy on grid.tarefas;
create policy tarefas_insert_policy on grid.tarefas
for insert
with check (hub.is_grid_manager());

drop policy if exists tarefas_update_policy on grid.tarefas;
create policy tarefas_update_policy on grid.tarefas
for update
using (hub.is_grid_manager() or responsavel_id = auth.uid())
with check (hub.is_grid_manager() or responsavel_id = auth.uid());

drop policy if exists tarefas_delete_policy on grid.tarefas;
create policy tarefas_delete_policy on grid.tarefas
for delete
using (hub.is_grid_manager());

drop policy if exists movimentacoes_read_grid on grid.movimentacoes_estoque;
create policy movimentacoes_read_grid on grid.movimentacoes_estoque
for select
using (hub.is_staff());

drop policy if exists movimentacoes_insert_grid on grid.movimentacoes_estoque;
create policy movimentacoes_insert_grid on grid.movimentacoes_estoque
for insert
with check (hub.current_user_role() in ('admin', 'manutencao', 'gerente_manutencao', 'direcao'));

drop policy if exists chamado_itens_read_grid on grid.chamado_itens;
create policy chamado_itens_read_grid on grid.chamado_itens
for select
using (hub.is_staff());

drop policy if exists chamado_itens_manage_grid on grid.chamado_itens;
create policy chamado_itens_manage_grid on grid.chamado_itens
for all
using (hub.is_grid_manager())
with check (hub.is_grid_manager());

drop policy if exists relatorios_grid_read on grid.relatorios;
create policy relatorios_grid_read on grid.relatorios
for select
using (hub.current_user_role() in ('admin', 'secretaria', 'direcao', 'gerente_manutencao'));

drop policy if exists relatorios_grid_manage on grid.relatorios;
create policy relatorios_grid_manage on grid.relatorios
for all
using (hub.current_user_role() in ('admin', 'direcao', 'gerente_manutencao'))
with check (hub.current_user_role() in ('admin', 'direcao', 'gerente_manutencao'));

create or replace view public.connect_alunos_view
with (security_invoker = true) as
select
  a.id,
  a.usuario_id,
  u.nome,
  coalesce(a.email_institucional, u.email_institucional, u.email) as email_institucional,
  a.rm,
  t.nome as turma_nome,
  c.nome as curso_nome,
  a.empresa_nome,
  a.status,
  coalesce(l.dentro_do_senai, false) as dentro_do_senai
from connect.alunos a
join hub.usuarios u on u.id = a.usuario_id
left join connect.turmas t on t.id = a.turma_id
left join connect.cursos c on c.id = a.curso_id
left join connect.localizacoes_alunos l on l.aluno_id = a.id;

create or replace view public.connect_professores_view
with (security_invoker = true) as
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

create or replace view public.grid_chamados_view
with (security_invoker = true) as
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

create or replace view public.grid_tarefas_view
with (security_invoker = true) as
select
  t.id,
  c.codigo,
  c.titulo,
  c.descricao,
  c.prioridade,
  t.status,
  ur.nome as responsavel_nome,
  t.item_id,
  t.inicio_reparo,
  t.fim_reparo,
  t.observacao,
  c.criado_em
from grid.tarefas t
join grid.chamados c on c.id = t.chamado_id
left join hub.usuarios ur on ur.id = t.responsavel_id;

insert into hub.blocos (id, nome, descricao, latitude, longitude)
values
  ('10000000-0000-0000-0000-000000000001', 'A', 'Administracao e recepcao', -22.5648, -47.4014),
  ('10000000-0000-0000-0000-000000000002', 'B', 'Laboratorios', -22.5649, -47.4012),
  ('10000000-0000-0000-0000-000000000003', 'C', 'Oficinas', -22.5650, -47.4015),
  ('10000000-0000-0000-0000-000000000004', 'D', 'Salas de aula', -22.5647, -47.4011),
  ('10000000-0000-0000-0000-000000000005', 'E', 'Apoio e almoxarifado', -22.5651, -47.4013)
on conflict (nome) do update
set descricao = excluded.descricao,
    latitude = excluded.latitude,
    longitude = excluded.longitude;

insert into hub.salas (id, bloco_id, nome, tipo, capacidade, andar)
values
  ('11000000-0000-0000-0000-000000000201', '10000000-0000-0000-0000-000000000004', '201', 'sala', 40, '2'),
  ('11000000-0000-0000-0000-000000000203', '10000000-0000-0000-0000-000000000001', '203', 'sala', 40, '2'),
  ('11000000-0000-0000-0000-000000000204', '10000000-0000-0000-0000-000000000002', '204', 'laboratorio', 32, '2'),
  ('11000000-0000-0000-0000-000000000207', '10000000-0000-0000-0000-000000000002', '207', 'sala', 35, '2'),
  ('11000000-0000-0000-0000-000000000108', '10000000-0000-0000-0000-000000000003', '108', 'oficina', 28, '1')
on conflict (bloco_id, nome) do update
set tipo = excluded.tipo,
    capacidade = excluded.capacidade,
    andar = excluded.andar;

insert into grid.categorias_manutencao (id, nome, descricao, ativo, status)
values
  ('30000000-0000-0000-0000-000000000001', 'Eletrico', 'Servicos eletricos e iluminacao.', true, 'ativo'),
  ('30000000-0000-0000-0000-000000000002', 'Hidraulico', 'Vazamentos, registros e tubulacoes.', true, 'ativo'),
  ('30000000-0000-0000-0000-000000000003', 'Equipamentos', 'Equipamentos de laboratorio e informatica.', true, 'ativo')
on conflict (nome) do update
set descricao = excluded.descricao,
    ativo = excluded.ativo,
    status = excluded.status;
