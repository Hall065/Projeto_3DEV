import { supabase } from '@/lib/supabase';
import { connectService } from '@/services/connect.service';
import { createAuthUserProfile } from '@/services/user-profile.service';
import { uploadService } from '@/services/upload.service';
import type { AuthSession } from '@/types/auth.types';
import type { ContratoAluno, Empresa, FrequenciaRegistro, SalarioAluno } from '@/types/connect.types';

const schema = 'connect';

function mapEmpresa(row: Record<string, unknown>): Empresa {
  return {
    id: row.id as string,
    nome: row.nome as string,
    cnpj: (row.cnpj as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    telefone: (row.telefone as string | null) ?? null,
    responsavel_nome: (row.responsavel_nome as string | null) ?? null,
    status: (row.status as string | null) ?? null,
    usuario_id: (row.usuario_id as string | null) ?? null,
  };
}

async function getEmpresaById(id: string): Promise<Empresa | null> {
  const { data, error } = await supabase.schema(schema).from('empresas').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return mapEmpresa(data as Record<string, unknown>);
}

async function getEmpresaByUsuarioId(usuarioId: string): Promise<Empresa | null> {
  const { data, error } = await supabase
    .schema(schema)
    .from('empresas')
    .select('*')
    .eq('usuario_id', usuarioId)
    .maybeSingle();
  if (error || !data) return null;
  return mapEmpresa(data as Record<string, unknown>);
}

async function getEmpresaByEmail(email: string): Promise<Empresa | null> {
  const normalized = email.trim().toLowerCase();
  const { data, error } = await supabase
    .schema(schema)
    .from('empresas')
    .select('*')
    .ilike('email', normalized)
    .maybeSingle();
  if (error || !data) return null;
  return mapEmpresa(data as Record<string, unknown>);
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  for (const targetSchema of ['hub', 'public']) {
    const { data } = await supabase
      .schema(targetSchema)
      .from('usuarios')
      .select('id')
      .or(`email.ilike.${normalized},email_institucional.ilike.${normalized}`)
      .maybeSingle();
    if (data?.id) return data.id as string;
  }
  return null;
}

async function linkUserToEmpresa(userId: string, empresaId: string) {
  await supabase.schema('hub').from('usuarios').update({ empresa_id: empresaId }).eq('id', userId);
  await supabase.schema(schema).from('empresas').update({ usuario_id: userId }).eq('id', empresaId);
}

export async function resolveEmpresaForSession(session: AuthSession | null): Promise<Empresa | null> {
  if (!session?.perfil || !['empresa', 'connect_empresa'].includes(session.perfil.tipo)) return null;

  if (session.perfil.empresa_id) {
    const byProfile = await getEmpresaById(session.perfil.empresa_id);
    if (byProfile) return byProfile;
  }

  const byUser = await getEmpresaByUsuarioId(session.userId);
  if (byUser) return byUser;

  const email = (session.email ?? session.perfil.email_institucional).trim().toLowerCase();
  return getEmpresaByEmail(email);
}

type EmpresaUserAccessInput = Pick<Empresa, 'id' | 'nome' | 'email' | 'responsavel_nome'> & {
  senha?: string | null;
  foto_uri?: string | null;
};

export async function ensureEmpresaUserAccess(empresa: EmpresaUserAccessInput): Promise<string | null> {
  const email = empresa.email?.trim().toLowerCase();
  if (!email) return null;

  let userId: string | null = null;
  const senha = empresa.senha?.trim() || null;

  try {
    userId = await createAuthUserProfile({
      nome: empresa.responsavel_nome ?? empresa.nome,
      email,
      senha,
      tipoUsuario: 'empresa',
      status: 'ativo',
      allowPasswordUpdate: Boolean(senha),
    });
  } catch (error) {
    if (senha) throw error;
    userId = await findUserIdByEmail(email);
  }

  if (!userId) return null;

  await linkUserToEmpresa(userId, empresa.id);
  const imageUri = empresa.foto_uri?.trim();
  if (imageUri && !imageUri.startsWith('http')) {
    await uploadService.uploadProfilePhoto(imageUri, userId);
  }
  return userId;
}

export async function listContratosByEmpresaId(empresaId: string): Promise<ContratoAluno[]> {
  const contratos = await connectService.listContratos();
  return contratos.filter((contrato) => contrato.empresa_id === empresaId);
}

export async function listAlunoIdsByEmpresaId(empresaId: string): Promise<string[]> {
  const contratos = await listContratosByEmpresaId(empresaId);
  return [...new Set(contratos.map((contrato) => contrato.aluno_id).filter(Boolean))];
}

export async function listFrequenciasByEmpresaId(empresaId: string): Promise<FrequenciaRegistro[]> {
  const alunoIds = new Set(await listAlunoIdsByEmpresaId(empresaId));
  if (alunoIds.size === 0) return [];
  const frequencias = await connectService.listFrequencias();
  return frequencias.filter((item) => alunoIds.has(item.aluno_id));
}

export async function listSalariosByEmpresaId(empresaId: string): Promise<SalarioAluno[]> {
  const salarios = await connectService.listSalarios();
  return salarios.filter((item) => item.empresa_id === empresaId);
}

export async function getEmpresaDashboardMetrics(empresaId: string) {
  const contratos = await listContratosByEmpresaId(empresaId);
  const alunoIds = new Set(contratos.map((contrato) => contrato.aluno_id));
  const frequencias = await listFrequenciasByEmpresaId(empresaId);
  const salarios = await listSalariosByEmpresaId(empresaId);

  return {
    totalContratos: contratos.length,
    contratosAtivos: contratos.filter((contrato) => contrato.status === 'ativo').length,
    totalAlunos: alunoIds.size,
    totalFrequencias: frequencias.length,
    totalSalarios: salarios.length,
  };
}
