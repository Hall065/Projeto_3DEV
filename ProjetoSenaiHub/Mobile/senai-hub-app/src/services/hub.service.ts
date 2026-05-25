import { supabase } from '@/lib/supabase';
import type { HubUsuario, UsuarioAplicacao } from '@/types/auth.types';

export async function fetchUserProfile(email: string): Promise<HubUsuario | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabase
    .from('usuarios')
    .select(`
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
      atualizado_em
    `)
    .or(`email.ilike.${normalizedEmail},email_institucional.ilike.${normalizedEmail}`)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar perfil:', error);
    return null;
  }

  if (!data) return null;

  // Mapear campos do banco para a interface HubUsuario
  return {
    id: data.id,
    nome: data.nome,
    email_institucional: data.email_institucional ?? data.email,
    tipo: data.tipo_usuario,
    status: data.status,
    telefone: data.telefone,
    cpf: data.cpf,
    foto_url: null, // foto_url não existe no banco, apenas foto_arquivo_id
    created_at: data.criado_em,
    updated_at: data.atualizado_em,
  } as HubUsuario;
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
