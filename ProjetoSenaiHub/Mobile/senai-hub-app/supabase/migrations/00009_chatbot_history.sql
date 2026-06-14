create schema if not exists hub;
create extension if not exists pgcrypto;

create table if not exists hub.chatbot_conversas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null,
  titulo text not null default 'Nova conversa',
  status text not null default 'ativa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chatbot_conversas_status_check check (status in ('ativa', 'arquivada'))
);

create table if not exists hub.chatbot_mensagens (
  id uuid primary key default gen_random_uuid(),
  conversa_id uuid not null references hub.chatbot_conversas(id) on delete cascade,
  usuario_id uuid not null,
  role text not null,
  conteudo text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint chatbot_mensagens_role_check check (role in ('user', 'assistant', 'system'))
);

create index if not exists chatbot_conversas_usuario_updated_idx
  on hub.chatbot_conversas (usuario_id, updated_at desc);

create index if not exists chatbot_mensagens_conversa_created_idx
  on hub.chatbot_mensagens (conversa_id, created_at asc);

create or replace function hub.set_chatbot_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_chatbot_conversas_updated_at on hub.chatbot_conversas;
create trigger set_chatbot_conversas_updated_at
before update on hub.chatbot_conversas
for each row execute function hub.set_chatbot_updated_at();

alter table hub.chatbot_conversas enable row level security;
alter table hub.chatbot_mensagens enable row level security;

drop policy if exists "chatbot conversas select own" on hub.chatbot_conversas;
create policy "chatbot conversas select own"
on hub.chatbot_conversas
for select
to authenticated
using (usuario_id = auth.uid());

drop policy if exists "chatbot conversas insert own" on hub.chatbot_conversas;
create policy "chatbot conversas insert own"
on hub.chatbot_conversas
for insert
to authenticated
with check (usuario_id = auth.uid());

drop policy if exists "chatbot conversas update own" on hub.chatbot_conversas;
create policy "chatbot conversas update own"
on hub.chatbot_conversas
for update
to authenticated
using (usuario_id = auth.uid())
with check (usuario_id = auth.uid());

drop policy if exists "chatbot mensagens select own" on hub.chatbot_mensagens;
create policy "chatbot mensagens select own"
on hub.chatbot_mensagens
for select
to authenticated
using (
  usuario_id = auth.uid()
  and exists (
    select 1
    from hub.chatbot_conversas c
    where c.id = conversa_id
      and c.usuario_id = auth.uid()
  )
);

drop policy if exists "chatbot mensagens insert own" on hub.chatbot_mensagens;
create policy "chatbot mensagens insert own"
on hub.chatbot_mensagens
for insert
to authenticated
with check (
  usuario_id = auth.uid()
  and exists (
    select 1
    from hub.chatbot_conversas c
    where c.id = conversa_id
      and c.usuario_id = auth.uid()
  )
);
