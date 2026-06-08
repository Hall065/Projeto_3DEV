-- Permissoes mobile para fotos de perfil e anexos de chamados.

grant usage on schema hub, grid to anon, authenticated;

grant select on hub.arquivos to anon, authenticated;
grant insert, update on hub.arquivos to authenticated;

grant select on hub.usuarios to anon, authenticated;
grant update on hub.usuarios to authenticated;

grant select on grid.anexos_chamado to anon, authenticated;
grant insert, update, delete on grid.anexos_chamado to authenticated;

alter table if exists hub.arquivos enable row level security;
alter table if exists hub.usuarios enable row level security;
alter table if exists grid.anexos_chamado enable row level security;

drop policy if exists mobile_arquivos_select on hub.arquivos;
drop policy if exists mobile_arquivos_insert on hub.arquivos;
drop policy if exists mobile_arquivos_update_own on hub.arquivos;

create policy mobile_arquivos_select
  on hub.arquivos for select
  to anon, authenticated
  using (true);

create policy mobile_arquivos_insert
  on hub.arquivos for insert
  to authenticated
  with check (true);

create policy mobile_arquivos_update_own
  on hub.arquivos for update
  to authenticated
  using (enviado_por = auth.uid())
  with check (enviado_por = auth.uid());

drop policy if exists mobile_usuarios_select on hub.usuarios;
drop policy if exists mobile_usuarios_update_own_profile on hub.usuarios;

create policy mobile_usuarios_select
  on hub.usuarios for select
  to anon, authenticated
  using (true);

create policy mobile_usuarios_update_own_profile
  on hub.usuarios for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists mobile_anexos_chamado_select on grid.anexos_chamado;
drop policy if exists mobile_anexos_chamado_insert on grid.anexos_chamado;
drop policy if exists mobile_anexos_chamado_update on grid.anexos_chamado;
drop policy if exists mobile_anexos_chamado_delete on grid.anexos_chamado;

create policy mobile_anexos_chamado_select
  on grid.anexos_chamado for select
  to anon, authenticated
  using (true);

create policy mobile_anexos_chamado_insert
  on grid.anexos_chamado for insert
  to authenticated
  with check (true);

create policy mobile_anexos_chamado_update
  on grid.anexos_chamado for update
  to authenticated
  using (true)
  with check (true);

create policy mobile_anexos_chamado_delete
  on grid.anexos_chamado for delete
  to authenticated
  using (true);
