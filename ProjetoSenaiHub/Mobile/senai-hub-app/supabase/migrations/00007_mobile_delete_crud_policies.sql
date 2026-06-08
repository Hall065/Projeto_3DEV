-- Permissoes REST/RLS usadas pelo app mobile para CRUD nas telas de cadastro.
-- Mantem o comportamento do Connect alinhado ao Grid e libera exclusao de usuarios do Hub.

GRANT USAGE ON SCHEMA hub, connect, grid TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA connect TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA connect TO authenticated;

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'alunos',
    'professores',
    'cursos',
    'turmas',
    'empresas',
    'contratos_alunos',
    'salarios_alunos',
    'frequencias',
    'localizacoes_alunos',
    'aulas',
    'professor_turmas'
  ]
  LOOP
    IF to_regclass(format('connect.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE connect.%I ENABLE ROW LEVEL SECURITY', table_name);

      EXECUTE format('DROP POLICY IF EXISTS %I ON connect.%I', table_name || '_select_anon', table_name);
      EXECUTE format('DROP POLICY IF EXISTS %I ON connect.%I', table_name || '_select_authenticated', table_name);
      EXECUTE format('DROP POLICY IF EXISTS %I ON connect.%I', table_name || '_insert_authenticated', table_name);
      EXECUTE format('DROP POLICY IF EXISTS %I ON connect.%I', table_name || '_update_authenticated', table_name);
      EXECUTE format('DROP POLICY IF EXISTS %I ON connect.%I', table_name || '_delete_authenticated', table_name);

      EXECUTE format(
        'CREATE POLICY %I ON connect.%I FOR SELECT TO anon USING (true)',
        table_name || '_select_anon',
        table_name
      );
      EXECUTE format(
        'CREATE POLICY %I ON connect.%I FOR SELECT TO authenticated USING (true)',
        table_name || '_select_authenticated',
        table_name
      );
      EXECUTE format(
        'CREATE POLICY %I ON connect.%I FOR INSERT TO authenticated WITH CHECK (true)',
        table_name || '_insert_authenticated',
        table_name
      );
      EXECUTE format(
        'CREATE POLICY %I ON connect.%I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)',
        table_name || '_update_authenticated',
        table_name
      );
      EXECUTE format(
        'CREATE POLICY %I ON connect.%I FOR DELETE TO authenticated USING (true)',
        table_name || '_delete_authenticated',
        table_name
      );
    END IF;
  END LOOP;
END $$;

DO $$
BEGIN
  IF to_regclass('hub.usuarios') IS NOT NULL THEN
    EXECUTE 'GRANT DELETE ON hub.usuarios TO authenticated';
    EXECUTE 'ALTER TABLE hub.usuarios ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS mobile_usuarios_delete_authenticated ON hub.usuarios';
    EXECUTE 'CREATE POLICY mobile_usuarios_delete_authenticated ON hub.usuarios FOR DELETE TO authenticated USING (true)';
  END IF;

  IF to_regclass('public.usuarios') IS NOT NULL THEN
    EXECUTE 'GRANT SELECT, DELETE ON public.usuarios TO authenticated';
    EXECUTE 'ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS mobile_public_usuarios_select_authenticated ON public.usuarios';
    EXECUTE 'DROP POLICY IF EXISTS mobile_public_usuarios_delete_authenticated ON public.usuarios';
    EXECUTE 'CREATE POLICY mobile_public_usuarios_select_authenticated ON public.usuarios FOR SELECT TO authenticated USING (true)';
    EXECUTE 'CREATE POLICY mobile_public_usuarios_delete_authenticated ON public.usuarios FOR DELETE TO authenticated USING (true)';
  END IF;
END $$;
