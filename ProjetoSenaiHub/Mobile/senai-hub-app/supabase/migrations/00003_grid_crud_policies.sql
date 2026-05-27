-- Permissões REST/RLS para o módulo SENAI Grid.
-- Necessário para criar tarefas/chamados pelo app usando Supabase Auth.

GRANT USAGE ON SCHEMA hub, grid TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA hub TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA grid TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA grid TO authenticated;

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'chamados',
    'tarefas',
    'itens_estoque',
    'categorias_manutencao',
    'fornecedores'
  ]
  LOOP
    IF to_regclass(format('grid.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE grid.%I ENABLE ROW LEVEL SECURITY', table_name);

      EXECUTE format('DROP POLICY IF EXISTS %I ON grid.%I', table_name || '_select_anon', table_name);
      EXECUTE format('DROP POLICY IF EXISTS %I ON grid.%I', table_name || '_select_authenticated', table_name);
      EXECUTE format('DROP POLICY IF EXISTS %I ON grid.%I', table_name || '_insert_authenticated', table_name);
      EXECUTE format('DROP POLICY IF EXISTS %I ON grid.%I', table_name || '_update_authenticated', table_name);
      EXECUTE format('DROP POLICY IF EXISTS %I ON grid.%I', table_name || '_delete_authenticated', table_name);

      EXECUTE format(
        'CREATE POLICY %I ON grid.%I FOR SELECT TO anon USING (true)',
        table_name || '_select_anon',
        table_name
      );
      EXECUTE format(
        'CREATE POLICY %I ON grid.%I FOR SELECT TO authenticated USING (true)',
        table_name || '_select_authenticated',
        table_name
      );
      EXECUTE format(
        'CREATE POLICY %I ON grid.%I FOR INSERT TO authenticated WITH CHECK (true)',
        table_name || '_insert_authenticated',
        table_name
      );
      EXECUTE format(
        'CREATE POLICY %I ON grid.%I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)',
        table_name || '_update_authenticated',
        table_name
      );
      EXECUTE format(
        'CREATE POLICY %I ON grid.%I FOR DELETE TO authenticated USING (true)',
        table_name || '_delete_authenticated',
        table_name
      );
    END IF;
  END LOOP;
END $$;
