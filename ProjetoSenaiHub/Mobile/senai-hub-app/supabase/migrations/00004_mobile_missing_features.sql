-- Recursos mobile faltantes: fotos, anexos, geofence, calculos e estoque.

alter table if exists hub.usuarios
  add column if not exists foto_arquivo_id uuid references hub.arquivos(id);

alter table if exists connect.alunos
  add column if not exists foto_arquivo_id uuid references hub.arquivos(id);

alter table if exists connect.localizacoes_alunos
  add column if not exists dentro_do_senai boolean default false,
  add column if not exists dentro_perimetro boolean default false,
  add column if not exists em_aula boolean default false,
  add column if not exists data_hora timestamptz default now(),
  add column if not exists atualizado_em timestamptz default now(),
  add column if not exists precisao_metros numeric;

create table if not exists grid.anexos_chamado (
  id uuid primary key default gen_random_uuid(),
  chamado_id uuid not null references grid.chamados(id) on delete cascade,
  arquivo_id uuid references hub.arquivos(id) on delete set null,
  tipo text not null default 'abertura',
  url text,
  criado_em timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists connect.professor_turmas (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references connect.professores(id) on delete cascade,
  turma_id uuid not null references connect.turmas(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (professor_id, turma_id)
);

create table if not exists connect.calculos_salario (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references connect.alunos(id) on delete cascade,
  contrato_id uuid references connect.contratos_alunos(id) on delete set null,
  empresa_id uuid references connect.empresas(id) on delete set null,
  mes_referencia text not null,
  salario_base numeric not null default 0,
  valor_dia numeric not null default 0,
  desconto numeric not null default 0,
  salario_final numeric not null default 0,
  frequencia_percentual numeric not null default 0,
  dias_trabalhados integer not null default 0,
  faltas_injustificadas integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (aluno_id, mes_referencia)
);

alter table if exists connect.salarios_alunos
  add column if not exists valor_dia numeric,
  add column if not exists desconto numeric,
  add column if not exists frequencia_percentual numeric,
  add column if not exists dias_trabalhados integer,
  add column if not exists faltas_injustificadas integer;

do $$
begin
  if to_regclass('grid.itens_estoque') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'grid'
        and table_name = 'itens_estoque'
        and column_name = 'status'
    )
  then
    alter table grid.itens_estoque
      drop constraint if exists itens_estoque_status_check;

    alter table grid.itens_estoque
      alter column status drop default;

    alter table grid.itens_estoque
      alter column status type text
      using case
        when lower(status::text) = 'disponivel' then 'disponivel'
        else 'indisponivel'
      end;

    update grid.itens_estoque
    set status = case
      when lower(status::text) = 'disponivel' then 'disponivel'
      else 'indisponivel'
    end;

    alter table grid.itens_estoque
      add constraint itens_estoque_status_check
      check (status in ('disponivel', 'indisponivel'));

    alter table grid.itens_estoque
      alter column status set default 'disponivel';
  end if;
end $$;
