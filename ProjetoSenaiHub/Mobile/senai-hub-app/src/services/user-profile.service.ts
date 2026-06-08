import { supabase } from '@/lib/supabase';
import { supabaseAnonKey, supabaseUrl } from '@/lib/supabase-config';

type CreateUserProfileInput = {
  nome: string;
  email: string;
  senha?: string | null;
  tipoUsuario: string;
  telefone?: string | null;
  cpf?: string | null;
  status?: string | null;
  allowPasswordUpdate?: boolean;
};

type CreateUserProfileResponse = {
  userId?: string;
  error?: string;
};

const DEFAULT_TEMPORARY_PASSWORD = 'Senai@123456';

function nullIfEmpty(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

async function getFunctionErrorMessage(response: Response) {
  const fallback = `A Edge Function create-user-profile retornou erro ${response.status}.`;
  const body = await response.text().catch(() => '');
  if (!body) return fallback;

  try {
    const parsed = JSON.parse(body) as CreateUserProfileResponse & { message?: string };
    return parsed.error || parsed.message || fallback;
  } catch {
    return `${fallback} ${body}`;
  }
}

export async function createAuthUserProfile(input: CreateUserProfileInput): Promise<string> {
  const email = nullIfEmpty(input.email)?.toLowerCase();
  if (!email) {
    throw new Error('Informe o e-mail institucional para criar o usuario no Supabase Auth.');
  }

  const nome = nullIfEmpty(input.nome);
  if (!nome) {
    throw new Error('Informe o nome completo do usuario.');
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    throw new Error('Entre novamente com uma conta administradora antes de cadastrar usuarios.');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/create-user-profile`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password: nullIfEmpty(input.senha) ?? DEFAULT_TEMPORARY_PASSWORD,
      nome,
      tipo_usuario: input.tipoUsuario,
      email_institucional: email,
      telefone: nullIfEmpty(input.telefone),
      cpf: nullIfEmpty(input.cpf),
      status: nullIfEmpty(input.status) ?? 'ativo',
      allow_password_update: input.allowPasswordUpdate === true,
    }),
  });

  if (!response.ok) {
    throw new Error(await getFunctionErrorMessage(response));
  }

  const data = (await response.json()) as CreateUserProfileResponse;

  if (data.error) {
    throw new Error(data.error);
  }

  if (!data.userId) {
    throw new Error('A Edge Function nao retornou o ID do usuario criado.');
  }

  return data.userId;
}
