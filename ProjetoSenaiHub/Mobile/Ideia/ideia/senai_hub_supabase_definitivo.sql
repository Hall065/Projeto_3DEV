-- ============================================================================
-- SENAI HUB - SCHEMA DEFINITIVO SUPABASE
-- Site Laravel + App Mobile usando UM ÚNICO banco Supabase/PostgreSQL
--
-- USO RECOMENDADO:
--   1. Use em um projeto Supabase novo ou em um banco resetado.
--   2. Faça backup antes de aplicar em banco com dados reais.
--   3. Autenticação principal: Supabase Auth.
--      Regra central: hub.usuarios.id = auth.users.id.
--   4. O site deve ser ajustado para usar Supabase Auth ou as views públicas
--      de compatibilidade criadas no final deste arquivo.
--
-- PRINCÍPIOS DESTA VERSÃO:
--   - Mantém a estrutura atual que já rodava no Supabase como base principal.
--   - Adiciona os campos/tabelas que existiam no SQL unificado e nas migrations
--     Laravel para aumentar compatibilidade com site e app.
--   - Usa ENUMs para padronização, RLS para segurança e audit logs para rastreio.
--   - Evita expor senha/hash em hub.usuarios; credenciais legadas ficam separadas.
-- ============================================================================

begin;

create extension if not exists pgcrypto with schema public;
create extension if not exists citext with schema public;

create schema if not exists hub;
create schema if not exists connect;
create schema if not exists grid;

-- ============================================================================
-- TIPOS / ENUMS
-- ============================================================================

do $$
begin
  create type hub.tipo_usuario as enum (
    'admin',
    'aluno',
    'professor',
    'secretaria',
    'direcao',
    'empresa',
    'manutencao',
    'gerente_manutencao',
    'connect_professor',
    'connect_secretaria',
    'connect_aqv',
    'connect_empresa',
    'connect_aluno',
    'grid_chefe',
    'grid_funcionario'
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
    'P',
    'FJ',
    'FI',
    'presente',
    'falta_justificada',
    'falta_injustificada',
    'present',
    'justified',
    'absent'
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
    'em_atendimento',
    'concluido',
    'concluida',
    'cancelado'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type grid.status_tarefa as enum (
    'a_fazer',
    'em_andamento',
    'concluido',
    'concluida',
    'cancelado'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type grid.status_estoque as enum (
    'disponivel',
    'indisponivel',
    'baixo',
    'estoque_baixo',
    'reservado',
    'esgotado'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type grid.tipo_movimentacao as enum ('entrada', 'saida', 'reserva', 'retorno', 'ajuste');
exception when duplicate_object then null;
end $$;

-- ============================================================================
-- FUNÇÕES BASE
-- ============================================================================

create or replace function hub.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  if to_jsonb(new) ? 'atualizado_em' then
    new.atualizado_em = now();
  end if;

  if to_jsonb(new) ? 'updated_at' then
    new.updated_at = now();
  end if;

  return new;
end;
$$;

create or replace function hub.generate_code(p_prefix text)
returns text
language sql
volatile
as $$
  select upper(coalesce(p_prefix, 'REG')) || '-' || to_char(now(), 'YYYYMMDD') || '-' ||
         lpad((floor(random() * 1000000))::int::text, 6, '0');
$$;

create or replace function hub.coerce_tipo_usuario(
  p_value text,
  p_default hub.tipo_usuario default 'aluno'
)
returns hub.tipo_usuario
language plpgsql
immutable
as $$
declare
  v text;
begin
  v := lower(nullif(btrim(coalesce(p_value, '')), ''));

  if v is null then
    return p_default;
  end if;

  case v
    when 'student' then return 'aluno';
    when 'teacher' then return 'professor';
    when 'staff' then return 'secretaria';
    when 'other' then return p_default;
    when 'grid_manager' then return 'grid_chefe';
    when 'maintenance' then return 'grid_funcionario';
    when 'secretary' then return 'secretaria';
    when 'director' then return 'direcao';
    else
      return v::hub.tipo_usuario;
  end case;
exception
  when invalid_text_representation then
    return p_default;
end;
$$;

create or replace function hub.coerce_status_usuario(
  p_value text,
  p_default hub.status_usuario default 'ativo'
)
returns hub.status_usuario
language plpgsql
immutable
as $$
declare
  v text;
begin
  v := lower(nullif(btrim(coalesce(p_value, '')), ''));

  if v is null then
    return p_default;
  end if;

  case v
    when 'active' then return 'ativo';
    when 'inactive' then return 'inativo';
    when 'blocked' then return 'bloqueado';
    when 'pending' then return 'pendente';
    else
      return v::hub.status_usuario;
  end case;
exception
  when invalid_text_representation then
    return p_default;
end;
$$;

-- ============================================================================
-- HUB / USUÁRIOS / SEGURANÇA
-- ============================================================================

create table if not exists hub.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,

  -- Dados principais usados pelo app.
  nome text not null,
  email public.citext not null unique,
  email_institucional public.citext,
  tipo_usuario hub.tipo_usuario not null default 'aluno',
  status hub.status_usuario not null default 'ativo',
  cpf text unique,
  telefone text,
  empresa_id uuid,

  -- Compatibilidade com campos usados no site/app.
  company_name text,
  avatar_url text,
  foto_url text,
  foto_arquivo_id uuid,
  custom_permissions jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  email_verified_at timestamptz,

  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table hub.usuarios is 'Perfil público/operacional do usuário. Login e senha ficam no Supabase Auth.';
comment on column hub.usuarios.id is 'Mesmo UUID de auth.users.id.';
comment on column hub.usuarios.custom_permissions is 'Permissões extras opcionais do site Laravel/app. Não substitui RLS.';

create table if not exists hub.credenciais_legadas (
  usuario_id uuid primary key references hub.usuarios(id) on delete cascade,
  senha_hash text,
  remember_token text,
  ultimo_login_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table hub.credenciais_legadas is
  'Compatibilidade legada do Laravel. Evite usar. A autenticação correta deve ser Supabase Auth.';

create table if not exists hub.aplicacoes (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique check (codigo in ('senai_hub', 'senai_connect', 'senai_grid', 'connect', 'grid')),
  slug text unique,
  nome text not null,
  name text,
  descricao text,
  description text,
  route_path text,
  icon text not null default 'grid',
  sort_order smallint not null default 0,
  ativo boolean not null default true,
  is_active boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hub.usuario_aplicacoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references hub.usuarios(id) on delete cascade,
  aplicacao_id uuid not null references hub.aplicacoes(id) on delete cascade,
  perfil text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (usuario_id, aplicacao_id)
);

create table if not exists hub.arquivos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references hub.usuarios(id) on delete set null,
  enviado_por uuid references hub.usuarios(id) on delete set null,
  bucket text not null default 'senai-hub',
  caminho text,
  nome_original text,
  mime_type text,
  tamanho_bytes bigint,
  url_publica text,
  url_segura text,
  public_id text,
  tipo_arquivo text,
  relacionamento_tipo text,
  relacionamento_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'usuarios_foto_arquivo_fk') then
    alter table hub.usuarios
      add constraint usuarios_foto_arquivo_fk
      foreign key (foto_arquivo_id) references hub.arquivos(id) on delete set null;
  end if;
end $$;

create table if not exists hub.notificacoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references hub.usuarios(id) on delete cascade,
  titulo text not null,
  mensagem text,
  corpo text,
  lida boolean not null default false,
  lida_em timestamptz,
  dados jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hub.logs_acesso (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references hub.usuarios(id) on delete set null,
  aplicacao text,
  ip inet,
  user_agent text,
  acao text not null,
  sucesso boolean not null default true,
  detalhes jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists hub.audit_logs (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references hub.usuarios(id) on delete set null,
  schema_name text not null,
  table_name text not null,
  record_id text,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists hub.security_events (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references hub.usuarios(id) on delete set null,
  evento text not null,
  nivel text not null default 'info' check (nivel in ('info', 'warning', 'critical')),
  ip inet,
  user_agent text,
  detalhes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists hub.sessoes_dispositivos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references hub.usuarios(id) on delete cascade,
  device_id text,
  device_name text,
  plataforma text,
  push_token text,
  ultimo_acesso_em timestamptz,
  revogada_em timestamptz,
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (usuario_id, device_id)
);

create table if not exists hub.blocos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  descricao text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bloco_id, nome)
);

create table if not exists hub.pessoas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references hub.usuarios(id) on delete set null,
  kind text not null default 'other' check (kind in ('student', 'teacher', 'staff', 'coordinator', 'company', 'other')),
  full_name text not null,
  cpf text,
  registration_number text,
  email public.citext,
  phone text,
  birth_date date,
  specialty text,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hub.report_presets (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references hub.usuarios(id) on delete cascade,
  modulo text not null,
  nome text not null,
  configuracao jsonb not null default '{}'::jsonb,
  compartilhado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (usuario_id, modulo, nome)
);

create table if not exists hub.spreadsheet_import_logs (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references hub.usuarios(id) on delete set null,
  modulo text not null,
  spreadsheet_key text not null,
  filename text,
  rows_total int not null default 0,
  created_count int not null default 0,
  updated_count int not null default 0,
  errors_count int not null default 0,
  status text not null default 'success',
  detalhes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- CONNECT / ACADÊMICO, FREQUÊNCIA, CONTRATOS, LOCALIZAÇÃO
-- ============================================================================

create table if not exists connect.cursos (
  id uuid primary key default gen_random_uuid(),
  codigo text unique,
  code text unique,
  nome text not null unique,
  name text,
  descricao text,
  description text,
  modalidade text not null default 'tecnico',
  periodo connect.periodo_turma,
  carga_horaria int,
  workload_hours int not null default 0,
  area text,
  data_inicio date,
  data_termino date,
  status text not null default 'ativo',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists connect.professores (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid unique references hub.usuarios(id) on delete set null,
  pessoa_id uuid references hub.pessoas(id) on delete set null,
  nome text,
  full_name text,
  cpf text,
  email public.citext,
  telefone text,
  phone text,
  especialidade text,
  specialty text,
  tempo_contrato text,
  data_contratacao date,
  data_nascimento date,
  celular text,
  endereco text,
  status hub.status_usuario not null default 'ativo',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists connect.turmas (
  id uuid primary key default gen_random_uuid(),
  curso_id uuid references connect.cursos(id) on delete set null,
  professor_responsavel_id uuid references connect.professores(id) on delete set null,
  sala_id uuid references hub.salas(id) on delete set null,
  codigo text unique,
  code text unique,
  nome text not null unique,
  name text,
  periodo connect.periodo_turma not null default 'manha',
  horario_inicio time,
  horario_fim time,
  data_inicio date,
  data_termino date,
  capacidade int not null default 30,
  default_lessons_per_day smallint not null default 4,
  max_absences_allowed smallint,
  status text not null default 'ativa',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists connect.alunos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid unique references hub.usuarios(id) on delete set null,
  pessoa_id uuid references hub.pessoas(id) on delete set null,
  curso_id uuid references connect.cursos(id) on delete set null,
  turma_id uuid references connect.turmas(id) on delete set null,
  foto_arquivo_id uuid references hub.arquivos(id) on delete set null,
  foto_url text,
  rm text unique,
  matricula text,
  registration_number text,
  nome text,
  full_name text,
  cpf text,
  email public.citext,
  phone text,
  telefone text,
  email_pessoal public.citext,
  email_institucional public.citext,
  empresa_nome text,
  data_nascimento date,
  birth_date date,
  nome_responsavel text,
  max_absences_allowed smallint,
  status hub.status_usuario not null default 'ativo',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists connect.turma_alunos (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references connect.turmas(id) on delete cascade,
  aluno_id uuid not null references connect.alunos(id) on delete cascade,
  data_entrada date not null default current_date,
  data_saida date,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (turma_id, aluno_id)
);

create table if not exists connect.professor_turmas (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references connect.professores(id) on delete cascade,
  turma_id uuid not null references connect.turmas(id) on delete cascade,
  disciplina text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (professor_id, turma_id, disciplina)
);

create table if not exists connect.curso_pessoas (
  id uuid primary key default gen_random_uuid(),
  curso_id uuid not null references connect.cursos(id) on delete cascade,
  pessoa_id uuid not null references hub.pessoas(id) on delete cascade,
  papel text not null default 'student',
  status text not null default 'active',
  matriculado_em date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (curso_id, pessoa_id, papel)
);

create table if not exists connect.turma_pessoas (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references connect.turmas(id) on delete cascade,
  pessoa_id uuid not null references hub.pessoas(id) on delete cascade,
  papel text not null default 'student',
  status text not null default 'active',
  entrou_em date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (turma_id, pessoa_id)
);

create table if not exists connect.empresas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references hub.usuarios(id) on delete set null,
  nome text not null,
  company_name text,
  cnpj text unique,
  email public.citext,
  telefone text,
  responsavel_nome text,
  status text not null default 'ativa',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'usuarios_empresa_id_fk') then
    alter table hub.usuarios
      add constraint usuarios_empresa_id_fk
      foreign key (empresa_id) references connect.empresas(id) on delete set null;
  end if;
end $$;

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
  lessons_count int not null default 4,
  observacao text,
  status text not null default 'open',
  criado_por uuid references hub.usuarios(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (turma_id, data_aula, disciplina)
);

create table if not exists connect.frequencias (
  id uuid primary key default gen_random_uuid(),
  aula_id uuid not null references connect.aulas(id) on delete cascade,
  aluno_id uuid not null references connect.alunos(id) on delete cascade,
  status connect.status_frequencia not null default 'presente',
  quantidade_aulas_faltadas int not null default 0,
  missed_lessons int not null default 0,
  justificativa text,
  observacao text,
  notes text,
  registrado_por uuid references hub.usuarios(id) on delete set null,
  criado_por uuid references hub.usuarios(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (aula_id, aluno_id)
);

create table if not exists connect.contratos_alunos (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references connect.alunos(id) on delete cascade,
  empresa_id uuid references connect.empresas(id) on delete set null,
  empresa_nome text,
  company_name text,
  contract_type text not null default 'estagio',
  weekly_hours smallint,
  carga_horaria text,
  carteira_trabalho text,
  conta_bancaria text,
  localizacao_empresa text,
  email_empresa public.citext,
  company_email public.citext,
  arquivo_id uuid references hub.arquivos(id) on delete set null,
  data_inicio date,
  data_termino date,
  data_fim date,
  monthly_value numeric(12, 2) not null default 0,
  status text not null default 'ativo',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists connect.salarios_alunos (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references connect.alunos(id) on delete cascade,
  empresa_id uuid references connect.empresas(id) on delete set null,
  contrato_id uuid references connect.contratos_alunos(id) on delete set null,
  mes_referencia text not null,
  reference_month date,
  tipo_pagamento text not null default 'mensal',
  salario_base numeric(12, 2) not null default 0,
  base_amount numeric(12, 2) not null default 0,
  valor_hora numeric(12, 2),
  valor_dia numeric(12, 2),
  carga_diaria_horas numeric(6, 2) default 6,
  dias_uteis_mes int default 22,
  outros_descontos numeric(12, 2) not null default 0,
  deductions numeric(12, 2) not null default 0,
  bonuses numeric(12, 2) not null default 0,
  desconto numeric(12, 2) not null default 0,
  salario_final numeric(12, 2),
  net_amount numeric(12, 2) not null default 0,
  frequencia_percentual numeric(6, 2),
  dias_trabalhados int,
  faltas_injustificadas int not null default 0,
  status text not null default 'calculado',
  calculado_em timestamptz,
  calculated_at timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (aluno_id, mes_referencia)
);

create table if not exists connect.calculos_salario (
  id uuid primary key default gen_random_uuid(),
  salario_id uuid references connect.salarios_alunos(id) on delete cascade,
  aluno_id uuid not null references connect.alunos(id) on delete cascade,
  contrato_id uuid references connect.contratos_alunos(id) on delete set null,
  empresa_id uuid references connect.empresas(id) on delete set null,
  mes_referencia text not null,
  salario_base numeric(12, 2) not null default 0,
  valor_dia numeric(12, 2) not null default 0,
  desconto numeric(12, 2) not null default 0,
  salario_final numeric(12, 2) not null default 0,
  dias_uteis int not null default 0,
  dias_trabalhados int not null default 0,
  faltas_justificadas int not null default 0,
  faltas_injustificadas int not null default 0,
  frequencia_percentual numeric(6, 2) not null default 0,
  desconto_faltas numeric(12, 2) not null default 0,
  status text not null default 'calculado',
  calculado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (aluno_id, mes_referencia)
);

create table if not exists connect.localizacoes_alunos (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null unique references connect.alunos(id) on delete cascade,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  endereco text,
  cidade text,
  estado text,
  dentro_do_senai boolean not null default false,
  dentro_perimetro boolean not null default false,
  em_aula boolean not null default false,
  precisao_metros numeric(10, 2),
  data_hora timestamptz default now(),
  last_seen_at timestamptz,
  status text not null default 'offline',
  atualizado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists connect.atividades (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  tipo text not null default 'general',
  entidade_tipo text,
  entidade_id uuid,
  executado_por uuid references hub.usuarios(id) on delete set null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists connect.alertas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  mensagem text not null,
  tipo text not null default 'info',
  categoria text not null default 'cadastro',
  entidade_tipo text,
  entidade_id uuid,
  usuario_id uuid references hub.usuarios(id) on delete cascade,
  lido boolean not null default false,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists connect.metricas_dashboard (
  id uuid primary key default gen_random_uuid(),
  chave text not null unique,
  valor jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- GRID / MANUTENÇÃO, CHAMADOS, ESTOQUE
-- ============================================================================

create table if not exists grid.categorias_manutencao (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  descricao text,
  ativo boolean not null default true,
  status text not null default 'ativo',
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists grid.fornecedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text unique,
  email public.citext,
  telefone text,
  status text not null default 'ativo',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists grid.itens_estoque (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid references grid.categorias_manutencao(id) on delete set null,
  fornecedor_id uuid references grid.fornecedores(id) on delete set null,
  titulo text not null,
  descricao text not null default '',
  categoria_texto text,
  sku text,
  imagem_url text,
  quantidade_disponivel int not null default 0,
  quantidade_reservada int not null default 0,
  quantidade_minima int not null default 0,
  unidade text not null default 'un',
  localizacao text not null default 'N/A',
  empresa_distribuidora text,
  fornecedor_nome text,
  custo numeric(12, 2) not null default 0,
  data_compra date,
  status grid.status_estoque not null default 'disponivel',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (quantidade_disponivel >= 0),
  check (quantidade_reservada >= 0),
  check (quantidade_minima >= 0)
);

create table if not exists grid.chamados (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique default hub.generate_code('CH'),
  solicitante_id uuid references hub.usuarios(id) on delete restrict,
  aberto_por uuid references hub.usuarios(id) on delete restrict,
  solicitante_nome text,
  titulo text not null,
  descricao text not null default '',
  resumo text,
  sala_id uuid references hub.salas(id) on delete set null,
  bloco_id uuid references hub.blocos(id) on delete set null,
  sala_texto text,
  bloco_texto text,
  categoria_id uuid references grid.categorias_manutencao(id) on delete set null,
  prioridade grid.prioridade_chamado not null default 'media',
  status grid.status_chamado not null default 'aberto',
  responsavel_id uuid references hub.usuarios(id) on delete set null,
  responsavel_nome text,
  item_atribuido_id uuid references grid.itens_estoque(id) on delete set null,
  imagem_url text,
  evidencia_url text,
  data_abertura timestamptz,
  data_fechamento timestamptz,
  iniciado_em timestamptz,
  concluido_em timestamptz,
  resumo_resolucao text,
  descricao_corrigida text,
  consideracoes text,
  avaliacao_nota smallint check (avaliacao_nota is null or avaliacao_nota between 1 and 5),
  avaliacao_observacao text,
  avaliado_por text,
  avaliado_em timestamptz,
  aprovado_por text,
  aprovado_em timestamptz,
  observacoes_aprovacao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (solicitante_id is not null or aberto_por is not null or solicitante_nome is not null)
);

create table if not exists grid.tarefas (
  id uuid primary key default gen_random_uuid(),
  chamado_id uuid references grid.chamados(id) on delete cascade,
  codigo text unique default hub.generate_code('TK'),
  aberto_por text,
  responsavel_id uuid references hub.usuarios(id) on delete set null,
  atribuido_por uuid references hub.usuarios(id) on delete set null,
  item_id uuid references grid.itens_estoque(id) on delete set null,
  titulo text,
  descricao text,
  sala_texto text,
  bloco_texto text,
  prioridade grid.prioridade_chamado not null default 'media',
  status grid.status_tarefa not null default 'a_fazer',
  coluna text not null default 'a_fazer',
  status_label text,
  items jsonb,
  inventory_items jsonb,
  inicio_reparo timestamptz,
  fim_reparo timestamptz,
  aberto_em timestamptz,
  concluido_em timestamptz,
  observacao text,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
  criado_em timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists grid.chamado_itens (
  id uuid primary key default gen_random_uuid(),
  chamado_id uuid not null references grid.chamados(id) on delete cascade,
  item_id uuid not null references grid.itens_estoque(id) on delete restrict,
  quantidade int not null check (quantidade > 0),
  retornado boolean not null default false,
  criado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (chamado_id, item_id)
);

create table if not exists grid.reservas_estoque (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid references grid.tarefas(id) on delete cascade,
  chamado_id uuid references grid.chamados(id) on delete set null,
  item_id uuid not null references grid.itens_estoque(id) on delete cascade,
  quantidade int not null check (quantidade > 0),
  status text not null default 'reserved',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists grid.anexos_chamado (
  id uuid primary key default gen_random_uuid(),
  chamado_id uuid not null references grid.chamados(id) on delete cascade,
  arquivo_id uuid references hub.arquivos(id) on delete set null,
  tipo text not null default 'abertura',
  url text,
  criado_em timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists grid.relatorios (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  periodo_inicio date not null,
  periodo_fim date not null,
  filtros jsonb not null default '{}'::jsonb,
  dados jsonb not null default '{}'::jsonb,
  criado_por uuid references hub.usuarios(id) on delete set null,
  criado_em timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- SUPORTE OPCIONAL AO LARAVEL NO BANCO
-- Não é usado pelo app mobile. Mantido para cache, jobs, sessões e Sanctum.
-- ============================================================================

create table if not exists public.password_reset_tokens (
  email text primary key,
  token text not null,
  created_at timestamptz
);

create table if not exists public.sessions (
  id text primary key,
  user_id uuid,
  ip_address varchar(45),
  user_agent text,
  payload text not null,
  last_activity integer not null
);

create table if not exists public.personal_access_tokens (
  id bigserial primary key,
  tokenable_type text not null,
  tokenable_id uuid not null,
  name text not null,
  token varchar(64) not null unique,
  abilities text,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
);

create table if not exists public.cache (
  key text primary key,
  value text not null,
  expiration bigint not null
);

create table if not exists public.cache_locks (
  key text primary key,
  owner text not null,
  expiration bigint not null
);

create table if not exists public.jobs (
  id bigserial primary key,
  queue text not null,
  payload text not null,
  attempts smallint not null,
  reserved_at integer,
  available_at integer not null,
  created_at integer not null
);

create table if not exists public.job_batches (
  id text primary key,
  name text not null,
  total_jobs integer not null,
  pending_jobs integer not null,
  failed_jobs integer not null,
  failed_job_ids text not null,
  options text,
  cancelled_at integer,
  created_at integer not null,
  finished_at integer
);

create table if not exists public.failed_jobs (
  id bigserial primary key,
  uuid text not null unique,
  connection text not null,
  queue text not null,
  payload text not null,
  exception text not null,
  failed_at timestamptz not null default now()
);

-- ============================================================================
-- FUNÇÕES DE PERMISSÃO / PERFIL
-- ============================================================================

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
  select auth.uid() is not null and hub.current_user_status() = 'ativo';
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
       'gerente_manutencao',
       'connect_professor',
       'connect_secretaria',
       'connect_aqv',
       'grid_chefe',
       'grid_funcionario'
     );
$$;

create or replace function hub.can_manage_users()
returns boolean
language sql
stable
as $$
  select hub.is_active_user()
     and hub.current_user_role() in ('admin', 'secretaria', 'direcao', 'connect_secretaria', 'connect_aqv');
$$;

create or replace function hub.is_connect_admin()
returns boolean
language sql
stable
as $$
  select hub.is_active_user()
     and hub.current_user_role() in ('admin', 'secretaria', 'direcao', 'connect_secretaria', 'connect_aqv');
$$;

create or replace function hub.is_grid_manager()
returns boolean
language sql
stable
as $$
  select hub.is_active_user()
     and hub.current_user_role() in ('admin', 'direcao', 'gerente_manutencao', 'grid_chefe');
$$;

create or replace function hub.can_access_connect()
returns boolean
language sql
stable
as $$
  select hub.is_active_user()
     and hub.current_user_role() in (
       'admin', 'direcao', 'secretaria', 'professor', 'empresa',
       'connect_professor', 'connect_secretaria', 'connect_aqv', 'connect_empresa'
     );
$$;

create or replace function hub.can_access_grid()
returns boolean
language sql
stable
as $$
  select hub.is_active_user()
     and hub.current_user_role() in (
       'admin', 'direcao', 'professor', 'manutencao', 'gerente_manutencao',
       'grid_chefe', 'grid_funcionario'
     );
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

-- ============================================================================
-- FUNÇÕES DE SINCRONIZAÇÃO E SEGURANÇA
-- ============================================================================

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
       set ativo = false,
           atualizado_em = now(),
           updated_at = now()
     where usuario_id = new.id;
    return new;
  end if;

  case new.tipo_usuario
    when 'admin' then v_codigos := array['senai_hub', 'senai_connect', 'senai_grid'];
    when 'direcao' then v_codigos := array['senai_hub', 'senai_connect', 'senai_grid'];
    when 'secretaria' then v_codigos := array['senai_hub', 'senai_connect'];
    when 'professor' then v_codigos := array['senai_hub', 'senai_connect', 'senai_grid'];
    when 'empresa' then v_codigos := array['senai_hub', 'senai_connect'];
    when 'manutencao' then v_codigos := array['senai_hub', 'senai_grid'];
    when 'gerente_manutencao' then v_codigos := array['senai_hub', 'senai_grid'];
    when 'connect_professor' then v_codigos := array['senai_hub', 'senai_connect'];
    when 'connect_secretaria' then v_codigos := array['senai_hub', 'senai_connect'];
    when 'connect_aqv' then v_codigos := array['senai_hub', 'senai_connect'];
    when 'connect_empresa' then v_codigos := array['senai_hub', 'senai_connect'];
    when 'connect_aluno' then v_codigos := array['senai_hub'];
    when 'grid_chefe' then v_codigos := array['senai_hub', 'senai_grid'];
    when 'grid_funcionario' then v_codigos := array['senai_hub', 'senai_grid'];
    else v_codigos := array['senai_hub'];
  end case;

  insert into hub.usuario_aplicacoes (usuario_id, aplicacao_id, perfil, ativo)
  select new.id, a.id, new.tipo_usuario::text, true
  from hub.aplicacoes a
  where a.codigo = any(v_codigos)
  on conflict (usuario_id, aplicacao_id) do update
    set perfil = excluded.perfil,
        ativo = true,
        atualizado_em = now(),
        updated_at = now();

  update hub.usuario_aplicacoes ua
     set ativo = false,
         atualizado_em = now(),
         updated_at = now()
   where ua.usuario_id = new.id
     and ua.aplicacao_id not in (
       select a.id from hub.aplicacoes a where a.codigo = any(v_codigos)
     );

  return new;
end;
$$;

create or replace function hub.protect_usuario_privileges()
returns trigger
language plpgsql
security definer
set search_path = hub, public
as $$
begin
  -- Usuário comum pode atualizar dados básicos via app, mas não pode se promover
  -- nem desbloquear a própria conta. Service role e gestores podem alterar tudo.
  if auth.uid() is not null
     and old.id = auth.uid()
     and not hub.can_manage_users() then
    new.tipo_usuario := old.tipo_usuario;
    new.status := old.status;
    new.email := old.email;
    new.empresa_id := old.empresa_id;
    new.custom_permissions := old.custom_permissions;
  end if;

  return new;
end;
$$;

create or replace function hub.sync_usuario_from_auth()
returns trigger
language plpgsql
security definer
set search_path = hub, public, auth
as $$
declare
  v_tipo_text text;
  v_status_text text;
  v_tipo hub.tipo_usuario;
  v_status hub.status_usuario;
  v_nome text;
  v_email public.citext;
begin
  v_tipo_text := coalesce(new.raw_user_meta_data ->> 'tipo_usuario', new.raw_user_meta_data ->> 'tipo', new.raw_user_meta_data ->> 'role');
  v_status_text := coalesce(new.raw_user_meta_data ->> 'status', 'ativo');
  v_tipo := hub.coerce_tipo_usuario(v_tipo_text, 'aluno');
  v_status := hub.coerce_status_usuario(v_status_text, 'ativo');
  v_email := new.email::public.citext;
  v_nome := coalesce(
    nullif(new.raw_user_meta_data ->> 'nome', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    split_part(coalesce(new.email, 'usuario@senai.local'), '@', 1)
  );

  insert into hub.usuarios (
    id, nome, email, email_institucional, tipo_usuario, status,
    telefone, cpf, company_name, avatar_url, foto_url, metadata, email_verified_at
  )
  values (
    new.id,
    v_nome,
    v_email,
    coalesce(nullif(new.raw_user_meta_data ->> 'email_institucional', '')::public.citext, v_email),
    v_tipo,
    v_status,
    nullif(new.raw_user_meta_data ->> 'telefone', ''),
    nullif(new.raw_user_meta_data ->> 'cpf', ''),
    nullif(new.raw_user_meta_data ->> 'company_name', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    nullif(new.raw_user_meta_data ->> 'foto_url', ''),
    coalesce(new.raw_user_meta_data, '{}'::jsonb),
    case when new.email_confirmed_at is not null then new.email_confirmed_at else null end
  )
  on conflict (id) do update
    set nome = coalesce(excluded.nome, hub.usuarios.nome),
        email = excluded.email,
        email_institucional = coalesce(excluded.email_institucional, hub.usuarios.email_institucional),
        tipo_usuario = coalesce(v_tipo, hub.usuarios.tipo_usuario),
        status = coalesce(v_status, hub.usuarios.status),
        telefone = coalesce(excluded.telefone, hub.usuarios.telefone),
        cpf = coalesce(excluded.cpf, hub.usuarios.cpf),
        company_name = coalesce(excluded.company_name, hub.usuarios.company_name),
        avatar_url = coalesce(excluded.avatar_url, hub.usuarios.avatar_url),
        foto_url = coalesce(excluded.foto_url, hub.usuarios.foto_url),
        metadata = coalesce(excluded.metadata, hub.usuarios.metadata),
        email_verified_at = coalesce(excluded.email_verified_at, hub.usuarios.email_verified_at),
        atualizado_em = now(),
        updated_at = now();

  return new;
end;
$$;

create or replace function connect.sync_connect_columns()
returns trigger
language plpgsql
as $$
begin
  if tg_table_name = 'cursos' then
    if new.nome is null then new.nome := new.name; end if;
    if new.name is null then new.name := new.nome; end if;
    if new.descricao is null then new.descricao := new.description; end if;
    if new.description is null then new.description := new.descricao; end if;
    if new.codigo is null then new.codigo := new.code; end if;
    if new.code is null then new.code := new.codigo; end if;
    if new.carga_horaria is null then new.carga_horaria := new.workload_hours; end if;
    if new.workload_hours is null then new.workload_hours := coalesce(new.carga_horaria, 0); end if;
  elsif tg_table_name = 'professores' then
    if new.nome is null then new.nome := new.full_name; end if;
    if new.full_name is null then new.full_name := new.nome; end if;
    if new.telefone is null then new.telefone := new.phone; end if;
    if new.phone is null then new.phone := coalesce(new.telefone, new.celular); end if;
    if new.especialidade is null then new.especialidade := new.specialty; end if;
    if new.specialty is null then new.specialty := new.especialidade; end if;
  elsif tg_table_name = 'turmas' then
    if new.nome is null then new.nome := new.name; end if;
    if new.name is null then new.name := new.nome; end if;
    if new.codigo is null then new.codigo := new.code; end if;
    if new.code is null then new.code := new.codigo; end if;
  elsif tg_table_name = 'alunos' then
    if new.nome is null then new.nome := new.full_name; end if;
    if new.full_name is null then new.full_name := new.nome; end if;
    if new.rm is null then new.rm := coalesce(new.matricula, new.registration_number); end if;
    if new.matricula is null then new.matricula := new.rm; end if;
    if new.registration_number is null then new.registration_number := new.rm; end if;
    if new.telefone is null then new.telefone := new.phone; end if;
    if new.phone is null then new.phone := new.telefone; end if;
    if new.data_nascimento is null then new.data_nascimento := new.birth_date; end if;
    if new.birth_date is null then new.birth_date := new.data_nascimento; end if;
    if new.email_institucional is null then new.email_institucional := new.email; end if;
  elsif tg_table_name = 'empresas' then
    if new.company_name is null then new.company_name := new.nome; end if;
    if new.nome is null then new.nome := new.company_name; end if;
  end if;

  return new;
end;
$$;

create or replace function connect.sync_aula_frequencia_salario()
returns trigger
language plpgsql
as $$
begin
  if tg_table_name = 'aulas' then
    if tg_op = 'INSERT' then
      if new.lessons_count is null then new.lessons_count := coalesce(new.quantidade_aulas, 4); end if;
      if new.quantidade_aulas is null then new.quantidade_aulas := coalesce(new.lessons_count, 1); end if;
    else
      if new.quantidade_aulas is distinct from old.quantidade_aulas then
        new.lessons_count := new.quantidade_aulas;
      elsif new.lessons_count is distinct from old.lessons_count then
        new.quantidade_aulas := new.lessons_count;
      end if;
    end if;
  elsif tg_table_name = 'frequencias' then
    if tg_op = 'INSERT' then
      new.quantidade_aulas_faltadas := greatest(coalesce(new.quantidade_aulas_faltadas, 0), coalesce(new.missed_lessons, 0));
      new.missed_lessons := new.quantidade_aulas_faltadas;
      if new.observacao is null then new.observacao := new.notes; end if;
      if new.notes is null then new.notes := new.observacao; end if;
    else
      if new.quantidade_aulas_faltadas is distinct from old.quantidade_aulas_faltadas then
        new.missed_lessons := new.quantidade_aulas_faltadas;
      elsif new.missed_lessons is distinct from old.missed_lessons then
        new.quantidade_aulas_faltadas := new.missed_lessons;
      end if;
      if new.observacao is distinct from old.observacao then
        new.notes := new.observacao;
      elsif new.notes is distinct from old.notes then
        new.observacao := new.notes;
      end if;
    end if;
  elsif tg_table_name = 'contratos_alunos' then
    if new.company_name is null then new.company_name := new.empresa_nome; end if;
    if new.empresa_nome is null then new.empresa_nome := new.company_name; end if;
    if new.company_email is null then new.company_email := new.email_empresa; end if;
    if new.email_empresa is null then new.email_empresa := new.company_email; end if;
    if new.data_fim is null then new.data_fim := new.data_termino; end if;
    if new.data_termino is null then new.data_termino := new.data_fim; end if;
  elsif tg_table_name = 'salarios_alunos' then
    if new.reference_month is null and new.mes_referencia is not null then
      begin
        new.reference_month := to_date(new.mes_referencia || '-01', 'YYYY-MM-DD');
      exception when others then
        new.reference_month := null;
      end;
    end if;
    if new.mes_referencia is null and new.reference_month is not null then
      new.mes_referencia := to_char(new.reference_month, 'YYYY-MM');
    end if;
    if tg_op = 'INSERT' then
      new.salario_base := greatest(coalesce(new.salario_base, 0), coalesce(new.base_amount, 0));
      new.base_amount := new.salario_base;
      new.outros_descontos := greatest(coalesce(new.outros_descontos, 0), coalesce(new.deductions, 0), coalesce(new.desconto, 0));
      new.deductions := new.outros_descontos;
      new.desconto := new.outros_descontos;
      if new.salario_final is null then new.salario_final := new.net_amount; end if;
      if new.net_amount is null then new.net_amount := coalesce(new.salario_final, 0); end if;
      if new.calculated_at is null then new.calculated_at := new.calculado_em; end if;
      if new.calculado_em is null then new.calculado_em := new.calculated_at; end if;
    else
      if new.salario_base is distinct from old.salario_base then
        new.base_amount := new.salario_base;
      elsif new.base_amount is distinct from old.base_amount then
        new.salario_base := new.base_amount;
      end if;
      if new.outros_descontos is distinct from old.outros_descontos then
        new.deductions := new.outros_descontos;
        new.desconto := new.outros_descontos;
      elsif new.deductions is distinct from old.deductions then
        new.outros_descontos := new.deductions;
        new.desconto := new.deductions;
      elsif new.desconto is distinct from old.desconto then
        new.outros_descontos := new.desconto;
        new.deductions := new.desconto;
      end if;
      if new.salario_final is distinct from old.salario_final then
        new.net_amount := coalesce(new.salario_final, 0);
      elsif new.net_amount is distinct from old.net_amount then
        new.salario_final := new.net_amount;
      end if;
    end if;
  elsif tg_table_name = 'localizacoes_alunos' then
    if new.last_seen_at is null then new.last_seen_at := new.data_hora; end if;
    if new.data_hora is null then new.data_hora := new.last_seen_at; end if;
  end if;

  return new;
end;
$$;

create or replace function grid.generate_chamado_codigo()
returns text
language sql
volatile
as $$
  select hub.generate_code('CH');
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

  if new.data_abertura is null then
    new.data_abertura := coalesce(new.criado_em, now());
  end if;

  if new.status in ('concluido', 'concluida') and new.concluido_em is null then
    new.concluido_em := now();
  end if;

  if new.status in ('concluido', 'concluida') and new.data_fechamento is null then
    new.data_fechamento := coalesce(new.concluido_em, now());
  end if;

  return new;
end;
$$;

create or replace function grid.sync_tarefa_columns()
returns trigger
language plpgsql
as $$
begin
  if new.coluna is null then
    new.coluna := new.status::text;
  end if;

  if new.status in ('concluido', 'concluida') and new.concluido_em is null then
    new.concluido_em := now();
  end if;

  return new;
end;
$$;

create or replace function hub.audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = hub, public
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_record_id text;
begin
  if tg_op = 'INSERT' then
    v_new := to_jsonb(new);
    v_record_id := coalesce(v_new ->> 'id', v_new ->> 'usuario_id');
    insert into hub.audit_logs (usuario_id, schema_name, table_name, record_id, action, new_data)
    values (auth.uid(), tg_table_schema, tg_table_name, v_record_id, 'INSERT', v_new);
    return new;
  elsif tg_op = 'UPDATE' then
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
    v_record_id := coalesce(v_new ->> 'id', v_old ->> 'id', v_new ->> 'usuario_id', v_old ->> 'usuario_id');
    insert into hub.audit_logs (usuario_id, schema_name, table_name, record_id, action, old_data, new_data)
    values (auth.uid(), tg_table_schema, tg_table_name, v_record_id, 'UPDATE', v_old, v_new);
    return new;
  elsif tg_op = 'DELETE' then
    v_old := to_jsonb(old);
    v_record_id := coalesce(v_old ->> 'id', v_old ->> 'usuario_id');
    insert into hub.audit_logs (usuario_id, schema_name, table_name, record_id, action, old_data)
    values (auth.uid(), tg_table_schema, tg_table_name, v_record_id, 'DELETE', v_old);
    return old;
  end if;

  return null;
end;
$$;

-- ============================================================================
-- SEEDS BÁSICOS
-- ============================================================================

insert into hub.aplicacoes (codigo, slug, nome, name, descricao, description, route_path, icon, sort_order, ativo, is_active)
values
  ('senai_hub', 'senai-hub', 'SENAI Hub', 'SENAI Hub', 'Portal central para acessar os módulos SENAI.', 'Central portal for SENAI modules.', '/hub', 'home', 0, true, true),
  ('senai_connect', 'senai-connect', 'SENAI Connect', 'SENAI Connect', 'Gestão educacional, frequência, contratos e salários.', 'Academic management, attendance, contracts and salaries.', '/connect', 'school', 1, true, true),
  ('senai_grid', 'senai-grid', 'SENAI Grid', 'SENAI Grid', 'Gestão de manutenção, chamados, tarefas e estoque.', 'Maintenance, tickets, tasks and inventory.', '/grid', 'grid', 2, true, true)
on conflict (codigo) do update
set slug = excluded.slug,
    nome = excluded.nome,
    name = excluded.name,
    descricao = excluded.descricao,
    description = excluded.description,
    route_path = excluded.route_path,
    icon = excluded.icon,
    sort_order = excluded.sort_order,
    ativo = excluded.ativo,
    is_active = excluded.is_active,
    atualizado_em = now(),
    updated_at = now();

insert into hub.blocos (id, nome, descricao, latitude, longitude)
values
  ('10000000-0000-0000-0000-000000000001', 'A', 'Administração e recepção', -22.5648, -47.4014),
  ('10000000-0000-0000-0000-000000000002', 'B', 'Laboratórios', -22.5649, -47.4012),
  ('10000000-0000-0000-0000-000000000003', 'C', 'Oficinas', -22.5650, -47.4015),
  ('10000000-0000-0000-0000-000000000004', 'D', 'Salas de aula', -22.5647, -47.4011),
  ('10000000-0000-0000-0000-000000000005', 'E', 'Apoio e almoxarifado', -22.5651, -47.4013)
on conflict (nome) do update
set descricao = excluded.descricao,
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    atualizado_em = now(),
    updated_at = now();

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
    andar = excluded.andar,
    atualizado_em = now(),
    updated_at = now();

insert into grid.categorias_manutencao (id, nome, descricao, ativo, status)
values
  ('30000000-0000-0000-0000-000000000001', 'Elétrico', 'Serviços elétricos e iluminação.', true, 'ativo'),
  ('30000000-0000-0000-0000-000000000002', 'Hidráulico', 'Vazamentos, registros e tubulações.', true, 'ativo'),
  ('30000000-0000-0000-0000-000000000003', 'Equipamentos', 'Equipamentos de laboratório e informática.', true, 'ativo')
on conflict (nome) do update
set descricao = excluded.descricao,
    ativo = excluded.ativo,
    status = excluded.status,
    updated_at = now();

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Atualização automática de datas.
drop trigger if exists usuarios_protect_privileges on hub.usuarios;
create trigger usuarios_protect_privileges
before update on hub.usuarios
for each row execute function hub.protect_usuario_privileges();

drop trigger if exists usuarios_updated_at on hub.usuarios;
create trigger usuarios_updated_at
before update on hub.usuarios
for each row execute function hub.set_updated_at();

drop trigger if exists credenciais_legadas_updated_at on hub.credenciais_legadas;
create trigger credenciais_legadas_updated_at
before update on hub.credenciais_legadas
for each row execute function hub.set_updated_at();

drop trigger if exists aplicacoes_updated_at on hub.aplicacoes;
create trigger aplicacoes_updated_at
before update on hub.aplicacoes
for each row execute function hub.set_updated_at();

drop trigger if exists usuario_aplicacoes_updated_at on hub.usuario_aplicacoes;
create trigger usuario_aplicacoes_updated_at
before update on hub.usuario_aplicacoes
for each row execute function hub.set_updated_at();

drop trigger if exists blocos_updated_at on hub.blocos;
create trigger blocos_updated_at
before update on hub.blocos
for each row execute function hub.set_updated_at();

drop trigger if exists salas_updated_at on hub.salas;
create trigger salas_updated_at
before update on hub.salas
for each row execute function hub.set_updated_at();

drop trigger if exists pessoas_updated_at on hub.pessoas;
create trigger pessoas_updated_at
before update on hub.pessoas
for each row execute function hub.set_updated_at();

drop trigger if exists report_presets_updated_at on hub.report_presets;
create trigger report_presets_updated_at
before update on hub.report_presets
for each row execute function hub.set_updated_at();

drop trigger if exists spreadsheet_import_logs_updated_at on hub.spreadsheet_import_logs;
create trigger spreadsheet_import_logs_updated_at
before update on hub.spreadsheet_import_logs
for each row execute function hub.set_updated_at();

drop trigger if exists cursos_sync_columns on connect.cursos;
create trigger cursos_sync_columns
before insert or update on connect.cursos
for each row execute function connect.sync_connect_columns();

drop trigger if exists professores_sync_columns on connect.professores;
create trigger professores_sync_columns
before insert or update on connect.professores
for each row execute function connect.sync_connect_columns();

drop trigger if exists turmas_sync_columns on connect.turmas;
create trigger turmas_sync_columns
before insert or update on connect.turmas
for each row execute function connect.sync_connect_columns();

drop trigger if exists alunos_sync_columns on connect.alunos;
create trigger alunos_sync_columns
before insert or update on connect.alunos
for each row execute function connect.sync_connect_columns();

drop trigger if exists empresas_sync_columns on connect.empresas;
create trigger empresas_sync_columns
before insert or update on connect.empresas
for each row execute function connect.sync_connect_columns();

drop trigger if exists aulas_sync_columns on connect.aulas;
create trigger aulas_sync_columns
before insert or update on connect.aulas
for each row execute function connect.sync_aula_frequencia_salario();

drop trigger if exists frequencias_sync_columns on connect.frequencias;
create trigger frequencias_sync_columns
before insert or update on connect.frequencias
for each row execute function connect.sync_aula_frequencia_salario();

drop trigger if exists contratos_sync_columns on connect.contratos_alunos;
create trigger contratos_sync_columns
before insert or update on connect.contratos_alunos
for each row execute function connect.sync_aula_frequencia_salario();

drop trigger if exists salarios_sync_columns on connect.salarios_alunos;
create trigger salarios_sync_columns
before insert or update on connect.salarios_alunos
for each row execute function connect.sync_aula_frequencia_salario();

drop trigger if exists localizacoes_sync_columns on connect.localizacoes_alunos;
create trigger localizacoes_sync_columns
before insert or update on connect.localizacoes_alunos
for each row execute function connect.sync_aula_frequencia_salario();

-- Updated_at nas tabelas principais Connect.
drop trigger if exists cursos_updated_at on connect.cursos;
create trigger cursos_updated_at before update on connect.cursos for each row execute function hub.set_updated_at();
drop trigger if exists professores_updated_at on connect.professores;
create trigger professores_updated_at before update on connect.professores for each row execute function hub.set_updated_at();
drop trigger if exists turmas_updated_at on connect.turmas;
create trigger turmas_updated_at before update on connect.turmas for each row execute function hub.set_updated_at();
drop trigger if exists alunos_updated_at on connect.alunos;
create trigger alunos_updated_at before update on connect.alunos for each row execute function hub.set_updated_at();
drop trigger if exists turma_alunos_updated_at on connect.turma_alunos;
create trigger turma_alunos_updated_at before update on connect.turma_alunos for each row execute function hub.set_updated_at();
drop trigger if exists professor_turmas_updated_at on connect.professor_turmas;
create trigger professor_turmas_updated_at before update on connect.professor_turmas for each row execute function hub.set_updated_at();
drop trigger if exists curso_pessoas_updated_at on connect.curso_pessoas;
create trigger curso_pessoas_updated_at before update on connect.curso_pessoas for each row execute function hub.set_updated_at();
drop trigger if exists turma_pessoas_updated_at on connect.turma_pessoas;
create trigger turma_pessoas_updated_at before update on connect.turma_pessoas for each row execute function hub.set_updated_at();
drop trigger if exists empresas_updated_at on connect.empresas;
create trigger empresas_updated_at before update on connect.empresas for each row execute function hub.set_updated_at();
drop trigger if exists aulas_updated_at on connect.aulas;
create trigger aulas_updated_at before update on connect.aulas for each row execute function hub.set_updated_at();
drop trigger if exists frequencias_updated_at on connect.frequencias;
create trigger frequencias_updated_at before update on connect.frequencias for each row execute function hub.set_updated_at();
drop trigger if exists contratos_updated_at on connect.contratos_alunos;
create trigger contratos_updated_at before update on connect.contratos_alunos for each row execute function hub.set_updated_at();
drop trigger if exists salarios_updated_at on connect.salarios_alunos;
create trigger salarios_updated_at before update on connect.salarios_alunos for each row execute function hub.set_updated_at();
drop trigger if exists calculos_salario_updated_at on connect.calculos_salario;
create trigger calculos_salario_updated_at before update on connect.calculos_salario for each row execute function hub.set_updated_at();
drop trigger if exists localizacoes_updated_at on connect.localizacoes_alunos;
create trigger localizacoes_updated_at before update on connect.localizacoes_alunos for each row execute function hub.set_updated_at();
drop trigger if exists atividades_updated_at on connect.atividades;
create trigger atividades_updated_at before update on connect.atividades for each row execute function hub.set_updated_at();
drop trigger if exists alertas_updated_at on connect.alertas;
create trigger alertas_updated_at before update on connect.alertas for each row execute function hub.set_updated_at();
drop trigger if exists metricas_dashboard_updated_at on connect.metricas_dashboard;
create trigger metricas_dashboard_updated_at before update on connect.metricas_dashboard for each row execute function hub.set_updated_at();

-- Grid sync/updated_at.
drop trigger if exists chamados_sync_columns on grid.chamados;
create trigger chamados_sync_columns
before insert or update on grid.chamados
for each row execute function grid.sync_chamado_columns();

drop trigger if exists tarefas_sync_columns on grid.tarefas;
create trigger tarefas_sync_columns
before insert or update on grid.tarefas
for each row execute function grid.sync_tarefa_columns();

drop trigger if exists fornecedores_updated_at on grid.fornecedores;
create trigger fornecedores_updated_at before update on grid.fornecedores for each row execute function hub.set_updated_at();
drop trigger if exists categorias_updated_at on grid.categorias_manutencao;
create trigger categorias_updated_at before update on grid.categorias_manutencao for each row execute function hub.set_updated_at();
drop trigger if exists itens_estoque_updated_at on grid.itens_estoque;
create trigger itens_estoque_updated_at before update on grid.itens_estoque for each row execute function hub.set_updated_at();
drop trigger if exists chamados_updated_at on grid.chamados;
create trigger chamados_updated_at before update on grid.chamados for each row execute function hub.set_updated_at();
drop trigger if exists tarefas_updated_at on grid.tarefas;
create trigger tarefas_updated_at before update on grid.tarefas for each row execute function hub.set_updated_at();
drop trigger if exists reservas_estoque_updated_at on grid.reservas_estoque;
create trigger reservas_estoque_updated_at before update on grid.reservas_estoque for each row execute function hub.set_updated_at();

-- Auth -> perfil do Hub.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function hub.sync_usuario_from_auth();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update of email, raw_user_meta_data, email_confirmed_at on auth.users
for each row execute function hub.sync_usuario_from_auth();

-- Usuário -> aplicações.
drop trigger if exists sync_usuario_aplicacoes on hub.usuarios;
create trigger sync_usuario_aplicacoes
after insert or update of tipo_usuario, status on hub.usuarios
for each row execute function hub.sync_usuario_aplicacoes();

-- Auditoria em tabelas sensíveis/principais.
do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('hub', 'usuarios'),
      ('hub', 'credenciais_legadas'),
      ('hub', 'usuario_aplicacoes'),
      ('connect', 'cursos'),
      ('connect', 'professores'),
      ('connect', 'turmas'),
      ('connect', 'alunos'),
      ('connect', 'frequencias'),
      ('connect', 'contratos_alunos'),
      ('grid', 'itens_estoque'),
      ('grid', 'chamados'),
      ('grid', 'tarefas'),
      ('grid', 'movimentacoes_estoque')
    ) as t(schema_name, table_name)
  loop
    execute format('drop trigger if exists audit_%I_%I on %I.%I', r.schema_name, r.table_name, r.schema_name, r.table_name);
    execute format(
      'create trigger audit_%I_%I after insert or update or delete on %I.%I for each row execute function hub.audit_trigger()',
      r.schema_name, r.table_name, r.schema_name, r.table_name
    );
  end loop;
end $$;

-- ============================================================================
-- ÍNDICES
-- ============================================================================

create index if not exists usuarios_tipo_status_idx on hub.usuarios (tipo_usuario, status);
create index if not exists usuarios_email_institucional_idx on hub.usuarios (email_institucional);
create index if not exists usuario_aplicacoes_usuario_idx on hub.usuario_aplicacoes (usuario_id, ativo);
create index if not exists arquivos_relacionamento_idx on hub.arquivos (relacionamento_tipo, relacionamento_id);
create index if not exists notificacoes_usuario_lida_idx on hub.notificacoes (usuario_id, lida, created_at desc);
create index if not exists logs_acesso_usuario_idx on hub.logs_acesso (usuario_id, criado_em desc);
create index if not exists audit_logs_tabela_idx on hub.audit_logs (schema_name, table_name, created_at desc);
create index if not exists security_events_usuario_idx on hub.security_events (usuario_id, created_at desc);
create index if not exists salas_bloco_idx on hub.salas (bloco_id);
create index if not exists pessoas_kind_status_idx on hub.pessoas (kind, status);
create index if not exists pessoas_full_name_idx on hub.pessoas (full_name);
create index if not exists report_presets_usuario_modulo_idx on hub.report_presets (usuario_id, modulo);
create index if not exists import_logs_modulo_created_idx on hub.spreadsheet_import_logs (modulo, created_at desc);

create index if not exists cursos_status_idx on connect.cursos (status);
create index if not exists professores_usuario_idx on connect.professores (usuario_id);
create index if not exists alunos_turma_idx on connect.alunos (turma_id, status);
create index if not exists alunos_curso_idx on connect.alunos (curso_id);
create index if not exists alunos_nome_idx on connect.alunos (nome);
create index if not exists turmas_curso_idx on connect.turmas (curso_id);
create index if not exists turma_alunos_aluno_idx on connect.turma_alunos (aluno_id, ativo);
create index if not exists professor_turmas_turma_idx on connect.professor_turmas (turma_id, ativo);
create index if not exists aulas_turma_data_idx on connect.aulas (turma_id, data_aula desc);
create index if not exists frequencias_aluno_idx on connect.frequencias (aluno_id, criado_em desc);
create index if not exists frequencias_status_idx on connect.frequencias (status);
create index if not exists contratos_aluno_status_idx on connect.contratos_alunos (aluno_id, status);
create index if not exists salarios_aluno_mes_idx on connect.salarios_alunos (aluno_id, mes_referencia);
create index if not exists localizacoes_dentro_idx on connect.localizacoes_alunos (dentro_do_senai, atualizado_em desc);
create index if not exists atividades_occurred_idx on connect.atividades (occurred_at desc);
create index if not exists alertas_lido_idx on connect.alertas (lido, created_at desc);

create index if not exists chamados_status_prioridade_idx on grid.chamados (status, prioridade, criado_em desc);
create index if not exists chamados_responsavel_idx on grid.chamados (responsavel_id, status);
create index if not exists chamados_solicitante_idx on grid.chamados (solicitante_id, status);
create index if not exists chamados_titulo_idx on grid.chamados (titulo);
create index if not exists tarefas_responsavel_status_idx on grid.tarefas (responsavel_id, status);
create index if not exists tarefas_chamado_idx on grid.tarefas (chamado_id);
create index if not exists estoque_status_idx on grid.itens_estoque (status, quantidade_disponivel);
create index if not exists estoque_sku_idx on grid.itens_estoque (sku);
create index if not exists movimentacoes_item_idx on grid.movimentacoes_estoque (item_id, criado_em desc);
create index if not exists reservas_item_status_idx on grid.reservas_estoque (item_id, status);
create index if not exists anexos_chamado_idx on grid.anexos_chamado (chamado_id, criado_em desc);

create index if not exists sessions_user_id_idx on public.sessions (user_id);
create index if not exists sessions_last_activity_idx on public.sessions (last_activity);
create index if not exists personal_access_tokens_expires_idx on public.personal_access_tokens (expires_at);
create index if not exists cache_expiration_idx on public.cache (expiration);
create index if not exists cache_locks_expiration_idx on public.cache_locks (expiration);
create index if not exists jobs_queue_idx on public.jobs (queue);
create index if not exists failed_jobs_connection_queue_failed_at_idx on public.failed_jobs (connection, queue, failed_at);

-- ============================================================================
-- GRANTS
-- ============================================================================

grant usage on schema hub, connect, grid to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema hub to authenticated, service_role;
grant select, insert, update, delete on all tables in schema connect to authenticated, service_role;
grant select, insert, update, delete on all tables in schema grid to authenticated, service_role;
grant select on all tables in schema hub to anon;
grant select on all tables in schema connect to anon;
grant select on all tables in schema grid to anon;
grant usage, select on all sequences in schema hub to authenticated, service_role;
grant usage, select on all sequences in schema connect to authenticated, service_role;
grant usage, select on all sequences in schema grid to authenticated, service_role;
grant execute on all routines in schema hub to anon, authenticated, service_role;
grant execute on all routines in schema connect to anon, authenticated, service_role;
grant execute on all routines in schema grid to anon, authenticated, service_role;

-- Tabelas técnicas Laravel: apenas backend/service_role deve usar.
revoke all on table public.password_reset_tokens, public.sessions, public.personal_access_tokens, public.cache, public.cache_locks, public.jobs, public.job_batches, public.failed_jobs from anon, authenticated;
grant select, insert, update, delete on table public.password_reset_tokens, public.sessions, public.personal_access_tokens, public.cache, public.cache_locks, public.jobs, public.job_batches, public.failed_jobs to service_role;
grant usage, select on sequence public.personal_access_tokens_id_seq, public.jobs_id_seq, public.failed_jobs_id_seq to service_role;

alter default privileges for role postgres in schema hub grant select, insert, update, delete on tables to authenticated, service_role;
alter default privileges for role postgres in schema connect grant select, insert, update, delete on tables to authenticated, service_role;
alter default privileges for role postgres in schema grid grant select, insert, update, delete on tables to authenticated, service_role;
alter default privileges for role postgres in schema hub grant execute on routines to anon, authenticated, service_role;
alter default privileges for role postgres in schema connect grant execute on routines to anon, authenticated, service_role;
alter default privileges for role postgres in schema grid grant execute on routines to anon, authenticated, service_role;

-- ============================================================================
-- RLS
-- ============================================================================

alter table hub.usuarios enable row level security;
alter table hub.credenciais_legadas enable row level security;
alter table hub.aplicacoes enable row level security;
alter table hub.usuario_aplicacoes enable row level security;
alter table hub.arquivos enable row level security;
alter table hub.notificacoes enable row level security;
alter table hub.logs_acesso enable row level security;
alter table hub.audit_logs enable row level security;
alter table hub.security_events enable row level security;
alter table hub.sessoes_dispositivos enable row level security;
alter table hub.blocos enable row level security;
alter table hub.salas enable row level security;
alter table hub.pessoas enable row level security;
alter table hub.report_presets enable row level security;
alter table hub.spreadsheet_import_logs enable row level security;

alter table connect.cursos enable row level security;
alter table connect.professores enable row level security;
alter table connect.turmas enable row level security;
alter table connect.alunos enable row level security;
alter table connect.turma_alunos enable row level security;
alter table connect.professor_turmas enable row level security;
alter table connect.curso_pessoas enable row level security;
alter table connect.turma_pessoas enable row level security;
alter table connect.empresas enable row level security;
alter table connect.aulas enable row level security;
alter table connect.frequencias enable row level security;
alter table connect.contratos_alunos enable row level security;
alter table connect.salarios_alunos enable row level security;
alter table connect.calculos_salario enable row level security;
alter table connect.localizacoes_alunos enable row level security;
alter table connect.atividades enable row level security;
alter table connect.alertas enable row level security;
alter table connect.metricas_dashboard enable row level security;

alter table grid.categorias_manutencao enable row level security;
alter table grid.fornecedores enable row level security;
alter table grid.itens_estoque enable row level security;
alter table grid.chamados enable row level security;
alter table grid.tarefas enable row level security;
alter table grid.movimentacoes_estoque enable row level security;
alter table grid.chamado_itens enable row level security;
alter table grid.reservas_estoque enable row level security;
alter table grid.anexos_chamado enable row level security;
alter table grid.relatorios enable row level security;

-- HUB POLICIES

drop policy if exists usuarios_select on hub.usuarios;
create policy usuarios_select on hub.usuarios
for select
using (id = auth.uid() or hub.can_manage_users() or hub.is_grid_manager());

drop policy if exists usuarios_insert_admin on hub.usuarios;
create policy usuarios_insert_admin on hub.usuarios
for insert
with check (hub.can_manage_users());

drop policy if exists usuarios_update_admin_or_own on hub.usuarios;
create policy usuarios_update_admin_or_own on hub.usuarios
for update
using (id = auth.uid() or hub.can_manage_users())
with check (id = auth.uid() or hub.can_manage_users());

drop policy if exists usuarios_delete_admin on hub.usuarios;
create policy usuarios_delete_admin on hub.usuarios
for delete
using (hub.can_manage_users());

drop policy if exists credenciais_admin_only on hub.credenciais_legadas;
create policy credenciais_admin_only on hub.credenciais_legadas
for all
using (hub.can_manage_users())
with check (hub.can_manage_users());

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

drop policy if exists arquivos_select_policy on hub.arquivos;
create policy arquivos_select_policy on hub.arquivos
for select
using (
  usuario_id = auth.uid()
  or enviado_por = auth.uid()
  or hub.is_connect_admin()
  or hub.is_grid_manager()
  or relacionamento_tipo in ('chamado', 'evidencia_conclusao') and hub.can_access_grid()
);

drop policy if exists arquivos_insert_policy on hub.arquivos;
create policy arquivos_insert_policy on hub.arquivos
for insert
with check (auth.uid() is not null and (enviado_por = auth.uid() or usuario_id = auth.uid() or hub.is_staff()));

drop policy if exists arquivos_update_delete_policy on hub.arquivos;
create policy arquivos_update_delete_policy on hub.arquivos
for all
using (enviado_por = auth.uid() or hub.is_connect_admin() or hub.is_grid_manager())
with check (enviado_por = auth.uid() or hub.is_connect_admin() or hub.is_grid_manager());

drop policy if exists notificacoes_select_policy on hub.notificacoes;
create policy notificacoes_select_policy on hub.notificacoes
for select
using (usuario_id = auth.uid() or hub.can_manage_users());

drop policy if exists notificacoes_update_policy on hub.notificacoes;
create policy notificacoes_update_policy on hub.notificacoes
for update
using (usuario_id = auth.uid() or hub.can_manage_users())
with check (usuario_id = auth.uid() or hub.can_manage_users());

drop policy if exists notificacoes_insert_policy on hub.notificacoes;
create policy notificacoes_insert_policy on hub.notificacoes
for insert
with check (hub.is_staff() or usuario_id = auth.uid());

drop policy if exists logs_acesso_insert_policy on hub.logs_acesso;
create policy logs_acesso_insert_policy on hub.logs_acesso
for insert
with check (usuario_id = auth.uid() or hub.can_manage_users());

drop policy if exists logs_acesso_select_admin on hub.logs_acesso;
create policy logs_acesso_select_admin on hub.logs_acesso
for select
using (hub.can_manage_users() or hub.is_grid_manager());

drop policy if exists audit_logs_select_admin on hub.audit_logs;
create policy audit_logs_select_admin on hub.audit_logs
for select
using (hub.can_manage_users() or hub.is_grid_manager());

drop policy if exists security_events_policy on hub.security_events;
create policy security_events_policy on hub.security_events
for all
using (hub.can_manage_users())
with check (hub.can_manage_users() or usuario_id = auth.uid());

drop policy if exists sessoes_dispositivos_own on hub.sessoes_dispositivos;
create policy sessoes_dispositivos_own on hub.sessoes_dispositivos
for all
using (usuario_id = auth.uid() or hub.can_manage_users())
with check (usuario_id = auth.uid() or hub.can_manage_users());

drop policy if exists blocos_read on hub.blocos;
create policy blocos_read on hub.blocos
for select
using (auth.uid() is not null);

drop policy if exists blocos_manage on hub.blocos;
create policy blocos_manage on hub.blocos
for all
using (hub.can_manage_users() or hub.is_grid_manager())
with check (hub.can_manage_users() or hub.is_grid_manager());

drop policy if exists salas_read on hub.salas;
create policy salas_read on hub.salas
for select
using (auth.uid() is not null);

drop policy if exists salas_manage on hub.salas;
create policy salas_manage on hub.salas
for all
using (hub.can_manage_users() or hub.is_grid_manager())
with check (hub.can_manage_users() or hub.is_grid_manager());

drop policy if exists pessoas_select_policy on hub.pessoas;
create policy pessoas_select_policy on hub.pessoas
for select
using (usuario_id = auth.uid() or hub.can_manage_users() or hub.can_access_connect());

drop policy if exists pessoas_manage_policy on hub.pessoas;
create policy pessoas_manage_policy on hub.pessoas
for all
using (hub.is_connect_admin())
with check (hub.is_connect_admin());

drop policy if exists report_presets_policy on hub.report_presets;
create policy report_presets_policy on hub.report_presets
for all
using (usuario_id = auth.uid() or compartilhado or hub.can_manage_users())
with check (usuario_id = auth.uid() or hub.can_manage_users());

drop policy if exists spreadsheet_import_logs_policy on hub.spreadsheet_import_logs;
create policy spreadsheet_import_logs_policy on hub.spreadsheet_import_logs
for all
using (hub.is_connect_admin())
with check (hub.is_connect_admin());

-- CONNECT POLICIES

drop policy if exists cursos_read on connect.cursos;
create policy cursos_read on connect.cursos
for select
using (auth.uid() is not null);

drop policy if exists cursos_admin on connect.cursos;
create policy cursos_admin on connect.cursos
for all
using (hub.is_connect_admin())
with check (hub.is_connect_admin());

drop policy if exists professores_select_policy on connect.professores;
create policy professores_select_policy on connect.professores
for select
using (usuario_id = auth.uid() or hub.is_connect_admin() or hub.current_user_role() in ('professor', 'connect_professor'));

drop policy if exists professores_admin on connect.professores;
create policy professores_admin on connect.professores
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
    select 1 from connect.professor_turmas pt
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

drop policy if exists turmas_read_policy on connect.turmas;
create policy turmas_read_policy on connect.turmas
for select
using (
  hub.is_connect_admin()
  or id in (select ta.turma_id from connect.turma_alunos ta where ta.aluno_id = connect.current_aluno_id() and ta.ativo)
  or id in (select pt.turma_id from connect.professor_turmas pt where pt.professor_id = connect.current_professor_id() and pt.ativo)
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
  or turma_id in (select pt.turma_id from connect.professor_turmas pt where pt.professor_id = connect.current_professor_id() and pt.ativo)
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

drop policy if exists curso_pessoas_read_policy on connect.curso_pessoas;
create policy curso_pessoas_read_policy on connect.curso_pessoas
for select
using (hub.can_access_connect());

drop policy if exists curso_pessoas_admin on connect.curso_pessoas;
create policy curso_pessoas_admin on connect.curso_pessoas
for all
using (hub.is_connect_admin())
with check (hub.is_connect_admin());

drop policy if exists turma_pessoas_read_policy on connect.turma_pessoas;
create policy turma_pessoas_read_policy on connect.turma_pessoas
for select
using (hub.can_access_connect());

drop policy if exists turma_pessoas_admin on connect.turma_pessoas;
create policy turma_pessoas_admin on connect.turma_pessoas
for all
using (hub.is_connect_admin())
with check (hub.is_connect_admin());

drop policy if exists empresas_read_policy on connect.empresas;
create policy empresas_read_policy on connect.empresas
for select
using (hub.is_connect_admin() or hub.current_user_role() in ('professor', 'connect_professor', 'empresa', 'connect_empresa'));

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
  or turma_id in (select ta.turma_id from connect.turma_alunos ta where ta.aluno_id = connect.current_aluno_id() and ta.ativo)
  or turma_id in (select pt.turma_id from connect.professor_turmas pt where pt.professor_id = connect.current_professor_id() and pt.ativo)
);

drop policy if exists aulas_write_policy on connect.aulas;
create policy aulas_write_policy on connect.aulas
for all
using (
  hub.is_connect_admin()
  or turma_id in (select pt.turma_id from connect.professor_turmas pt where pt.professor_id = connect.current_professor_id() and pt.ativo)
)
with check (
  hub.is_connect_admin()
  or turma_id in (select pt.turma_id from connect.professor_turmas pt where pt.professor_id = connect.current_professor_id() and pt.ativo)
);

drop policy if exists frequencias_read_policy on connect.frequencias;
create policy frequencias_read_policy on connect.frequencias
for select
using (
  aluno_id = connect.current_aluno_id()
  or hub.is_connect_admin()
  or exists (
    select 1 from connect.aulas au
    join connect.professor_turmas pt on pt.turma_id = au.turma_id
    where au.id = frequencias.aula_id and pt.professor_id = connect.current_professor_id() and pt.ativo
  )
);

drop policy if exists frequencias_write_policy on connect.frequencias;
create policy frequencias_write_policy on connect.frequencias
for all
using (
  hub.is_connect_admin()
  or exists (
    select 1 from connect.aulas au
    join connect.professor_turmas pt on pt.turma_id = au.turma_id
    where au.id = frequencias.aula_id and pt.professor_id = connect.current_professor_id() and pt.ativo
  )
)
with check (
  hub.is_connect_admin()
  or exists (
    select 1 from connect.aulas au
    join connect.professor_turmas pt on pt.turma_id = au.turma_id
    where au.id = frequencias.aula_id and pt.professor_id = connect.current_professor_id() and pt.ativo
  )
);

drop policy if exists contratos_read_policy on connect.contratos_alunos;
create policy contratos_read_policy on connect.contratos_alunos
for select
using (hub.is_connect_admin() or aluno_id = connect.current_aluno_id());

drop policy if exists contratos_admin on connect.contratos_alunos;
create policy contratos_admin on connect.contratos_alunos
for all
using (hub.is_connect_admin())
with check (hub.is_connect_admin());

drop policy if exists salarios_read_policy on connect.salarios_alunos;
create policy salarios_read_policy on connect.salarios_alunos
for select
using (hub.is_connect_admin() or aluno_id = connect.current_aluno_id());

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
  or exists (select 1 from connect.salarios_alunos s where s.id = calculos_salario.salario_id and s.aluno_id = connect.current_aluno_id())
);

drop policy if exists calculos_admin on connect.calculos_salario;
create policy calculos_admin on connect.calculos_salario
for all
using (hub.is_connect_admin())
with check (hub.is_connect_admin());

drop policy if exists localizacoes_read_policy on connect.localizacoes_alunos;
create policy localizacoes_read_policy on connect.localizacoes_alunos
for select
using (
  aluno_id = connect.current_aluno_id()
  or hub.is_connect_admin()
  or exists (
    select 1 from connect.alunos a
    join connect.professor_turmas pt on pt.turma_id = a.turma_id
    where a.id = localizacoes_alunos.aluno_id and pt.professor_id = connect.current_professor_id() and pt.ativo
  )
);

drop policy if exists localizacoes_write_policy on connect.localizacoes_alunos;
create policy localizacoes_write_policy on connect.localizacoes_alunos
for all
using (aluno_id = connect.current_aluno_id() or hub.is_connect_admin())
with check (aluno_id = connect.current_aluno_id() or hub.is_connect_admin());

drop policy if exists atividades_read_policy on connect.atividades;
create policy atividades_read_policy on connect.atividades
for select
using (hub.can_access_connect());

drop policy if exists atividades_write_policy on connect.atividades;
create policy atividades_write_policy on connect.atividades
for all
using (hub.is_connect_admin())
with check (hub.is_connect_admin());

drop policy if exists alertas_read_policy on connect.alertas;
create policy alertas_read_policy on connect.alertas
for select
using (usuario_id = auth.uid() or usuario_id is null or hub.can_access_connect());

drop policy if exists alertas_write_policy on connect.alertas;
create policy alertas_write_policy on connect.alertas
for all
using (hub.is_connect_admin())
with check (hub.is_connect_admin());

drop policy if exists metricas_dashboard_read_policy on connect.metricas_dashboard;
create policy metricas_dashboard_read_policy on connect.metricas_dashboard
for select
using (hub.can_access_connect());

drop policy if exists metricas_dashboard_admin on connect.metricas_dashboard;
create policy metricas_dashboard_admin on connect.metricas_dashboard
for all
using (hub.is_connect_admin())
with check (hub.is_connect_admin());

-- GRID POLICIES

drop policy if exists categorias_grid_read on grid.categorias_manutencao;
create policy categorias_grid_read on grid.categorias_manutencao
for select
using (hub.can_access_grid());

drop policy if exists categorias_grid_manage on grid.categorias_manutencao;
create policy categorias_grid_manage on grid.categorias_manutencao
for all
using (hub.is_grid_manager())
with check (hub.is_grid_manager());

drop policy if exists fornecedores_grid_read on grid.fornecedores;
create policy fornecedores_grid_read on grid.fornecedores
for select
using (hub.can_access_grid());

drop policy if exists fornecedores_grid_manage on grid.fornecedores;
create policy fornecedores_grid_manage on grid.fornecedores
for all
using (hub.is_grid_manager())
with check (hub.is_grid_manager());

drop policy if exists estoque_read_grid on grid.itens_estoque;
create policy estoque_read_grid on grid.itens_estoque
for select
using (hub.can_access_grid());

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
  or hub.current_user_role() in ('admin', 'secretaria', 'direcao', 'professor', 'grid_chefe', 'grid_funcionario')
  or solicitante_id = auth.uid()
  or aberto_por = auth.uid()
  or responsavel_id = auth.uid()
);

drop policy if exists chamados_insert_policy on grid.chamados;
create policy chamados_insert_policy on grid.chamados
for insert
with check (
  hub.is_grid_manager()
  or (hub.can_access_grid() and coalesce(solicitante_id, aberto_por) = auth.uid())
  or (hub.can_access_grid() and solicitante_nome is not null)
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
    select 1 from grid.chamados c
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
using (hub.can_access_grid());

drop policy if exists movimentacoes_insert_grid on grid.movimentacoes_estoque;
create policy movimentacoes_insert_grid on grid.movimentacoes_estoque
for insert
with check (hub.current_user_role() in ('admin', 'manutencao', 'gerente_manutencao', 'direcao', 'grid_chefe', 'grid_funcionario'));

drop policy if exists chamado_itens_read_grid on grid.chamado_itens;
create policy chamado_itens_read_grid on grid.chamado_itens
for select
using (hub.can_access_grid());

drop policy if exists chamado_itens_manage_grid on grid.chamado_itens;
create policy chamado_itens_manage_grid on grid.chamado_itens
for all
using (hub.is_grid_manager())
with check (hub.is_grid_manager());

drop policy if exists reservas_read_grid on grid.reservas_estoque;
create policy reservas_read_grid on grid.reservas_estoque
for select
using (hub.can_access_grid());

drop policy if exists reservas_manage_grid on grid.reservas_estoque;
create policy reservas_manage_grid on grid.reservas_estoque
for all
using (hub.is_grid_manager())
with check (hub.is_grid_manager());

drop policy if exists anexos_read_grid on grid.anexos_chamado;
create policy anexos_read_grid on grid.anexos_chamado
for select
using (
  hub.can_access_grid()
  or exists (
    select 1 from grid.chamados c
    where c.id = anexos_chamado.chamado_id
      and (c.solicitante_id = auth.uid() or c.aberto_por = auth.uid() or c.responsavel_id = auth.uid())
  )
);

drop policy if exists anexos_write_grid on grid.anexos_chamado;
create policy anexos_write_grid on grid.anexos_chamado
for all
using (hub.can_access_grid())
with check (hub.can_access_grid());

drop policy if exists relatorios_grid_read on grid.relatorios;
create policy relatorios_grid_read on grid.relatorios
for select
using (hub.current_user_role() in ('admin', 'secretaria', 'direcao', 'gerente_manutencao', 'grid_chefe'));

drop policy if exists relatorios_grid_manage on grid.relatorios;
create policy relatorios_grid_manage on grid.relatorios
for all
using (hub.current_user_role() in ('admin', 'direcao', 'gerente_manutencao', 'grid_chefe'))
with check (hub.current_user_role() in ('admin', 'direcao', 'gerente_manutencao', 'grid_chefe'));

-- ============================================================================
-- VIEWS ÚTEIS PARA O APP
-- ============================================================================

create or replace view public.connect_alunos_view
with (security_invoker = true) as
select
  a.id,
  a.usuario_id,
  coalesce(a.nome, a.full_name, u.nome) as nome,
  coalesce(a.email_institucional, u.email_institucional, u.email, a.email) as email_institucional,
  coalesce(a.rm, a.matricula, a.registration_number) as rm,
  t.nome as turma_nome,
  c.nome as curso_nome,
  a.empresa_nome,
  a.status,
  a.foto_arquivo_id,
  a.foto_url,
  coalesce(l.dentro_do_senai, false) as dentro_do_senai
from connect.alunos a
left join hub.usuarios u on u.id = a.usuario_id
left join connect.turmas t on t.id = a.turma_id
left join connect.cursos c on c.id = a.curso_id
left join connect.localizacoes_alunos l on l.aluno_id = a.id;

create or replace view public.connect_professores_view
with (security_invoker = true) as
select
  p.id,
  p.usuario_id,
  coalesce(p.nome, p.full_name, u.nome) as nome,
  coalesce(u.email_institucional, u.email, p.email) as email_institucional,
  coalesce(p.especialidade, p.specialty) as especialidade,
  count(pt.id)::int as turmas,
  p.status
from connect.professores p
left join hub.usuarios u on u.id = p.usuario_id
left join connect.professor_turmas pt on pt.professor_id = p.id and pt.ativo
group by p.id, u.id;

create or replace view public.grid_chamados_view
with (security_invoker = true) as
select
  c.id,
  c.codigo,
  coalesce(c.solicitante_nome, us.nome) as solicitante_nome,
  c.titulo,
  c.descricao,
  coalesce(s.nome, c.sala_texto, '-') as sala,
  coalesce(b.nome, c.bloco_texto, '-') as bloco,
  c.prioridade,
  c.status,
  coalesce(c.responsavel_nome, ur.nome) as responsavel_nome,
  ie.titulo as item_nome,
  c.criado_em
from grid.chamados c
left join hub.usuarios us on us.id = c.solicitante_id
left join hub.usuarios ur on ur.id = c.responsavel_id
left join hub.salas s on s.id = c.sala_id
left join hub.blocos b on b.id = c.bloco_id
left join grid.itens_estoque ie on ie.id = c.item_atribuido_id;

create or replace view public.grid_tarefas_view
with (security_invoker = true) as
select
  t.id,
  c.codigo,
  coalesce(t.titulo, c.titulo) as titulo,
  coalesce(t.descricao, c.descricao) as descricao,
  t.prioridade,
  t.status,
  ur.nome as responsavel_nome,
  t.item_id,
  t.inicio_reparo,
  t.fim_reparo,
  t.observacao,
  c.criado_em
from grid.tarefas t
left join grid.chamados c on c.id = t.chamado_id
left join hub.usuarios ur on ur.id = t.responsavel_id;

-- ============================================================================
-- VIEWS PÚBLICAS DE COMPATIBILIDADE COM O SITE LARAVEL ANTIGO
-- Estas views ajudam a migrar o site. Para máxima segurança, use escrita direta
-- nas tabelas dos schemas hub/connect/grid ou endpoints backend com service role.
-- ============================================================================

create or replace view public.usuarios
with (security_invoker = true) as
select * from hub.usuarios;

create or replace view public.arquivos
with (security_invoker = true) as
select * from hub.arquivos;

create or replace view public.users
with (security_invoker = true) as
select
  u.id,
  u.nome as name,
  u.email,
  u.email_verified_at,
  c.senha_hash as password,
  u.tipo_usuario::text as role,
  u.custom_permissions,
  u.company_name,
  coalesce(u.avatar_url, u.foto_url) as avatar_url,
  c.remember_token,
  u.created_at,
  u.updated_at
from hub.usuarios u
left join hub.credenciais_legadas c on c.usuario_id = u.id;

create or replace view public.applications
with (security_invoker = true) as
select
  id,
  coalesce(slug, codigo) as slug,
  coalesce(name, nome) as name,
  coalesce(description, descricao) as description,
  route_path,
  icon,
  sort_order,
  is_active,
  created_at,
  updated_at
from hub.aplicacoes;

create or replace view public.application_user
with (security_invoker = true) as
select
  id,
  aplicacao_id as application_id,
  usuario_id as user_id,
  created_at,
  updated_at
from hub.usuario_aplicacoes;

create or replace view public.hub_people
with (security_invoker = true) as
select
  id,
  kind,
  usuario_id as user_id,
  full_name,
  cpf,
  registration_number,
  email,
  phone,
  birth_date,
  specialty,
  metadata,
  status,
  created_at,
  updated_at
from hub.pessoas;

create or replace view public.report_presets
with (security_invoker = true) as
select
  id,
  usuario_id as user_id,
  modulo as module,
  nome as name,
  configuracao as config,
  compartilhado as is_shared,
  created_at,
  updated_at
from hub.report_presets;

create or replace view public.spreadsheet_import_logs
with (security_invoker = true) as
select
  id,
  usuario_id as user_id,
  modulo as module,
  spreadsheet_key,
  filename,
  rows_total,
  created_count,
  updated_count,
  errors_count,
  status,
  created_at,
  updated_at
from hub.spreadsheet_import_logs;

create or replace view public.connect_courses
with (security_invoker = true) as
select
  id,
  code,
  name,
  description,
  workload_hours,
  area,
  status,
  created_at,
  updated_at
from connect.cursos;

create or replace view public.connect_teachers
with (security_invoker = true) as
select
  id,
  pessoa_id as hub_person_id,
  usuario_id as user_id,
  full_name,
  cpf,
  email,
  coalesce(phone, telefone, celular) as phone,
  specialty,
  status::text as status,
  created_at,
  updated_at
from connect.professores;

create or replace view public.connect_classes
with (security_invoker = true) as
select
  id,
  curso_id as connect_course_id,
  professor_responsavel_id as connect_teacher_id,
  code,
  name,
  periodo::text as shift,
  data_inicio as start_date,
  data_termino as end_date,
  capacidade as capacity,
  default_lessons_per_day,
  max_absences_allowed,
  status,
  created_at,
  updated_at
from connect.turmas;

create or replace view public.connect_students
with (security_invoker = true) as
select
  id,
  pessoa_id as hub_person_id,
  usuario_id as user_id,
  turma_id as connect_class_id,
  full_name,
  cpf,
  coalesce(registration_number, matricula, rm) as registration_number,
  coalesce(email, email_institucional, email_pessoal) as email,
  coalesce(phone, telefone) as phone,
  coalesce(birth_date, data_nascimento) as birth_date,
  status::text as status,
  max_absences_allowed,
  created_at,
  updated_at
from connect.alunos;

create or replace view public.connect_course_hub_person
with (security_invoker = true) as
select
  id,
  curso_id as connect_course_id,
  pessoa_id as hub_person_id,
  papel as role,
  status,
  matriculado_em as enrolled_at,
  created_at,
  updated_at
from connect.curso_pessoas;

create or replace view public.connect_class_hub_person
with (security_invoker = true) as
select
  id,
  turma_id as connect_class_id,
  pessoa_id as hub_person_id,
  papel as role,
  status,
  entrou_em as joined_at,
  created_at,
  updated_at
from connect.turma_pessoas;

create or replace view public.connect_attendance_sessions
with (security_invoker = true) as
select
  id,
  turma_id as connect_class_id,
  professor_id as connect_teacher_id,
  data_aula as session_date,
  disciplina as subject,
  lessons_count,
  status,
  created_at,
  updated_at
from connect.aulas;

create or replace view public.connect_attendance_marks
with (security_invoker = true) as
select
  id,
  aula_id as connect_attendance_session_id,
  aluno_id as connect_student_id,
  status::text as status,
  missed_lessons,
  notes,
  created_at,
  updated_at
from connect.frequencias;

create or replace view public.connect_contracts
with (security_invoker = true) as
select
  id,
  aluno_id as connect_student_id,
  contract_type,
  weekly_hours,
  data_inicio as start_date,
  coalesce(data_fim, data_termino) as end_date,
  monthly_value,
  coalesce(company_name, empresa_nome) as company_name,
  coalesce(company_email, email_empresa) as company_email,
  status,
  created_at,
  updated_at
from connect.contratos_alunos;

create or replace view public.connect_salary_records
with (security_invoker = true) as
select
  id,
  aluno_id as connect_student_id,
  reference_month,
  base_amount,
  deductions,
  bonuses,
  net_amount,
  status,
  coalesce(calculated_at, calculado_em) as calculated_at,
  created_at,
  updated_at
from connect.salarios_alunos;

create or replace view public.connect_student_locations
with (security_invoker = true) as
select
  id,
  aluno_id as connect_student_id,
  latitude,
  longitude,
  endereco as address,
  cidade as city,
  estado as state,
  last_seen_at,
  status,
  created_at,
  updated_at
from connect.localizacoes_alunos;

create or replace view public.connect_activities
with (security_invoker = true) as
select
  id,
  titulo as title,
  descricao as description,
  tipo as type,
  entidade_tipo as entity_type,
  entidade_id as entity_id,
  executado_por::text as performed_by,
  occurred_at,
  created_at,
  updated_at
from connect.atividades;

create or replace view public.connect_alerts
with (security_invoker = true) as
select
  id,
  titulo as title,
  mensagem as message,
  tipo as type,
  categoria as category,
  entidade_tipo as entity_type,
  entidade_id as entity_id,
  is_read,
  created_at,
  updated_at
from connect.alertas;

create or replace view public.connect_dashboard_metrics
with (security_invoker = true) as
select
  id,
  chave as key,
  valor as value,
  created_at,
  updated_at
from connect.metricas_dashboard;

create or replace view public.grid_tickets
with (security_invoker = true) as
select
  id,
  codigo as code,
  solicitante_nome as requester,
  titulo as title,
  resumo as summary,
  sala_texto as room,
  bloco_texto as block,
  prioridade::text as priority,
  status::text as status,
  responsavel_nome as assignee,
  coalesce(data_abertura, criado_em) as opened_at,
  iniciado_em as started_at,
  concluido_em as completed_at,
  resumo_resolucao as resolution_summary,
  descricao_corrigida as fixed_description,
  consideracoes as considerations,
  avaliacao_nota as evaluation_rating,
  avaliacao_observacao as evaluation_notes,
  avaliado_por as evaluated_by,
  avaliado_em as evaluated_at,
  aprovado_por as approved_by,
  aprovado_em as approved_at,
  observacoes_aprovacao as approval_notes,
  created_at,
  updated_at
from grid.chamados;

create or replace view public.grid_tasks
with (security_invoker = true) as
select
  id,
  chamado_id as grid_ticket_id,
  codigo as code,
  aberto_por as opened_by,
  titulo as title,
  descricao as description,
  sala_texto as room,
  bloco_texto as block,
  aberto_em as opened_at,
  responsavel_id::text as assignee,
  items,
  inventory_items,
  prioridade::text as priority,
  coluna as column,
  status_label,
  concluido_em as completed_at,
  created_at,
  updated_at
from grid.tarefas;

create or replace view public.grid_inventory_items
with (security_invoker = true) as
select
  id,
  titulo as title,
  descricao as description,
  categoria_texto as category,
  sku,
  imagem_url as image_url,
  quantidade_disponivel as qty_available,
  quantidade_reservada as qty_reserved,
  quantidade_minima as qty_min,
  localizacao as location,
  coalesce(fornecedor_nome, empresa_distribuidora) as supplier,
  data_compra as purchased_at,
  custo as cost,
  status::text as status,
  created_at,
  updated_at
from grid.itens_estoque;

create or replace view public.grid_inventory_reservations
with (security_invoker = true) as
select
  id,
  tarefa_id as grid_task_id,
  chamado_id as grid_ticket_id,
  item_id as grid_inventory_item_id,
  quantidade as quantity,
  status,
  created_at,
  updated_at
from grid.reservas_estoque;

create or replace view public.grid_users
with (security_invoker = true) as
select
  id,
  nome as name,
  email,
  telefone as phone,
  tipo_usuario::text as role,
  cpf,
  status::text as status,
  created_at,
  updated_at
from hub.usuarios
where tipo_usuario in ('admin', 'direcao', 'manutencao', 'gerente_manutencao', 'grid_chefe', 'grid_funcionario');

-- Grants das views públicas de compatibilidade.
grant select on
  public.usuarios,
  public.arquivos,
  public.users,
  public.applications,
  public.application_user,
  public.hub_people,
  public.report_presets,
  public.spreadsheet_import_logs,
  public.connect_courses,
  public.connect_teachers,
  public.connect_classes,
  public.connect_students,
  public.connect_course_hub_person,
  public.connect_class_hub_person,
  public.connect_attendance_sessions,
  public.connect_attendance_marks,
  public.connect_contracts,
  public.connect_salary_records,
  public.connect_student_locations,
  public.connect_activities,
  public.connect_alerts,
  public.connect_dashboard_metrics,
  public.grid_tickets,
  public.grid_tasks,
  public.grid_inventory_items,
  public.grid_inventory_reservations,
  public.grid_users,
  public.connect_alunos_view,
  public.connect_professores_view,
  public.grid_chamados_view,
  public.grid_tarefas_view
to anon, authenticated, service_role;

commit;
