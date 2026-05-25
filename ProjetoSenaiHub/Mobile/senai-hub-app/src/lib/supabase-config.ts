import Constants from 'expo-constants';

function trimEnv(value: string | undefined): string {
  return (value ?? '').trim().replace(/^["']|["']$/g, '');
}

const extra = Constants.expoConfig?.extra as
  | { supabaseUrl?: string; supabaseAnonKey?: string }
  | undefined;

export const supabaseUrl = trimEnv(
  extra?.supabaseUrl ?? process.env.EXPO_PUBLIC_SUPABASE_URL
).replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

export const supabaseAnonKey = trimEnv(
  extra?.supabaseAnonKey ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/** Apenas para diagnóstico em dev (não expõe a chave inteira). */
export function getSupabaseKeyHint(): string {
  if (!supabaseAnonKey) return 'não configurada';
  if (supabaseAnonKey.startsWith('sb_publishable_')) return 'publishable (ok)';
  if (supabaseAnonKey.startsWith('eyJ')) return 'anon JWT (legacy)';
  return 'formato desconhecido';
}
