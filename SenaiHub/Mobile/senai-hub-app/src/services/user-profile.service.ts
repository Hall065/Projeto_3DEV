import { supabase } from '@/lib/supabase';

type CreateUserProfileInput = {
  nome: string;
  email: string;
  senha?: string | null;
  tipoUsuario: string;
  telefone?: string | null;
  cpf?: string | null;
  status?: string | null;
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

export async function createAuthUserProfile(input: CreateUserProfileInput): Promise<string> {
  const email = nullIfEmpty(input.email)?.toLowerCase();
  if (!email) {
    throw new Error('Informe o e-mail institucional para criar o usuário no Supabase Auth.');
  }

  const nome = nullIfEmpty(input.nome);
  if (!nome) {
    throw new Error('Informe o nome completo do usuário.');
  }

  const { data, error } = await supabase.functions.invoke<CreateUserProfileResponse>(
    'create-user-profile',
    {
      body: {
        email,
        password: nullIfEmpty(input.senha) ?? DEFAULT_TEMPORARY_PASSWORD,
        nome,
        tipo_usuario: input.tipoUsuario,
        email_institucional: email,
        telefone: nullIfEmpty(input.telefone),
        cpf: nullIfEmpty(input.cpf),
        status: nullIfEmpty(input.status) ?? 'ativo',
      },
    }
  );

  if (error) {
    throw new Error(error.message || 'Não foi possível criar o usuário no Supabase Auth.');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.userId) {
    throw new Error('A Edge Function não retornou o ID do usuário criado.');
  }

  return data.userId;
}

