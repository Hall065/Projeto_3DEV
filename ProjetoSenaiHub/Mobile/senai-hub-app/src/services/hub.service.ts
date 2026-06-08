import { supabase } from '@/lib/supabase';
import type { HubUsuario, UsuarioAplicacao } from '@/types/auth.types';

function nonEmptyString(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

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

function isAlunoRole(tipo?: string | null) {
  return tipo === 'aluno' || tipo === 'connect_aluno';
}

async function fetchAlunoProfilePhoto(usuarioId: string) {
  const selects = ['foto_url,foto_arquivo_id', 'foto_arquivo_id', 'foto_url'];

  for (const select of selects) {
    const { data, error } = await supabase
      .schema('connect')
      .from('alunos')
      .select(select)
      .eq('usuario_id', usuarioId)
      .maybeSingle();

    if (error || !data) continue;

    const row = data as { foto_url?: string | null; foto_arquivo_id?: string | null };
    const fotoArquivoId = nonEmptyString(row.foto_arquivo_id);
    const fotoUrl = nonEmptyString(row.foto_url) ?? (await fetchArquivoUrl(fotoArquivoId));

    return {
      fotoArquivoId,
      fotoUrl,
    };
  }

  return {
    fotoArquivoId: null,
    fotoUrl: null,
  };
}

export async function fetchUserProfile(email: string): Promise<HubUsuario | null> {
  const normalizedEmail = email.trim().toLowerCase();
  let data: Record<string, any> | null = null;
  let lastError: unknown = null;

  for (const targetSchema of ['hub', 'public']) {
    const result = await supabase
      .schema(targetSchema)
      .from('usuarios')
      .select('*')
      .or(`email.ilike.${normalizedEmail},email_institucional.ilike.${normalizedEmail}`)
      .maybeSingle();

    if (!result.error) {
      lastError = null;
      data = (result.data as Record<string, any> | null) ?? null;
      if (data) break;
      continue;
    }
    lastError = result.error;
  }

  if (lastError && !data) {
    console.error('Erro ao buscar perfil:', lastError);
    return null;
  }

  if (!data) return null;

  const row = data;
  const fotoArquivoId = nonEmptyString(row.foto_arquivo_id);
  const fotoUrl = await fetchArquivoUrl(fotoArquivoId);
  const rowFotoUrl = nonEmptyString(row.foto_url);
  const tipo = row.tipo_usuario ?? row.tipo;
  const alunoPhoto =
    !rowFotoUrl && !fotoUrl && isAlunoRole(tipo) ? await fetchAlunoProfilePhoto(row.id as string) : null;

  return {
    id: row.id,
    nome: row.nome,
    email_institucional: row.email_institucional ?? row.email,
    tipo,
    status: row.status,
    empresa_id: row.empresa_id ?? null,
    telefone: row.telefone,
    cpf: row.cpf,
    foto_arquivo_id: fotoArquivoId ?? alunoPhoto?.fotoArquivoId,
    foto_url: rowFotoUrl ?? fotoUrl ?? alunoPhoto?.fotoUrl,
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

export async function updateUserPhoto(userId: string, arquivoId: string, fotoUrl?: string | null) {
  const payloads: Record<string, string>[] = fotoUrl
    ? [{ foto_arquivo_id: arquivoId, foto_url: fotoUrl }, { foto_arquivo_id: arquivoId }, { foto_url: fotoUrl }]
    : [{ foto_arquivo_id: arquivoId }];
  let lastError: unknown = null;
  for (const targetSchema of ['hub', 'public']) {
    for (const payload of payloads) {
      const { error } = await supabase
        .schema(targetSchema)
        .from('usuarios')
        .update(payload as never)
        .eq('id', userId);
      if (!error) return;
      lastError = error;
    }
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
