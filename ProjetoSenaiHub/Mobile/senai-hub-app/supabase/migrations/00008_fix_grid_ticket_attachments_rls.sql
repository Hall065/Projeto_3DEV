-- Corrige POST 403 em grid.anexos_chamado usado pelo cadastro de chamados no mobile.
-- O chamado pode ser criado, mas o vinculo da imagem precisa destas permissoes RLS.

grant usage on schema hub, grid to anon, authenticated;

do $$
begin
  if to_regclass('hub.arquivos') is not null then
    execute 'grant select on hub.arquivos to anon, authenticated';
    execute 'grant insert, update on hub.arquivos to authenticated';
    execute 'alter table hub.arquivos enable row level security';

    execute 'drop policy if exists mobile_arquivos_select on hub.arquivos';
    execute 'drop policy if exists mobile_arquivos_insert on hub.arquivos';
    execute 'drop policy if exists mobile_arquivos_update_own on hub.arquivos';

    execute 'create policy mobile_arquivos_select on hub.arquivos for select to anon, authenticated using (true)';
    execute 'create policy mobile_arquivos_insert on hub.arquivos for insert to authenticated with check (true)';
    execute 'create policy mobile_arquivos_update_own on hub.arquivos for update to authenticated using (enviado_por = auth.uid()) with check (enviado_por = auth.uid())';
  end if;

  if to_regclass('grid.anexos_chamado') is not null then
    execute 'grant select on grid.anexos_chamado to anon, authenticated';
    execute 'grant insert, update, delete on grid.anexos_chamado to authenticated';
    execute 'alter table grid.anexos_chamado enable row level security';

    execute 'drop policy if exists mobile_anexos_chamado_select on grid.anexos_chamado';
    execute 'drop policy if exists mobile_anexos_chamado_insert on grid.anexos_chamado';
    execute 'drop policy if exists mobile_anexos_chamado_update on grid.anexos_chamado';
    execute 'drop policy if exists mobile_anexos_chamado_delete on grid.anexos_chamado';

    execute 'create policy mobile_anexos_chamado_select on grid.anexos_chamado for select to anon, authenticated using (true)';
    execute 'create policy mobile_anexos_chamado_insert on grid.anexos_chamado for insert to authenticated with check (auth.uid() is not null)';
    execute 'create policy mobile_anexos_chamado_update on grid.anexos_chamado for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null)';
    execute 'create policy mobile_anexos_chamado_delete on grid.anexos_chamado for delete to authenticated using (auth.uid() is not null)';
  end if;
end $$;
