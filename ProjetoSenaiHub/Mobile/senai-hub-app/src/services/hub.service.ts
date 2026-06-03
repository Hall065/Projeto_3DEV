import { supabase } from '@/lib/supabase';
import type { HubUsuario, UsuarioAplicacao } from '@/types/auth.types';

async function fetchArquivoUrl(arquivoId?: string | null) {
  if (!arquivoId) return null;

  for (const targetSchema of ['hub', 'public']) {
    const { data, error } = await supabase
      .schema(targetSchema)
      .from('arquivos')
      .select('url_segura')
      .eq('id', arquivoId)
      .maybeSingle();

    if (!error) return (data as { url_segura?: string } | null)?.url_segura ?? null;
  }

  return null;
}

export async function fetchUserProfile(email: string): Promise<HubUsuario | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabase
    .from('usuarios')
    .select(
      `
      id,
      nome,
      email,
      email_institucional,
      tipo_usuario,
      status,
      telefone,
      cpf,
      foto_arquivo_id,
      criado_em,
      atualizado_em,
      created_at,
      updated_at
    `
    )
    .or(`email.ilike.${normalizedEmail},email_institucional.ilike.${normalizedEmail}`)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar perfil:', error);
    return null;
  }

  if (!data) return null;

  const row = data as Record<string, any>;
  const fotoArquivoId = row.foto_arquivo_id as string | null | undefined;
  const fotoUrl = await fetchArquivoUrl(fotoArquivoId);

  return {
    id: row.id,
    nome: row.nome,
    email_institucional: row.email_institucional ?? row.email,
    tipo: row.tipo_usuario,
    status: row.status,
    telefone: row.telefone,
    cpf: row.cpf,
    foto_arquivo_id: fotoArquivoId,
    foto_url: fotoUrl,
    created_at: row.criado_em ?? row.created_at,
    updated_at: row.atualizado_em ?? row.updated_at,
  } as HubUsuario;
}

export async function updateUserProfile(
  userId: string,
  values: Pick<HubUsuario, 'nome' | 'email_institucional' | 'telefone' | 'cpf'>
) {
  const payload = {
    nome: values.nome,
    email_institucional: values.email_institucional,
    telefone: values.telefone,
    cpf: values.cpf,
  };

  let lastError: unknown = null;
  for (const targetSchema of ['hub', 'public']) {
    const { data, error } = await supabase
      .schema(targetSchema)
      .from('usuarios')
      .update(payload)
      .eq('id', userId)
      .select('*')
      .single();
    if (!error) return data;
    lastError = error;
  }
  throw lastError;
}

export async function updateUserPhoto(userId: string, arquivoId: string) {
  let lastError: unknown = null;
  for (const targetSchema of ['hub', 'public']) {
    const { error } = await supabase
      .schema(targetSchema)
      .from('usuarios')
      .update({ foto_arquivo_id: arquivoId } as never)
      .eq('id', userId);
    if (!error) return;
    lastError = error;
  }
  throw lastError;
}

export async function fetchUserApplications(userId: string): Promise<UsuarioAplicacao[]> {
  const { data, error } = await supabase
    .from('usuario_aplicacoes')
    .select('id, usuario_id, aplicacao_id, aplicacoes(codigo, nome)')
    .eq('usuario_id', userId);

  if (error || !data) return [];

  return (data as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    usuario_id: row.usuario_id as string,
    aplicacao_id: row.aplicacao_id as string,
    aplicacao_codigo: (row.aplicacoes as { codigo?: string })?.codigo,
    aplicacao_nome: (row.aplicacoes as { nome?: string })?.nome,
  }));
}

export async function fetchHubApplications() {
  const { data, error } = await supabase.from('aplicacoes').select('*');
  if (error) throw error;
  return data ?? [];
}
